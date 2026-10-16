import { NextRequest, NextResponse } from "next/server";
import { isLlmConfigured } from "@/lib/llm";
import { getApiContext } from "@/lib/auth";
import type { ResponseThread, Revision } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const { id } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  return NextResponse.json({ project, llmConfigured: isLlmConfigured() });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const { id } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });

  const body = (await req.json()) as {
    title?: string;
    targetJournal?: string;
    adopted?: string[];
    threads?: ResponseThread[];
    revision?: Revision | null;
  };

  if (typeof body.title === "string" && body.title.trim()) project.title = body.title.trim();
  if (typeof body.targetJournal === "string") {
    project.meta.targetJournal = body.targetJournal.trim() || undefined;
  }
  if (body.revision === null) {
    project.revision = undefined;
  }
  if (Array.isArray(body.adopted) && project.critique) {
    const set = new Set(body.adopted);
    for (const item of project.critique.items) item.adopted = set.has(item.id);
  }
  if (Array.isArray(body.threads) && project.responses) {
    for (const incoming of body.threads) {
      const existing = project.responses.find((t) => t.commentId === incoming.commentId);
      if (existing) {
        if (typeof incoming.draft === "string") existing.draft = incoming.draft;
        if (typeof incoming.polished === "string") existing.polished = incoming.polished;
        existing.updatedAt = new Date().toISOString();
      } else {
        project.responses.push({ ...incoming, updatedAt: new Date().toISOString() });
      }
    }
  }

  await actx.ctx.store.save(actx.ctx.userId, project);
  return NextResponse.json({ project });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const { id } = await ctx.params;
  const ok = await actx.ctx.store.remove(actx.ctx.userId, id);
  if (!ok) return NextResponse.json({ error: "删除失败或项目不存在" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
