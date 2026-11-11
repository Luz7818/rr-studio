import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  clampTtlDays,
  createShare,
  listShares,
  redeemShare,
  revokeShare,
  sanitizeForShare,
  validShareToken,
  type ShareRecord,
} from "./share";
import { localStore } from "./store";
import type { Project } from "./types";

/**
 * share.ts 本地模式全生命周期 + sanitizeForShare 纯函数(SaaS 分支依赖 Supabase 连接,
 * 归入 DEPLOYMENT 全链路验收;404 防探测语义的端到端验证在 smoke 分享两步)。
 */

let root = "";
const USER = "local";
const PROJECT: Project = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Shared Report Fixture",
  createdAt: "2026-11-12T00:00:00.000Z",
  updatedAt: "2026-11-12T00:00:00.000Z",
  status: "reviewed",
  sections: [{ id: "s1", heading: "Abstract", text: "Secret manuscript text", chars: 21 }],
  sanitize: { redactions: 0, details: {}, removedAuthorBlock: true },
  meta: { fileName: "paper.pdf", targetJournal: "IEEE T-ITS", language: "en" },
  critique: { createdAt: "2026-11-12T01:00:00.000Z", items: [] },
  reviews: [],
  responses: [
    { commentId: "c1", reviewer: "R1", type: "major", commentText: "x", draft: "y", polished: "z", updatedAt: "2026-11-12T02:00:00.000Z" },
  ],
  coverLetter: { content: "dear editor", createdAt: "2026-11-12T03:00:00.000Z" },
  seminar: { durationMin: 10, language: "zh", slides: [], questions: [], createdAt: "2026-11-12T04:00:00.000Z" },
  literature: { queries: [], source: "OpenAlex", papers: [], fetchedAt: "2026-11-12T05:00:00.000Z" },
  revision: {
    uploadedAt: "2026-11-12T06:00:00.000Z",
    sections: [],
    sanitize: { redactions: 0, details: {}, removedAuthorBlock: true },
    summaryReady: false,
    diff: [],
    overall: "改善明显",
  },
};

async function readRecord(token: string): Promise<ShareRecord> {
  return JSON.parse(await fs.readFile(path.join(root, `${token}.json`), "utf8")) as ShareRecord;
}

/** 直接改写落盘记录:把 expiresAt 拨到过去(真实时钟,不用 fake timers) */
async function expireRecord(token: string): Promise<void> {
  const rec = await readRecord(token);
  rec.expiresAt = new Date(Date.now() - 60_000).toISOString();
  await fs.writeFile(path.join(root, `${token}.json`), JSON.stringify(rec, null, 2), "utf8");
}

beforeAll(async () => {
  root = await fs.mkdtemp(path.join(tmpdir(), "rr-shares-test-"));
  await localStore.save(USER, { ...PROJECT });
});

afterAll(async () => {
  await localStore.remove(USER, PROJECT.id);
  await fs.rm(root, { recursive: true, force: true });
});

