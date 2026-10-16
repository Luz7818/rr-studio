import Link from "next/link";
import FooterYear from "@/components/FooterYear";

const FEATURES = [
  {
    title: "逐段学术 Critique",
    desc: "逻辑、表达、语法、风格四个维度逐段挑问题,给出可直接替换的英文改写句,勾选采纳后导出 Word 报告。",
  },
  {
    title: "三位 AI 审稿人 · 真实文献对标",
    desc: "方法论苛刻型、统计审稿人、领域资深专家分别出具 Overall 与 Major/Minor 意见;审稿依据来自 OpenAlex 检索的近三年真实文献,拒绝编造引用。",
  },
  {
    title: "Response Letter 打磨",
    desc: "每条意见一个线程:你写事实和数字,AI 逐条或批量打磨成专业得体的正式回复,一键导出 Word 逐点回复信。",
  },
  {
    title: "上传即脱敏",
    desc: "标题页整体排除,邮箱、基金号、单位、链接自动替换为占位符后再送入模型,隐私可承诺。",
  },
  {
    title: "组会引擎",
    desc: "论文变成组会 PPT:大纲、逐页讲稿、导师 Q&A 预演,导出真实 PPTX,讲稿就在演讲者备注里。",
  },
  {
    title: "修改稿对照与洞察",
    desc: "大修后逐节对比两版差异并对修改稿重新审稿;跨项目聚合审稿数据,看清自己的薄弱环节。",
  },
];

const STEPS = [
  ["上传草稿", "PDF / DOCX / 粘贴文本,自动脱敏并切分章节"],
  ["AI 审稿", "Critique 报告 + 三位审稿人的 Major/Minor 意见"],
  ["打磨交付", "Response Letter、Cover Letter、组会 PPTX 导出"],
];

