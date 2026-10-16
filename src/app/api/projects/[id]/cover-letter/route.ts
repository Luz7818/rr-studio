import { NextRequest, NextResponse } from "next/server";
import { chatText, isLlmConfigured } from "@/lib/llm";
import { coverLetterPrompt } from "@/lib/prompts";
import { mockCoverLetter } from "@/lib/mocks";
import { getApiContext } from "@/lib/auth";


export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
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
    project.coverLetter = { content, createdAt: new Date().toISOString() };
    await actx.ctx.store.save(actx.ctx.userId, project);
    return NextResponse.json({ project });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "生成失败" }, { status: 502 });
  }
}
