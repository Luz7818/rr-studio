import Link from "next/link";
import {
  ArrowRight,
  FileSearch,
  GitCompareArrows,
  MailCheck,
  Presentation,
  ShieldCheck,
  Users,
} from "lucide-react";
import FooterYear from "@/components/FooterYear";
import MarketingNav from "@/components/MarketingNav";
import Reveal from "@/components/Reveal";

const FEATURES = [
  {
    icon: FileSearch,
    title: "逐段学术 Critique",
    desc: "逻辑、表达、语法、风格四个维度逐段挑问题,给出可直接替换的英文改写句,勾选采纳后导出 Word 报告。",
  },
  {
    icon: Users,
    title: "三位 AI 审稿人 · 真实文献对标",
    desc: "方法论苛刻型、统计审稿人、领域资深专家分别出具 Overall 与 Major/Minor 意见;审稿依据来自 OpenAlex 检索的近三年真实文献,拒绝编造引用。",
  },
  {
    icon: MailCheck,
    title: "Response Letter 打磨",
    desc: "每条意见一个线程:你写事实和数字,AI 逐条或批量打磨成专业得体的正式回复,一键导出 Word 逐点回复信。",
  },
  {
    icon: ShieldCheck,
    title: "上传即脱敏",
    desc: "标题页整体排除,邮箱、基金号、单位、链接自动替换为占位符后再送入模型,隐私可承诺。",
  },
  {
    icon: Presentation,
    title: "组会引擎",
    desc: "论文变成组会 PPT:大纲、逐页讲稿、导师 Q&A 预演,导出真实 PPTX,讲稿就在演讲者备注里。",
  },
  {
    icon: GitCompareArrows,
    title: "修改稿对照与洞察",
    desc: "大修后逐节对比两版差异并对修改稿重新审稿;跨项目聚合审稿数据,看清自己的薄弱环节。",
  },
];

const STATS = [
  ["40+", "逐段意见 / 篇"],
  ["3 位", "立场独立的 AI 审稿人"],
  ["100%", "审稿引用文献真实可溯"],
  ["4 类", "交付物一键导出"],
];

const STEPS = [
  ["上传草稿", "PDF / DOCX / 粘贴文本,自动脱敏并切分章节"],
  ["AI 审稿", "Critique 报告 + 三位审稿人的 Major/Minor 意见"],
  ["打磨交付", "Response Letter、Cover Letter、组会 PPTX 导出"],
];

const FAQ = [
  [
    "会上传我的作者信息吗?",
    "不会。标题页(作者/单位区)整体排除,邮箱、ORCID、基金号、链接、单位行在送入模型前自动替换为占位符。匿名评审级别的细节边界见隐私说明页。",
  ],
  [
    "审稿意见是不是模型编造的?",
    "审稿前先经 OpenAlex / Semantic Scholar 检索近三年真实文献,并作为依据注入审稿提示词、禁止编造引用。每条意见你还可以标记「有道理 / 不成立」,命中率跨项目沉淀。",
  ],
  [
    "和直接把论文丢给 ChatGPT 有什么区别?",
    "聊天框给的是一段泛泛总评;这里给的是可执行工作流:意见逐条成线程、回复可打磨成信、承诺了改动会在修改稿里被逐条核查。每一步产出都可勾选、可编辑、可导出。",
  ],
  [
    "我的数据存在哪里?",
    "本地模式全部数据只存你自己的电脑;SaaS 模式存于 Supabase(行级安全隔离),脱敏后文本送往 LLM 供应商。详见隐私说明页。",
  ],
  [
    "如何加入内测?",
    "内测期注册需要邀请码,注册后默认 Free 方案(每月 1 篇稿件 + 60 次 LLM 分析);Pro 每月 ¥49 无限额度。",
  ],
];

