import { NextRequest, NextResponse } from "next/server";
import { extractTextFromFile, MAX_UPLOAD_MB, sectionize } from "@/lib/parse";
import { sanitizeText } from "@/lib/sanitize";
import { getApiContext } from "@/lib/auth";
import type { Revision, Section } from "@/lib/types";

/** 上传修改稿:解析 + 脱敏后存入 project.revision(不产生 LLM 调用,不计入免费额度) */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const { id } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });

  try {
    let rawText = "";

    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const f = file as File;
        if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
          return NextResponse.json(
            { error: `文件超过 ${MAX_UPLOAD_MB}MB 上限,请拆分或压缩后上传` },
            { status: 400 },
          );
        }
        rawText = await extractTextFromFile(f);
      }
    } else {
      const body = (await req.json()) as { text?: string };
      rawText = String(body.text ?? "");
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: "未提供有效的修改稿内容" }, { status: 400 });
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

    const revision: Revision = {
      uploadedAt: new Date().toISOString(),
      sections,
      sanitize: { redactions, details, removedAuthorBlock: parsed.authorBlockRemoved },
      summaryReady: false,
      diff: [],
      overall: "",
    };
    project.revision = revision;
    await actx.ctx.store.save(actx.ctx.userId, project);
    return NextResponse.json({ project });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "解析失败" }, { status: 500 });
  }
}
