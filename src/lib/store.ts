import { promises as fs } from "fs";
import path from "path";
import { createSupabaseServerClient, isSupabaseConfigured } from "./supabase/server";
import type { Project } from "./types";

/**
 * 存储抽象:
 * - 未配置 Supabase → 本地 JSON 文件(自用模式,单用户 "local")
 * - 配置了 Supabase → projects 表,按 user_id 隔离(RLS 兜底,见 supabase/migration.sql)
 */
export interface ProjectStore {
  list(userId: string): Promise<Project[]>;
  get(userId: string, id: string): Promise<Project | null>;
  save(userId: string, project: Project): Promise<void>;
  remove(userId: string, id: string): Promise<boolean>;
}

const validId = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const safeSegment = (s: string) => /^[A-Za-z0-9_-]{1,64}$/.test(s);

// ---------- 本地文件存储 ----------

const DATA_ROOT = path.join(process.cwd(), ".data", "projects");
let legacyMigrated = false;

async function userDir(userId: string): Promise<string> {
  if (!safeSegment(userId)) throw new Error("非法用户标识");
  const dir = path.join(DATA_ROOT, userId);
  await fs.mkdir(dir, { recursive: true });
  // 一次性把旧版单层目录(<M3)的数据迁入 local/
  if (userId === "local" && !legacyMigrated) {
    legacyMigrated = true;
    try {
      const entries = await fs.readdir(DATA_ROOT, { withFileTypes: true });
      for (const e of entries) {
        if (e.isFile() && e.name.endsWith(".json")) {
          await fs.rename(path.join(DATA_ROOT, e.name), path.join(dir, e.name)).catch(() => {});
        }
      }
    } catch {
      // 迁移失败不影响主流程
    }
  }
  return dir;
}

export const localStore: ProjectStore = {
  async list(userId) {
    const dir = await userDir(userId);
    const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json"));
    const out = await Promise.all(
      files.map(async (f) => {
        try {
          return JSON.parse(await fs.readFile(path.join(dir, f), "utf8")) as Project;
        } catch {
          return null;
        }
      }),
    );
    return out
      .filter((p): p is Project => p !== null)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  },

  async get(userId, id) {
    if (!validId(id) || !safeSegment(userId)) return null;
    try {
      return JSON.parse(await fs.readFile(path.join(DATA_ROOT, userId, `${id}.json`), "utf8")) as Project;
    } catch {
      return null;
    }
  },

  async save(userId, project) {
    const dir = await userDir(userId);
    project.updatedAt = new Date().toISOString();
    await fs.writeFile(path.join(dir, `${project.id}.json`), JSON.stringify(project, null, 2), "utf8");
  },

  async remove(userId, id) {
    if (!validId(id) || !safeSegment(userId)) return false;
    try {
      await fs.unlink(path.join(DATA_ROOT, userId, `${id}.json`));
      return true;
    } catch {
      return false;
    }
  },
};

// ---------- Supabase 存储 ----------

export const supabaseStore: ProjectStore = {
  async list(userId) {
    const supabase = (await createSupabaseServerClient())!;
    const { data, error } = await supabase
      .from("projects")
      .select("data")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(`读取项目失败: ${error.message}`);
    return (data ?? []).map((row) => row.data as Project);
  },

  async get(userId, id) {
    if (!validId(id)) return null;
    const supabase = (await createSupabaseServerClient())!;
    const { data, error } = await supabase
      .from("projects")
      .select("data")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`读取项目失败: ${error.message}`);
    return data ? (data.data as Project) : null;
  },

  async save(userId, project) {
    const supabase = (await createSupabaseServerClient())!;
    project.updatedAt = new Date().toISOString();
    const { error } = await supabase.from("projects").upsert({
      id: project.id,
      user_id: userId,
      title: project.title,
      status: project.status,
      data: project,
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    });
    if (error) throw new Error(`保存项目失败: ${error.message}`);
  },

  async remove(userId, id) {
    if (!validId(id)) return false;
    const supabase = (await createSupabaseServerClient())!;
    const { error } = await supabase.from("projects").delete().eq("user_id", userId).eq("id", id);
    return !error;
  },
};

export function getStore(): ProjectStore {
  return isSupabaseConfigured() ? supabaseStore : localStore;
}
