import { NextRequest, NextResponse } from "next/server";
import { chatJSON, isLlmConfigured } from "@/lib/llm";
import { revisionDiffPrompt } from "@/lib/prompts";
import { mockRevisionSummary } from "@/lib/mocks";
import { getApiContext } from "@/lib/auth";
import { consumeLlmCalls, guardLlmQuota } from "@/lib/quota";
import type { RevisionDiffItem } from "@/lib/types";

export const maxDuration = 60;

const CHANGE_TYPES = ["added", "removed", "modified", "unchanged"] as const;

interface RawDiff {
  diff?: Array<{ section?: string; changeType?: string; description?: string }>;
  overall?: string;
}

/** 对比原稿与修改稿,生成逐节差异说明 + 总评 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const quotaRes = await guardLlmQuota(actx.ctx);
  if (quotaRes) return quotaRes;
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

  // 字段级回写:只写 revision 的 diff/overall;若运行期间修改稿被清除则放弃结果
  const latest = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!latest?.revision) {
    return NextResponse.json({ error: "修改稿已变更(可能已被清除),请重新上传后再试" }, { status: 409 });
  }
  latest.revision.diff = diff;
  latest.revision.overall = overall;
  latest.revision.summaryReady = true;
  await actx.ctx.store.save(actx.ctx.userId, latest);
  void consumeLlmCalls(actx.ctx.userId, isLlmConfigured() ? 1 : 0);
  return NextResponse.json({ project: latest });
}
