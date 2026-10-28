import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import FooterYear from "@/components/FooterYear";
import MarketingNav from "@/components/MarketingNav";
import Reveal from "@/components/Reveal";

const STEPS = [
  {
    n: "01",
    title: "上传稿件,自动脱敏",
    body: "支持 PDF / DOCX / 粘贴文本。标题页(作者/单位区)整体排除;邮箱、ORCID、基金号、链接、单位行在送入模型前自动替换为占位符——解析概览页会给出逐类脱敏报告。",
    tip: "双栏 PDF 的复杂排版可能切节不准,粘贴文本是最稳的兜底。",
  },
  {
    n: "02",
    title: "生成 Critique 报告",
    body: "逐段从逻辑、表达、语法、风格四个维度挑问题,每条给出可直接替换的英文改写句。可按严重程度筛选,勾选「已采纳」后导出 Word 报告。",
    tip: "建议先读 Major 条目——它们是逻辑层的硬伤。",
  },
  {
    n: "03",
    title: "获取真实文献对标",
    body: "一键检索 OpenAlex / Semantic Scholar 的近三年真实文献,作为三位审稿人的审稿依据。审稿意见讨论文献缺口时只引用这些真实论文,杜绝编造引用。",
    tip: "检索词由标题自动提取;检索结果按被引量排序。",
  },
  {
    n: "04",
    title: "模拟审稿:三位立场独立的审稿人",
    body: "方法论苛刻型、统计审稿人、领域资深专家分别出具 Overall 与 Major/Minor 意见,按期刊惯例给出录用建议。每条意见可标记「有道理 / 不成立」,命中率跨项目沉淀到洞察页。",
    tip: "「不成立」的标记同样有价值——它训练你甄别审稿意见的能力。",
  },
  {
    n: "05",
    title: "回复打磨成信",
    body: "每条意见一个回复线程:你先写事实和数字(失焦自动保存),AI 打磨成专业得体的正式回复并保留你的论据;可单条或批量打磨,一键导出 Word 逐点回复信。",
    tip: "打磨只改语气与结构,不改动你给出的数据。",
  },
  {
    n: "06",
    title: "承诺兑现核查(独有)",
    body: "回复里答应修改的每一处,手工填写或 AI 批量提取为「修改承诺」;大修后上传修改稿,逐条验证是否真的改了(已兑现 / 部分兑现 / 未兑现 + 原文证据)——投稿前最后一道保险。",
    tip: "这也是给合作者/导师核对修改完成度的最快方式。",
  },
  {
    n: "07",
    title: "交付物导出",
    body: "Word 版 Critique 报告与逐点回复信、Cover Letter、组会 PPTX(逐页讲稿写入演讲者备注、导师 Q&A 预演)。修改稿对照支持逐节差异 + 重审,不计入免费额度。",
  },
];

export const metadata = {
  title: "使用指南 — R&R Studio",
  description: "从上传草稿到可提交的完整材料:R&R Studio 七步使用指南。",
};

export default function GuidePage() {
  return (
    <div className="min-h-dvh">
      <MarketingNav />
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-1 text-sm text-ink-faint transition hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={1.75} />
          返回首页
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">使用指南</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft sm:text-[15px]">
          从英文草稿到可提交的完整材料,七步一条流水线。全程作者信息不出脱敏层。
        </p>

        <div className="mt-10 space-y-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={Math.min(i * 50, 200)}>
              <section className="rounded-2xl border border-line bg-white p-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-semibold text-accent">{s.n}</span>
                  <h2 className="text-[15px] font-semibold">{s.title}</h2>
                </div>
                <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">{s.body}</p>
                {s.tip && (
                  <p className="mt-3 rounded-xl bg-accent-soft px-3.5 py-2 text-xs leading-relaxed text-accent">
                    {s.tip}
                  </p>
                )}
              </section>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10">
          <div className="rounded-2xl bg-band px-6 py-8 text-center">
            <p className="text-[15px] font-semibold">准备好看你的第一条 Critique 了吗?</p>
            <Link
              href="/signup"
              className="press group mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent/90"
            >
              免费开始
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
            <p className="mt-3 text-xs text-ink-faint">Free 方案每月 1 篇 · 内测期需邀请码</p>
          </div>
        </Reveal>

        <footer className="mt-12 border-t border-line pt-6 text-center text-[13px] text-ink-faint">
          © <FooterYear /> R&amp;R Studio ·{" "}
          <Link href="/changelog" className="transition hover:text-accent">
            更新日志
          </Link>{" "}
          ·{" "}
          <Link href="/privacy" className="transition hover:text-accent">
            隐私说明
          </Link>
        </footer>
      </div>
    </div>
  );
}
