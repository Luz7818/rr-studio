import { NextRequest, NextResponse } from "next/server";
import { getApiContext } from "@/lib/auth";
import { revokeShare } from "@/lib/share";

/** 软撤销分享(置 revoked_at,留审计痕迹);不存在/不属于该稿件 → 404 */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; shareId: string }> },
) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const { id, shareId } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });

  const ok = await revokeShare(actx.ctx.userId, id, shareId);
  if (!ok) return NextResponse.json({ error: "分享不存在或已撤销" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
