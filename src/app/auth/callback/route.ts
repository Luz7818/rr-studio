import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

/** 邮箱确认/OAuth 回调:用 code 换 session(Supabase Auth 标准流程) */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=not_configured", origin));
  }
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase!.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, origin),
    );
  }
  return NextResponse.redirect(new URL(next, origin));
}
