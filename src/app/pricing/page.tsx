import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import MarketingNav from "@/components/MarketingNav";
import { PLAN_UPGRADE_SQL } from "@/lib/quota";

const TIERS = [
  {
    name: "Free",
    price: "¥0",
    desc: "体验完整流水线",
    features: ["每月 1 篇稿件 · 60 次 LLM 分析", "Critique + 模拟审稿", "Response Letter + Cover Letter", "组会引擎(PPTX 导出)"],
    cta: null as string | null,
  },
  {
    name: "Pro",
    price: "¥49/月",
    desc: "个人研究者",
    features: ["无限稿件与 LLM 分析", "全部功能", "优先体验新特性", "支持独立开发者持续迭代"],
    cta: "推荐",
  },
  {
    name: "Lab",
    price: "¥299/月",
    desc: "课题组团队版",
    features: ["含 Pro 全部功能", "多席位共享", "课题组管理台(开发中)"],
    cta: null as string | null,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-dvh">
      <MarketingNav />
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">定价</h1>
        <p className="mt-2 text-sm text-ink-soft">一次专业润色机构的单篇收费 ¥3000+,Pro 订阅每月不到一顿饭钱。</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`panel rounded-xl border bg-white p-6 ${
              t.cta ? "card-shadow border-accent/50" : "border-line"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">{t.name}</h2>
              {t.cta && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-white">{t.cta}</span>
              )}
            </div>
            <p className="mt-3 text-2xl font-semibold text-accent">{t.price}</p>
            <p className="text-xs text-ink-faint">{t.desc}</p>
            <ul className="mt-4 space-y-2 text-[13px] text-ink-soft">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-5 text-sm text-amber-900">
        <h3 className="text-[13px] font-semibold">邀请码内测进行中</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px]">
          <li>注册需要邀请码(找站长或通过 luzzz.me 获取),注册后默认 Free 方案。</li>
          <li>支付通道(支付宝/微信)接入中;内测期升级方式为管理员手动开通:在 Supabase Dashboard 的 SQL Editor 执行:</li>
        </ul>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-amber-100/70 p-3 text-xs leading-relaxed">{PLAN_UPGRADE_SQL("user@example.com", "pro")}</pre>
        <p className="mt-2 text-xs text-amber-700">Pro 到期后自动回落 Free,不影响已有数据。</p>
      </div>

      <div className="text-center text-sm text-ink-soft">
        <Link href="/" className="group inline-flex items-center gap-1 text-accent hover:underline">
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={1.75} />
          返回首页
        </Link>
      </div>
      </div>
    </div>
  );
}
