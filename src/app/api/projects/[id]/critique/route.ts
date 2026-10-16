import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { chatJSON, isLlmConfigured } from "@/lib/llm";
import { critiquePrompt } from "@/lib/prompts";
import { mockCritique } from "@/lib/mocks";
import { getApiContext } from "@/lib/auth";
import type { Category, CritiqueItem, Severity } from "@/lib/types";


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

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const { id } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });

  const targets = project.sections.filter(
    (s) => !SKIP_HEADINGS.has(s.heading) && s.text.trim().length >= MIN_CHARS,
  );
  if (targets.length === 0) {
    return NextResponse.json({ error: "稿件内容太短,无法生成 Critique 报告" }, { status: 400 });
  }

  const items: CritiqueItem[] = [];
  const errors: string[] = [];

  for (const sec of targets) {
    try {
      let raw: RawItem[];
      if (isLlmConfigured()) {
        const { system, user } = critiquePrompt(sec.heading, sec.text, project.meta.targetJournal);
        const out = await chatJSON<{ items?: RawItem[] }>(system, user);
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

  project.critique = { createdAt: new Date().toISOString(), items, errors: errors.length ? errors : undefined };
  project.status = project.reviews?.length ? "reviewed" : "critiqued";
  await actx.ctx.store.save(actx.ctx.userId, project);

  return NextResponse.json({ project });
}
