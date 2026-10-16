import { createSupabaseServerClient } from "./supabase/server";

export interface PlanInfo {
  tier: "free" | "pro" | "lab";
  /** 当前自然月已创建的稿件数 */
  used: number;
  /** null = 无限制 */
  limit: number | null;
  planExpiresAt: string | null;
}

export const FREE_MONTHLY_LIMIT = 1;

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
