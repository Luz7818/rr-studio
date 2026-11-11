import { NextRequest, NextResponse } from "next/server";
import { getApiContext } from "@/lib/auth";
import { createShare, listShares } from "@/lib/share";

/**
 * 报告分享管理(登录态 + 项目归属校验):
 * POST {ttlDays?: number}(默认 7,夹取 1..90)→ {url, expiresAt};
 * GET → {shares: [...]} 本稿件全部有效分享(owner 管理视图)。
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const { id } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as { ttlDays?: unknown } | null;
  const ttlDays = typeof body?.ttlDays === "number" ? body.ttlDays : undefined;
  const rec = await createShare(actx.ctx.userId, id, ttlDays);
  return NextResponse.json({
    url: `${req.nextUrl.origin}/s/${rec.token}`,
    expiresAt: rec.expiresAt,
  });
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const { id } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });

  const recs = await listShares(actx.ctx.userId, id);
  return NextResponse.json({
    shares: recs.map((r) => ({
      id: r.id,
      url: `${_req.nextUrl.origin}/s/${r.token}`,
      createdAt: r.createdAt,
      expiresAt: r.expiresAt,
    })),
  });
}
