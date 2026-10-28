import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FooterYear from "@/components/FooterYear";
import MarketingNav from "@/components/MarketingNav";
import Reveal from "@/components/Reveal";

/** 用户视角的版本亮点(开发者细节见仓库 HISTORY.md) */
const RELEASES: Array<{ version: string; date: string; title: string; items: string[] }> = [
  {
    version: "v0.11",
    date: "2026-10",
    title: "品牌与官网全面升级",
    items: [
      "全新品牌图标与浮岛式产品官网",
      "落地页滚动显现动效、常见问题、使用指南与更新日志",
      "社交分享卡片(OG)上线",
    ],
  },
  {
    version: "v0.10",
    date: "2026-10",
    title: "全站体验精修",
    items: [
      "统一图标系统与按压/悬停微动效",
      "确认弹窗替代系统弹窗,草稿自动保存可见",
      "页签支持数字键 1-7 直跳,移动端体验优化",
    ],
  },
  {
    version: "v0.9",
    date: "2026-10",
    title: "面向开放使用的工程底座",
    items: [
      "SaaS 免费档 LLM 月度用量限额,仪表盘实时可见",
      "多人并发编辑保护,长任务不再互相覆盖",
      "隐私说明页与部署检查清单,补齐合规边界",
    ],
  },
  {
    version: "v0.8",
    date: "2026-10",
    title: "等待与反馈体验",
    items: [
      "所有生成步骤带加载指示,等待不再黑箱",
      "空状态支持一键跳转下一步",
      "章节字数分布可视化",
    ],
  },
  {
    version: "v0.7",
    date: "2026-10",
    title: "视觉体系第一轮治理",
    items: [
      "全站统一卡片阴影、缓动与交错入场",
      "审稿人卡片、意见引用块、Cover Letter 信纸排版",
      "修复洞察页条形图与标题保存两处问题",
    ],
  },
  {
    version: "v0.6",
    date: "2026-10",
    title: "质量闭环 + 真实文献对标",
    items: [
      "审稿意见可标记「有道理 / 不成立」,命中率跨项目沉淀",
      "修改承诺:回复里答应改的每一处,上传修改稿后逐条核查",
      "文献对标:OpenAlex / Semantic Scholar 真实文献注入审稿",
    ],
  },
];

export const metadata = {
  title: "更新日志 — R&R Studio",
  description: "R&R Studio 的版本更新:新能力、体验改进与修复,用户视角的变更记录。",
};

export default function ChangelogPage() {
  return (
    <div className="min-h-dvh">
      <MarketingNav />
      <div className="mx-auto max-w-2xl px-4 pb-20 pt-10">
        <Link
          href="/"
          className="group inline-flex items-center gap-1 text-sm text-ink-faint transition hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={1.75} />
          返回首页
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">更新日志</h1>
        <p className="mt-2 text-sm text-ink-soft">
          每个版本交付给用户的增量。产品按周迭代,邀请码内测持续中。
        </p>

        <ol className="mt-10 space-y-5">
          {RELEASES.map((r, i) => (
            <Reveal key={r.version} delay={Math.min(i * 50, 200)}>
              <li className="relative rounded-2xl border border-line bg-white p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-[15px] font-semibold">
                    <span className="text-accent">{r.version}</span> · {r.title}
                  </h2>
                  <span className="text-xs text-ink-faint">{r.date}</span>
                </div>
                <ul className="mt-3 space-y-1.5 text-[13px] leading-relaxed text-ink-soft">
                  {r.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            </Reveal>
          ))}
        </ol>

        <footer className="mt-12 border-t border-line pt-6 text-center text-[13px] text-ink-faint">
          © <FooterYear /> R&amp;R Studio ·{" "}
          <Link href="/guide" className="transition hover:text-accent">
            使用指南
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
