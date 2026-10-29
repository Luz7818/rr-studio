import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { chatJSON, isLlmConfigured } from "@/lib/llm";
import { critiquePrompt } from "@/lib/prompts";
import { mockCritique } from "@/lib/mocks";
import { getApiContext } from "@/lib/auth";
import { consumeLlmCalls, guardLlmQuota } from "@/lib/quota";
import type { Category, CritiqueIntensity, CritiqueItem, Severity } from "@/lib/types";

// Vercel 函数时长上限声明(Hobby 封顶 60s;Pro 可到 300s,见 docs/DEPLOYMENT.md)
export const maxDuration = 60;


const SKIP_HEADINGS = new Set(["References", "Appendix", "Acknowledgments", "Keywords"]);
const MIN_CHARS = 120;

interface RawItem {
  severity?: string;
  category?: string;
  quote?: string;
  comment?: string;
  suggestion?: string;
}

const asSeverity = (v: string | undefined): Severity =>
  v === "major" || v === "minor" ? v : "suggestion";
const asCategory = (v: string | undefined): Category =>
  v === "logic" || v === "expression" || v === "grammar" ? v : "style";

const asIntensity = (v: unknown): CritiqueIntensity =>
  v === "strict" || v === "gentle" ? v : "balanced";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const quotaRes = await guardLlmQuota(actx.ctx);
  if (quotaRes) return quotaRes;
  const { id } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as { intensity?: unknown } | null;
  const intensity = asIntensity(body?.intensity);

  const targets = project.sections.filter(
    (s) => !SKIP_HEADINGS.has(s.heading) && s.text.trim().length >= MIN_CHARS,
  );
  if (targets.length === 0) {
    return NextResponse.json({ error: "稿件内容太短,无法生成 Critique 报告" }, { status: 400 });
  }

  const items: CritiqueItem[] = [];
  const errors: string[] = [];
  let llmCalls = 0;

  for (const sec of targets) {
    try {
      let raw: RawItem[];
      if (isLlmConfigured()) {
        const { system, user } = critiquePrompt(sec.heading, sec.text, project.meta.targetJournal, intensity);
        const out = await chatJSON<{ items?: RawItem[] }>(system, user);
        llmCalls += 1;
        raw = Array.isArray(out.items) ? out.items : [];
      } else {
        raw = mockCritique(sec.heading).items;
      }
      for (const r of raw) {
        if (!r.comment || !r.suggestion) continue;
        items.push({
          id: randomUUID(),
          section: sec.heading,
          severity: asSeverity(r.severity),
          category: asCategory(r.category),
          quote: (r.quote ?? "").slice(0, 400),
          comment: r.comment,
          suggestion: r.suggestion,
          adopted: false,
        });
      }
    } catch (e) {
      errors.push(`${sec.heading}: ${e instanceof Error ? e.message : "分析失败"}`);
    }
  }

  if (items.length === 0 && errors.length > 0) {
    return NextResponse.json({ error: `Critique 生成失败: ${errors[0]}` }, { status: 502 });
  }

  // 长流程字段级回写:LLM 运行数分钟,期间用户可能保存了其他字段(标题/回复草稿等),
  // 重读最新数据只写本路由拥有的 critique 字段,避免整包覆盖。
  const latest = (await actx.ctx.store.get(actx.ctx.userId, id)) ?? project;
  latest.critique = { createdAt: new Date().toISOString(), items, intensity, errors: errors.length ? errors : undefined };
  latest.status = latest.reviews?.length ? "reviewed" : "critiqued";
  await actx.ctx.store.save(actx.ctx.userId, latest);
  void consumeLlmCalls(actx.ctx.userId, llmCalls);

  return NextResponse.json({ project: latest });
}
