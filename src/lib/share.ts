import { randomBytes, randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "./supabase/server";
import { localStore } from "./store";
import type { CritiqueReport, Project, ProjectMeta, ReviewerReport, Revision } from "./types";

/**
 * 报告分享:token 换只读投影。
 * - 未配置 Supabase → 本地 `.data/shares/<token>.json`(与 report_shares 表同构字段)
 * - 配置了 Supabase → report_shares 表;owner 创建/列表/撤销走登录态 client(RLS 兜底,
 *   supabase/migration-002-shares.sql),公开读取(redeem)走 service role——anon 无任何
 *   select 策略,token 校验不过一律返回 null(调用方 404),不区分不存在/过期/撤销,防枚举探测。
 */

export interface ShareRecord {
  id: string;
  token: string;
  projectId: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

/** 只读投影白名单:除下列字段外的一切(Project.sections/responses/coverLetter/seminar/
 * literature 与未来新增字段)都不进公开面 */
export interface SharedProject {
  title: string;
  status: Project["status"];
  createdAt: string;
  updatedAt: string;
  meta: ProjectMeta;
  critique?: CritiqueReport;
  reviews?: ReviewerReport[];
  revision?: Revision;
}

const TOKEN_BYTES = 32; // 256-bit url-safe(深评 §9.3 要求 ≥128-bit)
const DEFAULT_TTL_DAYS = 7;
const MAX_TTL_DAYS = 90;

const genToken = () => randomBytes(TOKEN_BYTES).toString("base64url");
/** token 形态校验:base64url 32 字节恰 43 字符;不做库查询,防注入前置闸 */
export const validShareToken = (t: string) => /^[A-Za-z0-9_-]{43}$/.test(t);

export function clampTtlDays(n: unknown): number {
  const d = Math.floor(Number(n));
  return Number.isFinite(d) ? Math.min(MAX_TTL_DAYS, Math.max(1, d)) : DEFAULT_TTL_DAYS;
}

const isExpired = (rec: ShareRecord, now = Date.now()) => Date.parse(rec.expiresAt) <= now;
const isActive = (rec: ShareRecord, now = Date.now()) => !rec.revokedAt && !isExpired(rec, now);

/** 纯函数:只读投影。显式挑字段构造新对象——Project 上任何未白名单字段(含将来新增的)
 * 天然不进公开面;不改动入参 */
export function sanitizeForShare(project: Project): SharedProject {
  const shared: SharedProject = {
    title: project.title,
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    meta: {
      fileName: project.meta?.fileName,
      targetJournal: project.meta?.targetJournal,
      language: project.meta?.language,
    },
  };
  if (project.critique) shared.critique = project.critique;
  if (project.reviews) shared.reviews = project.reviews;
  if (project.revision) shared.revision = project.revision;
  return shared;
}

// ---------- 本地文件实现(`.data/shares/<token>.json` + index.json) ----------

// 生产根目录取常量(与 store.ts DATA_ROOT 同式);测试经各函数末位 root 参数注入临时目录。
// 不用 fs.readdir 枚举目录——Turbopack 对「动态目录枚举」会退化为整仓文件追踪并告警,
// 改用 index.json(projectId → token[])做列表/撤销的检索,逐 token 定名读记录文件。
const DEFAULT_SHARE_ROOT = path.join(process.cwd(), ".data", "shares");

function recordPath(token: string, root: string): string {
  if (!validShareToken(token)) throw new Error("非法分享 token");
  return path.join(root, `${token}.json`);
}

function indexPath(root: string): string {
  return path.join(root, "index.json");
}

type ShareIndex = Record<string, string[]>;

async function readIndex(root: string): Promise<ShareIndex> {
  try {
    return JSON.parse(await fs.readFile(indexPath(root), "utf8")) as ShareIndex;
  } catch {
    return {};
  }
}

async function addToIndex(root: string, projectId: string, token: string): Promise<void> {
  const idx = await readIndex(root);
  const list = idx[projectId] ?? [];
  if (list.includes(token)) return;
  await fs.mkdir(root, { recursive: true });
  idx[projectId] = [...list, token];
  await fs.writeFile(indexPath(root), JSON.stringify(idx), "utf8");
}

const localShares = {
  async read(token: string, root: string): Promise<ShareRecord | null> {
    try {
      return JSON.parse(await fs.readFile(recordPath(token, root), "utf8")) as ShareRecord;
    } catch {
      return null;
    }
  },
  async write(rec: ShareRecord, root: string): Promise<void> {
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(recordPath(rec.token, root), JSON.stringify(rec, null, 2), "utf8");
  },
};

// ---------- Supabase 实现 ----------

type ShareRow = {
  id: string;
  project_id: string;
  token: string;
  created_by: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
};

const rowToRecord = (r: ShareRow): ShareRecord => ({
  id: r.id,
  token: r.token,
  projectId: r.project_id,
  userId: r.created_by,
  createdAt: r.created_at,
  expiresAt: r.expires_at,
  revokedAt: r.revoked_at ?? null,
});

/**
 * 创建分享(登录态 + 项目归属校验由调用方路由完成)。
 * SaaS 模式走登录态 client(insert 受 RLS "share owner all" 约束),本地模式写文件。
 */
export async function createShare(
  userId: string,
  projectId: string,
  ttlDays?: number,
  localRoot: string = DEFAULT_SHARE_ROOT,
): Promise<ShareRecord> {
  const now = new Date();
  const rec: ShareRecord = {
    id: randomUUID(),
    token: genToken(),
    projectId,
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + clampTtlDays(ttlDays) * 86_400_000).toISOString(),
    revokedAt: null,
  };
  if (!isSupabaseConfigured()) {
    await localShares.write(rec, localRoot);
    await addToIndex(localRoot, projectId, rec.token);
    return rec;
  }
  const supabase = (await createSupabaseServerClient())!;
  const { error } = await supabase.from("report_shares").insert({
    id: rec.id,
    project_id: rec.projectId,
    token: rec.token,
    created_by: rec.userId,
    expires_at: rec.expiresAt,
    revoked_at: null,
    created_at: rec.createdAt,
  });
  if (error) throw new Error(`创建分享失败: ${error.message}`);
  return rec;
}

/** owner 管理视图:该稿件全部有效分享(排除已撤销与已过期) */
export async function listShares(
  userId: string,
  projectId: string,
  localRoot: string = DEFAULT_SHARE_ROOT,
): Promise<ShareRecord[]> {
  if (!isSupabaseConfigured()) {
    const idx = await readIndex(localRoot);
    const tokens = idx[projectId] ?? [];
    const recs = await Promise.all(tokens.map((t) => localShares.read(t, localRoot)));
    return recs
      .filter((r): r is ShareRecord => r !== null)
      .filter((r) => r.userId === userId && isActive(r))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  const supabase = (await createSupabaseServerClient())!;
  const { data, error } = await supabase
    .from("report_shares")
    .select("*")
    .eq("created_by", userId)
    .eq("project_id", projectId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`读取分享列表失败: ${error.message}`);
  return (data ?? []).map(rowToRecord).filter((r) => !isExpired(r));
}

/** 软撤销:置 revoked_at(留审计痕迹);分享不存在/不属于该稿件/用户 → false */
export async function revokeShare(
  userId: string,
  projectId: string,
  shareId: string,
  localRoot: string = DEFAULT_SHARE_ROOT,
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const idx = await readIndex(localRoot);
    const tokens = idx[projectId] ?? [];
    for (const token of tokens) {
      const rec = await localShares.read(token, localRoot);
      // 已撤销的记录不重复处理,与 Supabase 分支 .is("revoked_at", null) 语义一致
      if (!rec || rec.revokedAt || rec.userId !== userId || rec.projectId !== projectId) continue;
      if (rec.id === shareId) {
        await localShares.write({ ...rec, revokedAt: new Date().toISOString() }, localRoot);
        return true;
      }
    }
    return false;
  }
  const supabase = (await createSupabaseServerClient())!;
  const { data, error } = await supabase
    .from("report_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", shareId)
    .eq("created_by", userId)
    .eq("project_id", projectId)
    .is("revoked_at", null)
    .select("id");
  if (error) throw new Error(`撤销分享失败: ${error.message}`);
  return (data ?? []).length > 0;
}

/**
 * 公开兑换:token → 只读投影。任何一步不过(形态非法/记录不存在/已撤销/已过期/项目已删/
 * service key 未配)一律返回 null,调用方统一 404——不区分原因,无存在性泄露。
 */
export async function redeemShare(
  token: string,
  localRoot: string = DEFAULT_SHARE_ROOT,
): Promise<{ project: SharedProject; expiresAt: string } | null> {
  if (!validShareToken(token)) return null;

  let rec: ShareRecord | null = null;
  if (!isSupabaseConfigured()) {
    rec = await localShares.read(token, localRoot);
  } else {
    // 公开读取无登录态,anon 无 select 策略;必须 service role。未配 key 即 404(闭环失败)
    const admin = createSupabaseAdminClient();
    if (!admin) return null;
    const { data, error } = await admin
      .from("report_shares")
      .select("*")
      .eq("token", token)
      .maybeSingle();
    if (error) return null;
    rec = data ? rowToRecord(data as ShareRow) : null;
  }
  if (!rec || !isActive(rec)) return null;

  let project: Project | null;
  if (!isSupabaseConfigured()) {
    project = await localStore.get(rec.userId, rec.projectId);
  } else {
    const admin = createSupabaseAdminClient()!;
    const { data, error } = await admin
      .from("projects")
      .select("data")
      .eq("id", rec.projectId)
      .maybeSingle();
    if (error) return null;
    project = data ? (data.data as Project) : null;
  }
  if (!project) return null;
  return { project: sanitizeForShare(project), expiresAt: rec.expiresAt };
}
