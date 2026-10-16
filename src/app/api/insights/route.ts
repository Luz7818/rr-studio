import { NextResponse } from "next/server";
import { getApiContext } from "@/lib/auth";
import { personaLabel } from "@/lib/prompts";
import type { Persona, Recommendation, Severity, Category } from "@/lib/types";

/** 审稿意见趋势沉淀:跨项目聚合模拟审稿与 Critique 数据 */
export async function GET() {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;

  const projects = await actx.ctx.store.list(actx.ctx.userId);

  const recommendationKeys: Recommendation[] = ["accept", "minor_revision", "major_revision", "reject"];
  const recommendations = (["methodologist", "statistician", "domain-expert"] as Persona[]).map((p) => ({
    persona: p,
    label: personaLabel(p),
    counts: Object.fromEntries(recommendationKeys.map((r) => [r, 0])) as Record<Recommendation, number>,
  }));
  const categoryCounts = new Map<Category, number>();
  const severityCounts = new Map<Severity, number>();
  const sectionCounts = new Map<string, number>();

  let critiqueItems = 0;
  // 意见裁决:每位审稿人的「命中率」(被用户标记为成立的意见占比)
  const verdicts = new Map<Persona, { valid: number; invalid: number }>();
  const personaOf = (commentId: string): Persona | null => {
    const m = commentId.replace(/^rev-/, "").match(/^(methodologist|statistician|domain-expert)-(major|minor)-/);
    return m ? (m[1] as Persona) : null;
  };
  // 承诺兑现
  let promiseTotal = 0;
  const promiseCounts = { fulfilled: 0, partial: 0, unmet: 0 };
  const timeline: Array<{
    id: string;
    title: string;
    date: string;
    recs: Array<{ persona: string; recommendation: Recommendation }>;
    major: number;
    minor: number;
  }> = [];

  for (const p of projects) {
    if (p.critique) {
      critiqueItems += p.critique.items.length;
      for (const item of p.critique.items) {
        categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1);
        severityCounts.set(item.severity, (severityCounts.get(item.severity) ?? 0) + 1);
        sectionCounts.set(item.section, (sectionCounts.get(item.section) ?? 0) + 1);
      }
    }
    for (const t of p.responses ?? []) {
      if (t.verdict) {
        const persona = personaOf(t.commentId);
        if (persona) {
          const bucket = verdicts.get(persona) ?? { valid: 0, invalid: 0 };
          bucket[t.verdict === "valid" ? "valid" : "invalid"] += 1;
          verdicts.set(persona, bucket);
        }
      }
    }
    for (const c of p.revision?.promiseChecks ?? []) {
      promiseTotal += 1;
      promiseCounts[c.status] += 1;
    }
    if (p.reviews?.length) {
      const recs = p.reviews.map((r) => {
        const bucket = recommendations.find((x) => x.persona === r.persona);
        if (bucket) bucket.counts[r.recommendation] += 1;
        return { persona: r.label, recommendation: r.recommendation };
      });
      timeline.push({
        id: p.id,
        title: p.title,
        date: p.createdAt,
        recs,
        major: p.reviews.reduce((a, r) => a + r.major.length, 0),
        minor: p.reviews.reduce((a, r) => a + r.minor.length, 0),
      });
    }
  }

  const CATEGORY_LABEL: Record<string, string> = { logic: "逻辑", expression: "表达", grammar: "语法", style: "风格" };
  const SEVERITY_LABEL: Record<string, string> = { major: "Major", minor: "Minor", suggestion: "建议" };

  const hitRates = (["methodologist", "statistician", "domain-expert"] as Persona[]).map((p) => {
    const v = verdicts.get(p) ?? { valid: 0, invalid: 0 };
    const total = v.valid + v.invalid;
    return {
      persona: p,
      label: personaLabel(p),
      valid: v.valid,
      invalid: v.invalid,
      rate: total > 0 ? Math.round((v.valid / total) * 100) : null,
    };
  });

  return NextResponse.json({
    totalProjects: projects.length,
    reviewedProjects: timeline.length,
    critiqueItems,
    recommendations,
    categories: [...categoryCounts.entries()]
      .map(([k, v]) => ({ key: k, label: CATEGORY_LABEL[k] ?? k, count: v }))
      .sort((a, b) => b.count - a.count),
    severities: [...severityCounts.entries()]
      .map(([k, v]) => ({ key: k, label: SEVERITY_LABEL[k] ?? k, count: v }))
      .sort((a, b) => b.count - a.count),
    hitRates,
    promises: { total: promiseTotal, ...promiseCounts },
    topSections: [...sectionCounts.entries()]
      .map(([k, v]) => ({ section: k, count: v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    timeline: timeline.sort((a, b) => (a.date < b.date ? 1 : -1)),
  });
}
