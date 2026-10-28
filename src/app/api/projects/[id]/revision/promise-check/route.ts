import { NextRequest, NextResponse } from "next/server";
import { chatJSON, isLlmConfigured } from "@/lib/llm";
import { promiseCheckPrompt } from "@/lib/prompts";
import { mockPromiseChecks } from "@/lib/mocks";
import { getApiContext } from "@/lib/auth";
import { consumeLlmCalls, guardLlmQuota } from "@/lib/quota";
import type { PromiseCheck } from "@/lib/types";

export const maxDuration = 60;

const STATUSES = ["fulfilled", "partial", "unmet"] as const;

/** 承诺兑现核查:对照修改稿,逐条验证回复信里答应的修改是否真的改了 */
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
  const promises = (project.responses ?? [])
    .filter((t) => t.commitment?.trim())
    .map((t) => ({ id: t.commentId, commitment: t.commitment as string }));
  if (promises.length === 0) {
    return NextResponse.json({ error: "回复线程里还没有修改承诺:先在「回复审稿人」里填写或提取承诺" }, { status: 400 });
  }

  const revisedText = project.revision.sections
    .filter((s) => !["References", "Appendix", "Acknowledgments", "Keywords"].includes(s.heading))
    .map((s) => `## ${s.heading}\n\n${s.text}`)
    .join("\n\n");

  const responses = project.responses ?? [];

  let checks: Array<{ id: string; status: string; evidence: string }>;
  if (isLlmConfigured()) {
    const { system, user } = promiseCheckPrompt(promises, revisedText);
    try {
      const out = await chatJSON<{ checks?: Array<{ id?: string; status?: string; evidence?: string }> }>(system, user);
      checks = (out.checks ?? []).map((c) => ({
        id: String(c.id ?? ""),
        status: STATUSES.includes(c.status as (typeof STATUSES)[number]) ? (c.status as string) : "unmet",
        evidence: String(c.evidence ?? ""),
      }));
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "核查失败" }, { status: 502 });
    }
  } else {
    checks = mockPromiseChecks(promises).checks;
  }

  const byId = new Map(responses.map((t) => [t.commentId, t]));
  const promiseChecks: PromiseCheck[] = checks
    .filter((c) => byId.has(c.id))
    .map((c) => {
      const t = byId.get(c.id)!;
      return {
        commentId: c.id,
        reviewer: t.reviewer,
        type: t.type,
        commitment: t.commitment as string,
        status: c.status as PromiseCheck["status"],
        evidence: c.evidence,
      };
    });

  // 字段级回写:只写 revision.promiseChecks;若运行期间修改稿被清除则放弃结果
  const latest = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!latest?.revision) {
    return NextResponse.json({ error: "修改稿已变更(可能已被清除),请重新上传后再试" }, { status: 409 });
  }
  latest.revision.promiseChecks = promiseChecks;
  await actx.ctx.store.save(actx.ctx.userId, latest);
  void consumeLlmCalls(actx.ctx.userId, isLlmConfigured() ? 1 : 0);
  return NextResponse.json({ project: latest });
}
