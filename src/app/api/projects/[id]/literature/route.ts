import { NextRequest, NextResponse } from "next/server";
import { chatJSON, isLlmConfigured } from "@/lib/llm";
import { literatureQueriesPrompt } from "@/lib/prompts";
import { searchLiterature } from "@/lib/literature";
import { getApiContext } from "@/lib/auth";

/**
 * 文献对标:从稿件标题/摘要提取检索词,检索近三年真实文献
 * (OpenAlex 优先,Semantic Scholar 兜底),存入 project.literature
 * 作为模拟审稿的依据 —— 审稿人讨论文献缺口时只引用这些真实论文。
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const { id } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });

  const abstract = project.sections.find((s) => s.heading === "Abstract")?.text;
  const intro = project.sections.find((s) => s.heading === "Introduction")?.text;
  const seed = [abstract, intro].find((t) => t && t.trim().length > 100) ?? project.sections[0]?.text ?? "";

  let queries: string[];
  if (isLlmConfigured()) {
    try {
      const { system, user } = literatureQueriesPrompt(project.title, seed);
      const out = await chatJSON<{ queries?: string[] }>(system, user);
      queries = (out.queries ?? []).map(String).filter(Boolean).slice(0, 3);
    } catch {
      queries = [];
    }
  } else {
    queries = [];
  }
  if (queries.length === 0) {
    // 无 LLM 或提取失败:退化用标题 + 关键词章节
    const keywords = project.sections.find((s) => s.heading === "Keywords")?.text ?? "";
    queries = [project.title.slice(0, 200), keywords.slice(0, 150)].filter((q) => q.trim());
  }
  if (queries.length === 0) {
    return NextResponse.json({ error: "稿件内容不足,无法构造检索词" }, { status: 400 });
  }

  const { source, papers, errors } = await searchLiterature(queries);
  if (papers.length === 0) {
    return NextResponse.json(
      { error: `文献检索无结果(${errors[0] ?? source}),请稍后重试或检查网络` },
      { status: 502 },
    );
  }

  project.literature = {
    queries,
    source,
    papers,
    errors: errors.length ? errors : undefined,
    fetchedAt: new Date().toISOString(),
  };
  await actx.ctx.store.save(actx.ctx.userId, project);
  return NextResponse.json({ project });
}