export default function Landing() {
  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <MarketingNav />

      {/* Hero:点阵 + 入场编排 */}
      <section className="relative mx-auto max-w-5xl px-4 pb-16 pt-20 text-center sm:pt-24">
        <div
          aria-hidden
          className="bg-dots pointer-events-none absolute inset-x-0 -top-6 mx-auto h-[460px] max-w-3xl"
          style={{ maskImage: "radial-gradient(ellipse 60% 60% at 50% 40%, #000 30%, transparent 75%)" }}
        />
        <div className="relative">
          <span className="stagger inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-medium text-ink-soft card-shadow">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Revise &amp; Resubmit · 研究生投稿加速流水线
          </span>
          <h1 className="stagger mx-auto mt-7 max-w-3xl text-4xl font-semibold leading-[1.18] tracking-tight sm:text-[52px]" style={{ animationDelay: "60ms" }}>
            <span className="text-accent">投稿前</span>,先被 AI 审稿人
            <br />
            虐一遍
          </h1>
          <p className="stagger mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-ink-soft sm:text-base" style={{ animationDelay: "120ms" }}>
            写作平台帮你把论文写顺;R&amp;R Studio 帮你扛住真实审稿。自动脱敏 →
            逐段 Critique → 模拟审稿 → Response Letter 打磨 → Cover Letter →
            组会汇报 PPTX,一条流水线。
          </p>
          <div className="stagger mt-9 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "180ms" }}>
            <Link
              href="/signup"
              className="press group inline-flex items-center gap-1.5 rounded-full bg-accent px-8 py-3.5 text-sm font-medium text-white shadow-lg shadow-accent/25 transition hover:bg-accent/90"
            >
              免费开始
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
            <Link
              href="/pricing"
              className="press inline-block rounded-full border border-line bg-white px-8 py-3.5 text-sm font-medium text-ink transition hover:border-accent/40 hover:text-accent"
            >
              查看定价
            </Link>
          </div>
          <p className="stagger mt-5 text-xs text-ink-faint" style={{ animationDelay: "240ms" }}>
            Free 方案每月 1 篇 · 内测期需邀请码
          </p>
        </div>

        {/* 数据带 */}
        <Reveal className="relative mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {STATS.map(([v, label]) => (
            <div key={label} className="rounded-2xl border border-line bg-white/90 px-4 py-5 backdrop-blur card-shadow">
              <p className="text-2xl font-semibold text-accent sm:text-3xl">{v}</p>
              <p className="mt-1 text-xs text-ink-soft">{label}</p>
            </div>
          ))}
        </Reveal>

        {/* 浮岛产品截图:真实界面,后景层叠 + 漂浮标签 */}
        <div className="relative mx-auto mt-20 max-w-3xl">
          <div
            className="float-soft-slow absolute -right-10 -top-10 hidden w-[46%] overflow-hidden rounded-xl border border-line bg-white shadow-xl shadow-ink/10 sm:block"
            aria-hidden
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/showcase-review.png" alt="" className="block w-full" />
          </div>
          <div className="float-soft relative overflow-hidden rounded-2xl border border-accent/25 bg-white shadow-2xl shadow-accent/15">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/showcase-response.png"
              alt="R&R Studio 工作台:审稿意见逐条打磨为正式回复,支持裁决与修改承诺"
              className="block w-full"
            />
          </div>
          <span className="card-shadow float-soft-slow absolute -left-4 top-10 hidden rounded-full bg-ink px-3.5 py-1.5 text-xs font-medium text-white sm:block">
            三位 AI 审稿人
          </span>
          <span className="card-shadow float-soft absolute -bottom-4 right-6 hidden rounded-full bg-accent px-3.5 py-1.5 text-xs font-medium text-white sm:block" style={{ animationDelay: "1.2s" }}>
            承诺兑现核查
          </span>
        </div>
      </section>

      {/* 功能 */}
      <section id="features" className="mx-auto max-w-5xl px-4 py-20">
        <Reveal>
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">一条流水线,四个产出物</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-ink-soft sm:text-[15px]">
            通用聊天框做不到的场景化工作流:每一步的结果都可勾选、可编辑、可导出。
          </p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 70}>
              <div className="h-full rounded-2xl border border-line bg-white p-6 transition hover:shadow-lg hover:shadow-accent/5">
                <span className="mb-4 inline-grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent">
                  <f.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="text-[15px] font-semibold">{f.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 工作流程三步 */}
      <section id="workflow" className="rounded-[2.5rem] bg-band px-6 py-20 sm:px-12">
        <Reveal>
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">三步跑完</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-ink-soft sm:text-[15px]">
            从草稿到可提交的完整材料,一个下午。
          </p>
        </Reveal>
        <div className="mx-auto mt-12 grid max-w-4xl gap-8 sm:grid-cols-3">
          {STEPS.map(([t, d], i) => (
            <Reveal key={t} delay={i * 90}>
              <div className="text-center">
                <span className="inline-grid h-11 w-11 place-items-center rounded-full bg-ink text-base font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-[15px] font-semibold">{t}</h3>
                <p className="mx-auto mt-1.5 max-w-56 text-[13px] leading-relaxed text-ink-soft">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 差异化对比 */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <Reveal>
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">和通用 AI 写作平台,差在哪</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-ink-soft sm:text-[15px]">
            它们优化「写得顺」,我们优化「扛得住」。两件事都重要——但决定中稿的是后者。
          </p>
        </Reveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl border border-line bg-white p-7">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">通用 AI 写作 / 润色平台</p>
              <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-ink-soft">
                <li>帮你把句子改通顺、套模板扩写</li>
                <li>「AI 审查」通常是整体评分,意见不可申诉、不落工作流</li>
                <li>改完了没有机制验证是否改到位</li>
                <li>上传全文直接进模型,作者信息与基金号照传</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={90}>
            <div className="h-full rounded-3xl border border-accent/30 bg-accent-soft/40 p-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">R&amp;R Studio 的做法</p>
              <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-ink">
                <li><b className="font-semibold">对抗式审稿</b>:三位不同立场审稿人出具 Major/Minor,依据近三年真实文献,不编造引用;每条意见可标记「有道理 / 不成立」,命中率跨项目沉淀</li>
                <li><b className="font-semibold">回复成信</b>:意见→草稿→AI 打磨→Word 版逐点回复信,直接可投</li>
                <li><b className="font-semibold">承诺兑现核查</b>:回复里答应改的每一条,上传修改稿后逐条验证是否真改了</li>
                <li><b className="font-semibold">上传即脱敏</b>:标题页整体排除,邮箱、基金号、单位自动打码后才进模型</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 pb-20">
        <Reveal>
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">常见问题</h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {FAQ.map(([q, a], i) => (
            <Reveal key={q} delay={i * 50}>
              <details className="group rounded-2xl border border-line bg-white px-5 transition open:shadow-lg open:shadow-accent/5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-band text-ink-soft transition-transform duration-200 group-open:rotate-45">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </span>
                </summary>
                <p className="pb-5 text-[13px] leading-relaxed text-ink-soft">{a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-24">
        <Reveal>
          <div className="rounded-[2.5rem] bg-ink px-8 py-16 text-center text-white">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              一篇论文的润色报价 ¥3000+,
              <br className="sm:hidden" />
              这里每月 ¥49
            </h2>
            <p className="mt-3 text-sm text-white/60">Pro 无限稿件 · Free 每月 1 篇 · 随时取消</p>
            <Link
              href="/signup"
              className="press group mt-8 inline-flex items-center gap-1.5 rounded-full bg-accent px-10 py-3.5 text-sm font-medium text-white transition hover:bg-accent/90"
            >
              现在开始
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* 页脚 */}
      <footer className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="" className="h-8 w-8 rounded-full" />
              <span className="text-[15px] font-semibold tracking-tight">R&amp;R Studio</span>
            </div>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-ink-soft">
              投稿前,先被 AI 审稿人虐一遍。给第一次投稿的研究生的对抗式审稿工作台。
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">产品</p>
            <ul className="mt-3 space-y-2 text-[13px] text-ink-soft">
              <li><Link href="/#features" className="transition hover:text-accent">产品能力</Link></li>
              <li><Link href="/pricing" className="transition hover:text-accent">定价</Link></li>
              <li><Link href="/signup" className="transition hover:text-accent">注册(内测邀请码)</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">资源</p>
            <ul className="mt-3 space-y-2 text-[13px] text-ink-soft">
              <li><Link href="/guide" className="transition hover:text-accent">使用指南</Link></li>
              <li><Link href="/changelog" className="transition hover:text-accent">更新日志</Link></li>
              <li><Link href="/privacy" className="transition hover:text-accent">隐私说明</Link></li>
              <li><Link href="/login" className="transition hover:text-accent">登录</Link></li>
              <li><a href="https://luzzz.me" target="_blank" rel="noreferrer" className="transition hover:text-accent">作者主页 luzzz.me</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line py-5 text-center text-[13px] text-ink-faint">
          © <FooterYear /> R&amp;R Studio · Revise &amp; Resubmit
        </div>
      </footer>
    </div>
  );
}
