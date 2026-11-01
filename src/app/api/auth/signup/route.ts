import { NextRequest, NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

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

  // 内测期邀请码校验(service role 绕过 RLS;未配置 service key 时不强制)
  const admin = createSupabaseAdminClient();
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

  // 原子占码:update 带 used_by is null 条件,按命中行数判定——并发同码注册恰一次成功
  if (admin && data.user && inviteCode) {
    const { data: claimed, error: claimErr } = await admin
      .from("invite_codes")
      .update({ used_by: data.user.id, used_at: new Date().toISOString() })
      .eq("code", inviteCode)
      .is("used_by", null)
      .select("code");
    if (claimErr) {
      return NextResponse.json({ error: `邀请码标记失败: ${claimErr.message}` }, { status: 500 });
    }
    if (!claimed || claimed.length === 0) {
      // 竞态落败:回滚刚建的账号再拒绝;回滚失败如实报错,不留绕过邀请码的账号
      const { error: delErr } = await admin.auth.admin.deleteUser(data.user.id);
      if (delErr) {
        return NextResponse.json(
          { error: `邀请码已被并发使用,且账号回滚失败: ${delErr.message}` },
          { status: 500 },
        );
      }
      return NextResponse.json({ error: "邀请码无效或已被使用" }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, needsEmailConfirm: !data.session });
}
