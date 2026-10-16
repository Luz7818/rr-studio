import { NextRequest, NextResponse } from "next/server";
import { chatJSON, isLlmConfigured } from "@/lib/llm";
import { revisionDiffPrompt } from "@/lib/prompts";
import { mockRevisionSummary } from "@/lib/mocks";
import { getApiContext } from "@/lib/auth";
import type { RevisionDiffItem } from "@/lib/types";

const CHANGE_TYPES = ["added", "removed", "modified", "unchanged"] as const;

interface RawDiff {
  diff?: Array<{ section?: string; changeType?: string; description?: string }>;
  overall?: string;
}

/** 对比原稿与修改稿,生成逐节差异说明 + 总评 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const { id } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  if (!project.revision) {
    return NextResponse.json({ error: "请先上传修改稿" }, { status: 400 });
  }

  const oldSections = project.sections;
  const newSections = project.revision.sections;

  let diff: RevisionDiffItem[];
  let overall: string;
  if (isLlmConfigured()) {
    const { system, user } = revisionDiffPrompt(oldSections, newSections);
    try {
      const out = await chatJSON<RawDiff>(system, user);
      diff = (out.diff ?? [])
        .filter((d) => d.section)
        .map((d) => ({
          section: String(d.section),
          changeType: CHANGE_TYPES.includes(d.changeType as (typeof CHANGE_TYPES)[number])
            ? (d.changeType as RevisionDiffItem["changeType"])
            : "unchanged",
          description: String(d.description ?? ""),
        }));
      overall = String(out.overall ?? "");
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "对比生成失败" },
        { status: 502 },
      );
    }
  } else {
    const m = mockRevisionSummary(
      oldSections.map((s) => s.heading),
      newSections.map((s) => s.heading),
    );
    diff = m.diff;
    overall = m.overall;
  }

  project.revision.diff = diff;
  project.revision.overall = overall;
  project.revision.summaryReady = true;
  await actx.ctx.store.save(actx.ctx.userId, project);
  return NextResponse.json({ project });
}
