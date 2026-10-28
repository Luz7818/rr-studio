import { NextRequest, NextResponse } from "next/server";
import { chatText, isLlmConfigured } from "@/lib/llm";
import { coverLetterPrompt } from "@/lib/prompts";
import { mockCoverLetter } from "@/lib/mocks";
import { getApiContext } from "@/lib/auth";
import { consumeLlmCalls, guardLlmQuota } from "@/lib/quota";

export const maxDuration = 60;

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const quotaRes = await guardLlmQuota(actx.ctx);
  if (quotaRes) return quotaRes;
  const { id } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });

  const abstract = project.sections.find((s) => s.heading === "Abstract")?.text;
  const conclusion = project.sections.find((s) => s.heading === "Conclusion")?.text;
  const keywords = project.sections.find((s) => s.heading === "Keywords")?.text;

  try {
    let content: string;
    if (isLlmConfigured()) {
      const { system, user } = coverLetterPrompt({
        title: project.title,
        targetJournal: project.meta.targetJournal,
        abstract,
        conclusion,
        keywords,
      });
      content = await chatText(system, user);
    } else {
      content = mockCoverLetter(project.title);
    }
    // 字段级回写:只写 coverLetter,保留 LLM 运行期间的其他保存
    const latest = (await actx.ctx.store.get(actx.ctx.userId, id)) ?? project;
    latest.coverLetter = { content, createdAt: new Date().toISOString() };
    await actx.ctx.store.save(actx.ctx.userId, latest);
    void consumeLlmCalls(actx.ctx.userId, isLlmConfigured() ? 1 : 0);
    return NextResponse.json({ project: latest });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "生成失败" }, { status: 502 });
  }
}
