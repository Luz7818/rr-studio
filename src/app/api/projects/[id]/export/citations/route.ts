import { NextRequest, NextResponse } from "next/server";
import { getApiContext } from "@/lib/auth";
import { toApa, toBibtex, toGbT7714 } from "@/lib/citations";

const FORMATS = {
  bibtex: { ext: "bib", render: toBibtex, label: "BibTeX" },
  apa: { ext: "txt", render: toApa, label: "APA" },
  gbt7714: { ext: "txt", render: toGbT7714, label: "GB/T 7714" },
} as const;

/** 导出文献对标的引用列表(.bib / .txt),与 export/* 三条 Word 导出路由同构 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const actx = await getApiContext();
  if (!actx.ok) return actx.res;
  const { id } = await ctx.params;
  const project = await actx.ctx.store.get(actx.ctx.userId, id);
  if (!project) return NextResponse.json({ error: "项目不存在" }, { status: 404 });

  const format = req.nextUrl.searchParams.get("format") ?? "";
  const fmt = FORMATS[format as keyof typeof FORMATS];
  if (!fmt) {
    return NextResponse.json(
      { error: `不支持的格式 ${format || "(空)"},可选:bibtex | apa | gbt7714` },
      { status: 400 },
    );
  }

  const papers = project.literature?.papers ?? [];
  if (papers.length === 0) {
    return NextResponse.json({ error: "尚未检索文献,请先执行文献对标" }, { status: 400 });
  }

  const body = fmt.render(papers);
  return new NextResponse(`${body}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="citations-${fmt.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id.slice(0, 8)}.${fmt.ext}"`,
      "Cache-Control": "no-store",
    },
  });
}
