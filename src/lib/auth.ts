import { NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "./supabase/server";
import { localStore, supabaseStore, type ProjectStore } from "./store";

export const isSaasMode = isSupabaseConfigured;

export interface SessionUser {
  id: string;
  email?: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ? { id: user.id, email: user.email ?? undefined } : null;
  } catch {
    // Supabase 不可达(网络抖动/构建期预渲染)按未登录处理,与 proxy.ts 容错口径一致
    return null;
  }
}

export interface ApiContext {
  store: ProjectStore;
  userId: string;
  saas: boolean;
  user: SessionUser | null;
}

/** API 路由统一入口:本地模式用 localStore("local"),SaaS 模式强制登录并按用户隔离 */
export async function getApiContext(): Promise<
  { ok: true; ctx: ApiContext } | { ok: false; res: NextResponse }
> {
  if (isSupabaseConfigured()) {
    const user = await getSessionUser();
    if (!user) {
      return { ok: false, res: NextResponse.json({ error: "请先登录" }, { status: 401 }) };
    }
    return { ok: true, ctx: { store: supabaseStore, userId: user.id, saas: true, user } };
  }
  return { ok: true, ctx: { store: localStore, userId: "local", saas: false, user: null } };
}
