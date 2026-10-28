import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient, isSupabaseConfigured } from "./supabase/server";
import { isLlmConfigured } from "./llm";
import type { ApiContext } from "./auth";

export interface PlanInfo {
  tier: "free" | "pro" | "lab";
  /** 当前自然月已创建的稿件数 */
  used: number;
  /** null = 无限制 */
  limit: number | null;
  planExpiresAt: string | null;
}

export const FREE_MONTHLY_LIMIT = 1;

/** Free 方案每月 LLM 分析次数上限(环境变量可覆盖;Pro/Lab 不限) */
export const FREE_LLM_MONTHLY_LIMIT = Number.isFinite(Number(process.env.FREE_LLM_MONTHLY_LIMIT))
  ? Math.max(0, Number(process.env.FREE_LLM_MONTHLY_LIMIT))
  : 60;

const currentMonth = () => new Date().toISOString().slice(0, 7);

/**
 * 读取用户方案与本月用量。Pro 到期自动回落 free。
 * 仅在 SaaS 模式下调用。
 */
export async function getPlanInfo(userId: string): Promise<PlanInfo> {
  const supabase = (await createSupabaseServerClient())!;

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_expires_at")
    .eq("id", userId)
    .maybeSingle();

  let tier = (profile?.plan as PlanInfo["tier"]) ?? "free";
  const expiresAt = (profile?.plan_expires_at as string | null) ?? null;
  if (tier !== "free" && expiresAt && new Date(expiresAt) < new Date()) {
    tier = "free";
  }

  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
  const { count } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStart);

  return {
    tier,
    used: count ?? 0,
    limit: tier === "free" ? FREE_MONTHLY_LIMIT : null,
    planExpiresAt: expiresAt,
  };
}

export const PLAN_UPGRADE_SQL = (email: string, plan: "pro" | "lab") =>
  `update public.profiles\n   set plan = '${plan}', plan_expires_at = now() + interval '1 year'\n where email = '${email}';`;

// ---------- LLM 月度用量(成本限额)----------

/** 本月已用 LLM 分析次数(读失败按 0,不阻断业务) */
export async function getLlmUsed(userId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const admin = createSupabaseAdminClient();
  if (!admin) return 0;
  const { data } = await admin
    .from("llm_usage")
    .select("calls")
    .eq("user_id", userId)
    .eq("month", currentMonth())
    .maybeSingle();
  return data?.calls ?? 0;
}

/**
 * LLM 路由入口限额:本地模式与演示模式不拦;Free 超月额返回 403,放行返回 null。
 * Pro/Lab(limit 为 null)不限。
 */
export async function guardLlmQuota(ctx: ApiContext): Promise<NextResponse | null> {
  if (!ctx.saas || !isLlmConfigured()) return null;
  const plan = await getPlanInfo(ctx.userId);
  if (plan.limit === null) return null;
  const used = await getLlmUsed(ctx.userId);
  if (used >= FREE_LLM_MONTHLY_LIMIT) {
    return NextResponse.json(
      {
        error: `免费版每月限 ${FREE_LLM_MONTHLY_LIMIT} 次 LLM 分析(本月已用 ${used})。升级 Pro 解锁,见定价页。`,
      },
      { status: 403 },
    );
  }
  return null;
}

/** 成功调用 LLM 后累加用量(服务端 RPC 原子累加;失败静默,不阻断业务) */
export async function consumeLlmCalls(userId: string, n: number): Promise<void> {
  if (!isSupabaseConfigured() || !isLlmConfigured() || n <= 0) return;
  const admin = createSupabaseAdminClient();
  if (!admin) return;
  try {
    await admin.rpc("increment_llm_usage", { p_user: userId, p_month: currentMonth(), p_amount: n });
  } catch {
    // 计数失败只影响统计口径,不影响用户结果
  }
}
