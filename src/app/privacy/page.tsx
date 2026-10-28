import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FooterYear from "@/components/FooterYear";
import MarketingNav from "@/components/MarketingNav";

export const metadata = {
  title: "隐私说明 — R&R Studio",
  description: "R&R Studio 对你的稿件数据如何处理:本地模式与 SaaS 模式下的存储、脱敏与第三方传输边界。",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh">
      <MarketingNav />
      <article className="mx-auto max-w-2xl space-y-6 px-4 pb-16 pt-8">
      <div>
        <Link
          href="/"
          className="group inline-flex items-center gap-1 text-sm text-ink-faint transition hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={1.75} />
          返回
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">隐私说明</h1>
        <p className="mt-2 text-sm text-ink-soft">
          R&R Studio 的核心承诺是「投稿前,稿件先保密」。以下是这句话的准确边界,不含 marketing 修饰。
        </p>
      </div>

      <section className="rounded-xl border border-line bg-white p-6">
        <h2 className="font-semibold">本地模式(未配置 Supabase)</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-soft">
          <li>稿件与所有分析结果只保存在<strong>你自己的电脑</strong>(<code>.data/</code> 目录),不上传任何服务器。</li>
          <li>唯一出网的是发给 LLM 供应商的<strong>脱敏后章节文本</strong>,用于生成 Critique / 审稿 / 打磨。</li>
        </ul>
      </section>

      <section className="rounded-xl border border-line bg-white p-6">
        <h2 className="font-semibold">SaaS 模式(配置 Supabase 后注册使用)</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-soft">
          <li>稿件存储在 Supabase(行级安全策略限制只有你能读到自己数据)。</li>
          <li>LLM 分析时,<strong>脱敏后</strong>的章节文本会发送给你所配置的 LLM 供应商。</li>
          <li>注册邮箱与方案信息存于 Supabase 认证系统,不用于任何营销用途。</li>
        </ul>
      </section>

      <section className="rounded-xl border border-line bg-white p-6">
        <h2 className="font-semibold">脱敏做了什么、做不到什么</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-soft">
          <p>
            <strong className="text-ink">自动打码</strong>:邮箱、ORCID、网址、基金号、电话、长数字编号、
            单位行与通讯作者行;标题页(作者/单位区)整体排除,不进入分析与存储。
          </p>
          <p>
            <strong className="text-ink">边界</strong>:正则规则覆盖不了所有身份信息形态——正文里的自指
            (「我们课题组此前工作」)、非常规编号、图表内嵌信息等可能残留。对匿名评审级别的保密要求,
            建议上传前自行检查脱敏报告,或使用粘贴文本模式手工清理。
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white p-6">
        <h2 className="font-semibold">给部署者与用户的建议</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-soft">
          <li>SaaS 部署者应选择<strong>不拿用户数据训练模型</strong>的 LLM 供应商,并在供应商侧关闭数据留存(如可配)。</li>
          <li>本页是产品功能说明,不构成法律意见;如需正式隐私政策与用户协议,请按所在司法辖区另行起草。</li>
        </ul>
      </section>

      <footer className="border-t border-line pt-6 text-center text-sm text-ink-faint">
        © <FooterYear /> R&amp;R Studio ·{" "}
        <Link href="/pricing" className="transition hover:text-accent">
          定价
        </Link>
      </footer>
    </article>
    </div>
  );
}
