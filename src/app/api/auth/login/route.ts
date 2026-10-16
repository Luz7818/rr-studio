import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未配置 Supabase,当前为本地模式" }, { status: 400 });
  }
  const { email, password } = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase!.auth.signInWithPassword({
    email: String(email ?? "").trim(),
    password: String(password ?? ""),
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
