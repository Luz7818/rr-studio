import { NextRequest, NextResponse } from "next/server";
import { redeemShare } from "@/lib/share";

/**
 * 公开兑换:GET /api/share/[token](无登录态)。
 * token 校验不过(不存在/过期/已撤销/形态非法/service key 未配)一律 404,
 * 不区分原因——无存在性泄露,防枚举探测(设计 §2.3-A)。
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const redeemed = await redeemShare(token);
  if (!redeemed) {
    return NextResponse.json(
      { error: "分享不存在或已失效" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    { project: redeemed.project, expiresAt: redeemed.expiresAt },
    { headers: { "Cache-Control": "no-store" } },
  );
}
