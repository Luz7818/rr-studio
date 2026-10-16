import { NextRequest, NextResponse } from "next/server";
import { getApiContext } from "@/lib/auth";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const { id } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });
  const seminar = project.seminar;
  if (!seminar || seminar.slides.length === 0) {
    return NextResponse.json({ error: "请先生成组会汇报" }, { status: 400 });
  }

  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = project.title;

  // 首页:论文标题
  const titleSlide = pptx.addSlide();
  titleSlide.addText(project.title, {
    x: 0.6,
    y: 1.7,
    w: 8.6,
    h: 1.6,
    fontSize: 28,
    bold: true,
    valign: "middle",
  });
  titleSlide.addText(
    `组会汇报 · 约 ${seminar.durationMin} 分钟 · ${new Date(seminar.createdAt).toLocaleDateString("zh-CN")}`,
    { x: 0.6, y: 3.5, w: 8.6, h: 0.5, fontSize: 14, color: "64748B" },
  );
  if (seminar.slides[0]?.script) titleSlide.addNotes(seminar.slides[0].script);

  // 内容页(slides[0] 已用作封面)
  for (const slide of seminar.slides.slice(1)) {
    const s = pptx.addSlide();
    s.addText(slide.title, { x: 0.6, y: 0.35, w: 8.6, h: 0.75, fontSize: 22, bold: true });
    if (slide.bullets.length > 0) {
      s.addText(
        slide.bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true, fontSize: 16 } })),
        { x: 0.8, y: 1.35, w: 8.2, h: 4.3, valign: "top" },
      );
    }
    if (slide.script) s.addNotes(slide.script);
  }

  // 预设问题页
  if (seminar.questions.length > 0) {
    const qa = pptx.addSlide();
    qa.addText("预设问题(导师 Q&A 预演)", { x: 0.6, y: 0.35, w: 8.6, h: 0.75, fontSize: 22, bold: true });
    qa.addText(
      seminar.questions.map((q) => ({ text: q.question, options: { breakLine: true, fontSize: 13 } })),
      { x: 0.8, y: 1.3, w: 8.2, h: 4.4, valign: "top" },
    );
    qa.addNotes(
      seminar.questions.map((q, i) => `Q${i + 1}: ${q.question}\n回答要点: ${q.hint}`).join("\n\n"),
    );
  }

  const buf = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="seminar-${id.slice(0, 8)}.pptx"`,
      "Cache-Control": "no-store",
    },
  });
}
