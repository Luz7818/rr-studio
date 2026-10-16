import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/** 服务端专用 admin 客户端(绕过 RLS,用于邀请码校验),不配置则跳过邀请码强制 */
function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "未配置 Supabase,当前为本地模式,无需注册" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    inviteCode?: string;
  };
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  const inviteCode = String(body.inviteCode ?? "").trim();

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "密码至少 8 位" }, { status: 400 });
  }

  const admin = SERVICE_KEY ? adminClient() : null;

  // 内测期邀请码校验(service role 绕过 RLS;未配置 service key 时不强制)
  if (admin) {
    if (!inviteCode) {
      return NextResponse.json({ error: "内测期注册需要邀请码" }, { status: 400 });
    }
    const { data: row, error: checkErr } = await admin
      .from("invite_codes")
      .select("code")
      .eq("code", inviteCode)
      .is("used_by", null)
      .maybeSingle();
    if (checkErr) {
      return NextResponse.json({ error: `邀请码校验失败: ${checkErr.message}` }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ error: "邀请码无效或已被使用" }, { status: 400 });
    }
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase!.auth.signUp({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // 标记邀请码已使用
  if (admin && data.user && inviteCode) {
    await admin
      .from("invite_codes")
      .update({ used_by: data.user.id, used_at: new Date().toISOString() })
      .eq("code", inviteCode);
  }

  return NextResponse.json({ ok: true, needsEmailConfirm: !data.session });
}
