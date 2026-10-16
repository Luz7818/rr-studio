import { NextRequest, NextResponse } from "next/server";
import { chatJSON, isLlmConfigured } from "@/lib/llm";
import { extractCommitmentsPrompt } from "@/lib/prompts";
import { mockCommitments } from "@/lib/mocks";
import { getApiContext } from "@/lib/auth";

/**
 * AI 从回复草稿/打磨稿中提取「修改承诺」(在哪改什么),批量填充到线程。
 * 只处理已有回复内容且尚无承诺的线程。
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const { id } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  if (!project.responses) project.responses = [];

  const targets = project.responses.filter((t) => (t.polished.trim() || t.draft.trim()) && !t.commitment?.trim());
  if (targets.length === 0) {
    return NextResponse.json({ error: "没有可提取的线程:请先撰写回复,或已全部提取过" }, { status: 400 });
  }

  let extracted: Record<string, string>;
  if (isLlmConfigured()) {
    const { system, user } = extractCommitmentsPrompt(
      targets.map((t) => ({ id: t.commentId, comment: t.commentText, reply: t.polished.trim() || t.draft.trim() })),
    );
    try {
      const out = await chatJSON<{ items?: Array<{ id?: string; commitment?: string }> }>(system, user);
      extracted = {};
      for (const item of out.items ?? []) {
        if (item.id) extracted[item.id] = String(item.commitment ?? "");
      }
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "提取失败" }, { status: 502 });
    }
  } else {
    extracted = Object.fromEntries(mockCommitments(targets.map((t) => t.commentId)).items.map((i) => [i.id, i.commitment]));
  }

  let filled = 0;
  for (const t of targets) {
    const c = (extracted[t.commentId] ?? "").trim();
    if (c) {
      t.commitment = c;
      t.updatedAt = new Date().toISOString();
      filled += 1;
    }
  }
  await actx.ctx.store.save(actx.ctx.userId, project);
  return NextResponse.json({ project, filled });
}
