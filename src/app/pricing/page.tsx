import Link from "next/link";
import { PLAN_UPGRADE_SQL } from "@/lib/quota";

const TIERS = [
  {
    name: "Free",
    price: "¥0",
    desc: "体验完整流水线",
    features: ["每月 1 篇稿件", "Critique + 模拟审稿", "Response Letter + Cover Letter", "组会引擎(PPTX 导出)"],
    cta: null as string | null,
  },
  {
    name: "Pro",
    price: "¥49/月",
    desc: "个人研究者",
    features: ["无限稿件", "全部功能", "优先体验新特性", "支持独立开发者持续迭代"],
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
    <div className="mx-auto max-w-4xl space-y-8 py-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">定价</h1>
        <p className="mt-2 text-ink-soft">一次专业润色机构的单篇收费 ¥3000+,Pro 订阅每月不到一顿饭钱。</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`rounded-2xl border bg-white p-6 shadow-sm ${
              t.cta ? "border-accent/50 ring-2 ring-accent/20" : "border-line"
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{t.name}</h2>
              {t.cta && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-white">{t.cta}</span>
              )}
            </div>
            <p className="mt-2 text-2xl font-bold text-accent">{t.price}</p>
            <p className="text-xs text-ink-faint">{t.desc}</p>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              {t.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-emerald-500">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <h3 className="font-semibold">🎁 邀请码内测进行中</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>注册需要邀请码(找站长或通过 luzzz.me 获取),注册后默认 Free 方案。</li>
          <li>支付通道(支付宝/微信)接入中;内测期升级方式为管理员手动开通:在 Supabase Dashboard 的 SQL Editor 执行:</li>
        </ul>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-amber-100 p-3 text-xs leading-relaxed">{PLAN_UPGRADE_SQL("user@example.com", "pro")}</pre>
        <p className="mt-2 text-xs text-amber-700">Pro 到期后自动回落 Free,不影响已有数据。</p>
      </div>

      <div className="text-center text-sm text-ink-soft">
        <Link href="/" className="text-accent hover:underline">
          ← 返回工作台
        </Link>
      </div>
    </div>
  );
}
