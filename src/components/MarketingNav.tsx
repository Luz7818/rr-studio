import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** 营销页浮岛胶囊导航(flolab 式):白胶囊 Logo + 居中链接 + CTA。
 *  仅在营销壳(SaaS 未登录,body[data-bare])下显示,应用壳内由 CSS 隐藏。 */
export default function MarketingNav() {
  return (
    <header className="bare-only sticky top-4 z-40 mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4">
      <Link
        href="/"
        className="press flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-4 card-shadow"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" className="h-9 w-9 rounded-full" />
        <span className="text-[15px] font-semibold tracking-tight">R&amp;R Studio</span>
      </Link>

      <nav className="hidden items-center gap-0.5 rounded-full border border-line bg-white/90 px-2 py-1.5 card-shadow backdrop-blur lg:flex">
        <Link href="/#features" className="rounded-full px-3 py-1.5 text-[13px] text-ink-soft transition hover:bg-band hover:text-ink">
          产品能力
        </Link>
        <Link href="/#faq" className="rounded-full px-3 py-1.5 text-[13px] text-ink-soft transition hover:bg-band hover:text-ink">
          常见问题
        </Link>
        <Link href="/guide" className="rounded-full px-3 py-1.5 text-[13px] text-ink-soft transition hover:bg-band hover:text-ink">
          使用指南
        </Link>
        <Link href="/changelog" className="rounded-full px-3 py-1.5 text-[13px] text-ink-soft transition hover:bg-band hover:text-ink">
          更新日志
        </Link>
        <Link href="/pricing" className="rounded-full px-3 py-1.5 text-[13px] text-ink-soft transition hover:bg-band hover:text-ink">
          定价
        </Link>
      </nav>

      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-full px-4 py-2.5 text-[13px] font-medium text-ink-soft transition hover:text-ink"
        >
          登录
        </Link>
        <Link
          href="/signup"
          className="press group inline-flex items-center gap-1 rounded-full bg-accent px-5 py-2.5 text-[13px] font-medium text-white shadow-lg shadow-accent/25 transition hover:bg-accent/90"
        >
          免费开始
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
        </Link>
      </div>
    </header>
  );
}
