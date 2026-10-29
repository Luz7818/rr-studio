import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { extractTextFromFile, MAX_UPLOAD_MB, sectionize } from "@/lib/parse";
import { sanitizeText } from "@/lib/sanitize";
import { isLlmConfigured } from "@/lib/llm";
import { getApiContext } from "@/lib/auth";
import { getPlanInfo, getLlmUsed, FREE_LLM_MONTHLY_LIMIT } from "@/lib/quota";
import type { Project, Section } from "@/lib/types";

export async function GET() {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;

  const projects = await actx.ctx.store.list(actx.ctx.userId);
  const plan = actx.ctx.saas
    ? await getPlanInfo(actx.ctx.userId)
    : { tier: "local" as const, used: projects.length, limit: null, planExpiresAt: null };
  const llmUsed = actx.ctx.saas ? await getLlmUsed(actx.ctx.userId) : 0;

  return NextResponse.json({
    llmConfigured: isLlmConfigured(),
    saas: actx.ctx.saas,
    plan,
    llmUsed,
    llmLimit: plan.limit === null ? null : FREE_LLM_MONTHLY_LIMIT,
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      fileName: p.meta.fileName,
      sections: p.sections.length,
      redactions: p.sanitize.redactions,
      critiqueCount: p.critique?.items.length ?? 0,
      reviewCount: p.reviews?.length ?? 0,
    })),
  });
}

export async function POST(req: NextRequest) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;

  // SaaS 模式下执行免费额度检查(1 篇/自然月;Pro/Lab 无限)
  if (actx.ctx.saas) {
    const plan = await getPlanInfo(actx.ctx.userId);
    if (plan.limit !== null && plan.used >= plan.limit) {
      return NextResponse.json(
        {
          error: `免费版每月限 ${plan.limit} 篇稿件(本月已用 ${plan.used})。升级 Pro 解锁无限额度,见定价页。`,
          plan,
        },
        { status: 403 },
      );
    }
  }

  try {
    let rawText = "";
    let title = "";
    let targetJournal = "";
    let fileName: string | undefined;

    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      title = String(form.get("title") ?? "");
      targetJournal = String(form.get("targetJournal") ?? "");
      const file = form.get("file");
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const f = file as File;
        if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
          return NextResponse.json(
            { error: `文件超过 ${MAX_UPLOAD_MB}MB 上限,请拆分或压缩后上传` },
            { status: 400 },
          );
        }
        fileName = f.name;
        rawText = await extractTextFromFile(f);
      }
    } else {
      const body = (await req.json()) as { text?: string; title?: string; targetJournal?: string };
      rawText = String(body.text ?? "");
      title = String(body.title ?? "");
      targetJournal = String(body.targetJournal ?? "");
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: "未提供有效的稿件内容" }, { status: 400 });
    }

    const parsed = sectionize(rawText);
    if (parsed.sections.length === 0) {
      return NextResponse.json({ error: "解析后未得到有效内容,请检查文件" }, { status: 400 });
    }

    const sections: Section[] = [];
    const details: Record<string, number> = {};
    let redactions = 0;
    for (const sec of parsed.sections) {
      const { text, report } = sanitizeText(sec.text);
      redactions += report.redactions;
      for (const [k, v] of Object.entries(report.details)) {
        details[k] = (details[k] ?? 0) + v;
      }
      sections.push({ ...sec, text });
    }

    const now = new Date().toISOString();
    const project: Project = {
      id: randomUUID(),
      title: title.trim() || parsed.title,
      createdAt: now,
      updatedAt: now,
      status: "uploaded",
      sections,
      sanitize: { redactions, details, removedAuthorBlock: parsed.authorBlockRemoved },
      meta: { fileName, targetJournal: targetJournal.trim() || undefined, language: "en" },
    };
    await actx.ctx.store.save(actx.ctx.userId, project);

    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "解析失败" }, { status: 500 });
  }
}