export default function Landing() {
  return (
    <div className="space-y-24 pb-10 pt-6">
      {/* Hero */}
      <section className="relative text-center">
        <div
          aria-hidden
          className="bg-dots pointer-events-none absolute inset-x-0 -top-10 mx-auto h-[420px] max-w-3xl"
          style={{ maskImage: "radial-gradient(ellipse 60% 60% at 50% 40%, #000 30%, transparent 75%)" }}
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-medium text-ink-soft card-shadow">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Revise &amp; Resubmit · 研究生投稿加速流水线
          </span>
          <h1 className="mx-auto mt-7 max-w-3xl text-4xl font-black leading-[1.15] tracking-tight sm:text-[52px]">
            投稿前,先被
            <span className="text-accent"> AI 审稿人</span>
            <br />
            虐一遍
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-soft">
            写作平台帮你把论文写顺;R&amp;R Studio 帮你扛住真实审稿。自动脱敏 →
            逐段 Critique → 模拟审稿 → Response Letter 打磨 → Cover Letter →
            组会汇报 PPTX,一条流水线。
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="press rounded-full bg-accent px-8 py-3.5 font-medium text-white shadow-lg shadow-accent/25 transition hover:bg-accent/90"
            >
              免费开始
            </Link>
            <Link
              href="/pricing"
              className="press rounded-full border border-line bg-white px-8 py-3.5 font-medium text-ink transition hover:border-accent/40 hover:text-accent"
            >
              查看定价
            </Link>
          </div>
          <p className="mt-5 text-xs text-ink-faint">
            Free 方案每月 1 篇 · 内测期需邀请码
          </p>
        </div>

        {/* 浮岛产品 mockup */}
        <div className="relative mx-auto mt-16 max-w-2xl">
          <div className="rounded-3xl border border-accent/25 bg-white p-5 text-left card-shadow">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                <span className="text-sm font-bold">Manuscript Pipeline</span>
              </div>
              <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-accent">
                IEEE T-ITS
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4">
              {[
                ["解析脱敏", "8 章节 · 12 处打码", "bg-accent-soft text-accent"],
                ["Critique", "44 条 · 逻辑 12", "bg-band text-ink"],
                ["模拟审稿", "3 份 · Major 15", "bg-band text-ink"],
              ].map(([t, d, cls]) => (
                <div key={t} className="rounded-2xl border border-line p-3.5">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
                    {t}
                  </span>
                  <p className="mt-2.5 text-xs font-medium text-ink">{d}</p>
                  <div className="mt-3 space-y-1.5">
                    <div className="h-1.5 w-full rounded-full bg-band" />
                    <div className="h-1.5 w-4/5 rounded-full bg-band" />
                    <div className="h-1.5 w-3/5 rounded-full bg-band" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-band px-4 py-3">
              <span className="text-xs font-medium text-ink-soft">Response Letter · Cover Letter · 组会 PPTX</span>
              <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-white">导出</span>
            </div>
          </div>
          <span className="absolute -left-4 top-8 hidden rounded-full bg-ink px-3.5 py-1.5 text-xs font-medium text-white sm:block">
            三位 AI 审稿人
          </span>
          <span className="absolute -right-3 bottom-14 hidden rounded-full bg-accent px-3.5 py-1.5 text-xs font-medium text-white sm:block">
            PPTX 讲稿备注
          </span>
        </div>
      </section>

      {/* 功能 */}
      <section>
        <div className="rounded-[2.5rem] bg-band px-6 py-14 sm:px-12">
          <h2 className="text-center text-3xl font-black tracking-tight">一条流水线,四个产出物</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-[15px] text-ink-soft">
            通用聊天框做不到的场景化工作流:每一步的结果都可勾选、可编辑、可导出。
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl bg-white p-6 transition hover:shadow-lg hover:shadow-accent/5">
                <h3 className="font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 三步 */}
      <section>
        <h2 className="text-center text-3xl font-black tracking-tight">三步跑完</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {STEPS.map(([t, d], i) => (
            <div key={t} className="text-center">
              <span className="inline-grid h-11 w-11 place-items-center rounded-full bg-ink text-base font-black text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 font-bold">{t}</h3>
              <p className="mx-auto mt-1.5 max-w-56 text-sm leading-relaxed text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 差异化对比 */}
      <section>
        <h2 className="text-center text-3xl font-black tracking-tight">和通用 AI 写作平台,差在哪</h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-[15px] text-ink-soft">
          它们优化「写得顺」,我们优化「扛得住」。两件事都重要——但决定中稿的是后者。
        </p>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-line bg-white p-7">
            <p className="text-sm font-medium text-ink-faint">通用 AI 写作 / 润色平台</p>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              <li>帮你把句子改通顺、套模板扩写</li>
              <li>「AI 审查」通常是整体评分,意见不可申诉、不落工作流</li>
              <li>改完了没有机制验证是否改到位</li>
              <li>上传全文直接进模型,作者信息与基金号照传</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-accent/30 bg-accent-soft/40 p-7 ring-1 ring-accent/15">
            <p className="text-sm font-bold text-accent">R&amp;R Studio 的做法</p>
            <ul className="mt-4 space-y-3 text-sm text-ink">
              <li><b>对抗式审稿</b>:三位不同立场审稿人出具 Major/Minor,依据 OpenAlex 检索的近三年真实文献,不编造引用;每条意见你可标记「有道理 / 不成立」,命中率跨项目沉淀</li>
              <li><b>回复成信</b>:意见→草稿→AI 打磨→Word 版逐点回复信,直接可投</li>
              <li><b>承诺兑现核查</b>:回复里答应改的每一条,上传修改稿后逐条验证是否真改了</li>
              <li><b>上传即脱敏</b>:标题页整体排除,邮箱、基金号、单位自动打码后才进模型</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-[2.5rem] bg-ink px-8 py-14 text-center text-white">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
          一篇论文的润色报价 ¥3000+,
          <br className="sm:hidden" />
          这里每月 ¥49
        </h2>
        <p className="mt-3 text-sm text-white/60">Pro 无限稿件 · Free 每月 1 篇 · 随时取消</p>
        <Link
          href="/signup"
          className="press mt-8 inline-block rounded-full bg-accent px-10 py-3.5 font-medium text-white transition hover:bg-accent/90"
        >
          现在开始
        </Link>
      </section>

      <footer className="border-t border-line pt-8 text-center text-sm text-ink-faint">
        © <FooterYear /> R&amp;R Studio · Revise &amp; Resubmit ·{" "}
        <a href="https://luzzz.me" target="_blank" rel="noreferrer" className="transition hover:text-accent">
          luzzz.me
        </a>
      </footer>
    </div>
  );
}
