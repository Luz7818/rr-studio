import { NextRequest, NextResponse } from "next/server";
import { chatText, isLlmConfigured } from "@/lib/llm";
import { polishResponsePrompt } from "@/lib/prompts";
import { mockPolish } from "@/lib/mocks";
import { getApiContext } from "@/lib/auth";
import { consumeLlmCalls, guardLlmQuota } from "@/lib/quota";
import type { ResponseThread } from "@/lib/types";

export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

/** 保存用户编辑的回复草稿 */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const { id } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  if (!project.responses) project.responses = [];

  const body = (await req.json()) as { threads?: ResponseThread[] };
  for (const incoming of body.threads ?? []) {
    const existing = project.responses.find((t) => t.commentId === incoming.commentId);
    if (existing) {
      if (typeof incoming.draft === "string") existing.draft = incoming.draft;
      if (typeof incoming.polished === "string") existing.polished = incoming.polished;
      if (incoming.verdict === "valid" || incoming.verdict === "invalid" || incoming.verdict === null) {
        existing.verdict = incoming.verdict ?? undefined;
      }
      if (typeof incoming.commitment === "string") {
        existing.commitment = incoming.commitment.trim() || undefined;
      }
      existing.updatedAt = new Date().toISOString();
    } else {
      project.responses.push({ ...incoming, updatedAt: new Date().toISOString() });
    }
  }

  await actx.ctx.store.save(actx.ctx.userId, project);
  return NextResponse.json({ project });
}

/** AI 打磨某条回复 */
export async function POST(req: NextRequest, ctx: Ctx) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const quotaRes = await guardLlmQuota(actx.ctx);
  if (quotaRes) return quotaRes;
  const { id } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });

  const { commentId } = (await req.json()) as { commentId?: string };
  const thread = project.responses?.find((t) => t.commentId === commentId);
  if (!thread) return NextResponse.json({ error: "未找到对应的审稿意见" }, { status: 404 });

  try {
    let polished: string;
    if (isLlmConfigured()) {
      const { system, user } = polishResponsePrompt(
        thread.commentText,
        thread.draft,
        project.title,
        project.meta.targetJournal,
      );
      polished = await chatText(system, user);
    } else {
      polished = mockPolish(thread.commentText);
    }
    // 字段级回写:打磨期间用户可能保存了其他线程/标题,只写这一条线程的 polished
    const latest = (await actx.ctx.store.get(actx.ctx.userId, id)) ?? project;
    const latestThread = latest.responses?.find((t) => t.commentId === commentId) ?? thread;
    latestThread.polished = polished;
    latestThread.updatedAt = new Date().toISOString();
    await actx.ctx.store.save(actx.ctx.userId, latest);
    void consumeLlmCalls(actx.ctx.userId, isLlmConfigured() ? 1 : 0);
    return NextResponse.json({ thread: latestThread });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "打磨失败" }, { status: 502 });
  }
}
