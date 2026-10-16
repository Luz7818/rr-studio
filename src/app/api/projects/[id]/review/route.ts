import { NextRequest, NextResponse } from "next/server";
import { chatJSON, isLlmConfigured } from "@/lib/llm";
import { PERSONAS, reviewerPrompt } from "@/lib/prompts";
import { mockReview } from "@/lib/mocks";
import { getApiContext } from "@/lib/auth";
import type {
  Recommendation,
  ResponseThread,
  ReviewComment,
  ReviewerReport,
} from "@/lib/types";


const SKIP_HEADINGS = new Set(["References", "Appendix", "Acknowledgments", "Keywords"]);
const MAX_CHARS = 16000;

interface RawReview {
  overall?: string;
  recommendation?: string;
  major?: string[];
  minor?: string[];
}

const asRecommendation = (v: string | undefined): Recommendation =>
  v === "accept" || v === "minor_revision" || v === "major_revision" || v === "reject" ? v : "major_revision";

const toComments = (list: string[] | undefined, prefix: string, type: "major" | "minor"): ReviewComment[] =>
  (Array.isArray(list) ? list : []).slice(0, 8).map((text, i) => ({
    id: `${prefix}-${type}-${i + 1}`,
    text: String(text),
  }));

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const { id } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });

  const fullText = project.sections
    .filter((s) => !SKIP_HEADINGS.has(s.heading))
    .map((s) => `## ${s.heading}\n\n${s.text}`)
    .join("\n\n")
    .slice(0, MAX_CHARS);

  // 文献对标:检索到的真实近期文献作为审稿依据,杜绝编造引用
  const literatureBlock = project.literature?.papers?.length
    ? `\n\nReal recent literature (retrieved via ${project.literature.source}; ground truth for the current state of the field). When discussing related work, missing baselines or novelty, name these real papers (title + year) as evidence — NEVER invent references:\n${project.literature.papers
        .map((p) => `- ${p.title} (${p.venue || "venue n/a"}, ${p.year ?? "n/a"}, cited by ${p.citedBy})`)
        .join("\n")}`
    : undefined;

  const createdAt = new Date().toISOString();
  const reviews: ReviewerReport[] = await Promise.all(
    PERSONAS.map(async ({ key, label }): Promise<ReviewerReport> => {
      if (isLlmConfigured()) {
        const { system, user } = reviewerPrompt(key, project.title, fullText, project.meta.targetJournal, literatureBlock);
        try {
          const out = await chatJSON<RawReview>(system, user);
          return {
            persona: key,
            label,
            overall: out.overall ?? "",
            recommendation: asRecommendation(out.recommendation),
            major: toComments(out.major, key, "major"),
            minor: toComments(out.minor, key, "minor"),
            createdAt,
          };
        } catch (e) {
          return {
            persona: key,
            label: `${label}(生成失败)`,
            overall: e instanceof Error ? e.message : "生成失败",
            recommendation: "major_revision",
            major: [],
            minor: [],
            createdAt,
          };
        }
      }
      const m = mockReview(key);
      return {
        persona: key,
        label,
        overall: m.overall,
        recommendation: m.recommendation,
        major: toComments(m.major, key, "major"),
        minor: toComments(m.minor, key, "minor"),
        createdAt,
      };
    }),
  );

  project.reviews = reviews;
  project.status = "reviewed";

  // 每次审稿都重建回复线程;用户已写的草稿/打磨稿按 commentId 保留
  const prevThreads = new Map((project.responses ?? []).map((t) => [t.commentId, t]));
  const threads: ResponseThread[] = [];
  for (const r of reviews) {
    for (const c of [...r.major, ...r.minor]) {
      const type = c.id.includes("-major-") ? "major" : "minor";
      const old = prevThreads.get(c.id);
      threads.push({
        commentId: c.id,
        reviewer: r.label,
        type,
        commentText: c.text,
        draft: old?.draft ?? "",
        polished: old?.polished ?? "",
        updatedAt: old?.updatedAt ?? new Date().toISOString(),
        verdict: old?.verdict,
        commitment: old?.commitment,
      });
    }
  }
  project.responses = threads;

  await actx.ctx.store.save(actx.ctx.userId, project);
  return NextResponse.json({ project });
}