describe("token 与记录创建", () => {
  it("token 唯一性:连续生成互不相同,恰 43 字符 base64url(32 字节)", async () => {
    const recs = await Promise.all(Array.from({ length: 8 }, () => createShare(USER, PROJECT.id, undefined, root)));
    const tokens = recs.map((r) => r.token);
    expect(new Set(tokens).size).toBe(8);
    for (const t of tokens) {
      expect(validShareToken(t)).toBe(true);
      expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
    }
    for (const r of recs) {
      expect(r.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(r.revokedAt).toBeNull();
    }
  });

  it("默认 ttl 7 天;clampTtlDays:非法回 7、0/-5 → 1、500 → 90、小数取整", () => {
    expect(clampTtlDays(undefined)).toBe(7);
    expect(clampTtlDays("abc")).toBe(7);
    expect(clampTtlDays(NaN)).toBe(7);
    expect(clampTtlDays(0)).toBe(1);
    expect(clampTtlDays(-5)).toBe(1);
    expect(clampTtlDays(500)).toBe(90);
    expect(clampTtlDays(7.9)).toBe(7);
    expect(clampTtlDays(30)).toBe(30);
  });
});

describe("redeemShare 兑换语义(校验不过一律 null → 路由 404,不区分原因)", () => {
  it("创建→兑换成功:只读投影含白名单字段,含 meta/critique/revision", async () => {
    const rec = await createShare(USER, PROJECT.id, 30, root);
    const out = await redeemShare(rec.token, root);
    expect(out).not.toBeNull();
    expect(out!.project.title).toBe("Shared Report Fixture");
    expect(out!.project.status).toBe("reviewed");
    expect(out!.project.critique?.createdAt).toBe("2026-11-12T01:00:00.000Z");
    expect(out!.project.revision?.overall).toBe("改善明显");
    expect(out!.project.meta?.targetJournal).toBe("IEEE T-ITS");
    const days = (Date.parse(out!.expiresAt) - Date.parse(rec.createdAt)) / 86_400_000;
    expect(Math.round(days)).toBe(30);
  });

  it("过期判定:expiresAt 过去 → null,且列表不再返回", async () => {
    const rec = await createShare(USER, PROJECT.id, 1, root);
    expect(await redeemShare(rec.token, root)).not.toBeNull();
    await expireRecord(rec.token);
    expect(await redeemShare(rec.token, root)).toBeNull();
    expect((await listShares(USER, PROJECT.id, root)).some((s) => s.token === rec.token)).toBe(false);
  });

  it("撤销后 null(软撤销留审计痕迹);重复撤销与未知 shareId → false", async () => {
    const rec = await createShare(USER, PROJECT.id, undefined, root);
    expect(await revokeShare(USER, PROJECT.id, rec.id, root)).toBe(true);
    const after = await readRecord(rec.token);
    expect(after.revokedAt).toBeTruthy();
    expect(await redeemShare(rec.token, root)).toBeNull();
    expect((await listShares(USER, PROJECT.id, root)).some((s) => s.token === rec.token)).toBe(false);
    expect(await revokeShare(USER, PROJECT.id, rec.id, root)).toBe(false);
    expect(await revokeShare(USER, PROJECT.id, "99999999-9999-4999-8999-999999999999", root)).toBe(false);
  });

  it("形态非法与不存在的 token 都 null,不抛错不泄露存在性", async () => {
    expect(await redeemShare("short", root)).toBeNull();
    expect(await redeemShare("含/斜杠的 token aa bb cc dd ee ff 00", root)).toBeNull();
    expect(await redeemShare("a".repeat(43), root)).toBeNull();
    expect(await redeemShare("A".repeat(42) + "!", root)).toBeNull();
  });

  it("项目已删除 → null(引用不悬空)", async () => {
    const ghost = { ...PROJECT, id: "22222222-2222-4222-8222-222222222222", title: "Ghost" };
    await localStore.save(USER, ghost);
    const rec = await createShare(USER, ghost.id, undefined, root);
    await localStore.remove(USER, ghost.id);
    expect(await redeemShare(rec.token, root)).toBeNull();
  });
});

describe("listShares owner 管理视图", () => {
  it("只列本人本稿的有效分享;他人/他稿/过期/撤销一律不出现", async () => {
    const mine = await createShare(USER, PROJECT.id, undefined, root);
    const otherUser = await createShare("someone-else", PROJECT.id, undefined, root);
    const otherProject = await createShare(USER, "33333333-3333-4333-8333-333333333333", undefined, root);
    const expired = await createShare(USER, PROJECT.id, undefined, root);
    const revoked = await createShare(USER, PROJECT.id, undefined, root);
    await expireRecord(expired.token);
    await revokeShare(USER, PROJECT.id, revoked.id, root);

    const list = await listShares(USER, PROJECT.id, root);
    const tokens = list.map((s) => s.token);
    expect(tokens).toContain(mine.token);
    expect(tokens).not.toContain(otherUser.token);
    expect(tokens).not.toContain(otherProject.token);
    expect(tokens).not.toContain(expired.token);
    expect(tokens).not.toContain(revoked.token);
    expect(list.every((s) => s.userId === USER && s.projectId === PROJECT.id)).toBe(true);
  });
});

describe("sanitizeForShare 投影纯度", () => {
  it("只保留白名单键:sections/responses/coverLetter/seminar/literature 与未来新增字段不进公开面", () => {
    const out = sanitizeForShare(PROJECT);
    expect(Object.keys(out).sort()).toEqual(
      ["createdAt", "critique", "meta", "revision", "reviews", "status", "title", "updatedAt"].sort(),
    );
    expect("sections" in out).toBe(false);
    expect("responses" in out).toBe(false);
    expect("coverLetter" in out).toBe(false);
    expect("seminar" in out).toBe(false);
    expect("literature" in out).toBe(false);
  });

  it("纯函数:不改动入参;白名单内字段深拷贝引用保真", () => {
    const input: Project = JSON.parse(JSON.stringify(PROJECT));
    const out = sanitizeForShare(input);
    expect(input.sections).toHaveLength(1);
    expect(JSON.stringify(input)).toBe(JSON.stringify(PROJECT));
    expect(out.critique).toEqual(input.critique);
    expect(out.revision).toEqual(input.revision);
    expect(out.reviews).toEqual([]);
  });

  it("可选块缺省时投影不带对应键(meta 缺省字段为 undefined 但键保留)", () => {
    const bare: Project = { ...PROJECT, critique: undefined, reviews: undefined, revision: undefined };
    const out = sanitizeForShare(bare);
    expect("critique" in out).toBe(false);
    expect("reviews" in out).toBe(false);
    expect("revision" in out).toBe(false);
    expect(out.title).toBe("Shared Report Fixture");
  });
});
