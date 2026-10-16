"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/", label: "工作台" },
  { href: "/insights", label: "审稿洞察" },
  { href: "/pricing", label: "定价" },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-accent text-base font-black text-white">
        R
      </span>
      {!compact && (
        <span className="text-[15px] font-extrabold tracking-tight">
          R&amp;R Studio
        </span>
      )}
    </Link>
  );
}

export default function AppShell({
  saas,
  email,
  children,
}: {
  saas: boolean;
  email?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  const accountBlock = saas ? (
    email ? (
      <div className="rounded-2xl bg-band p-3">
        <p className="truncate text-xs font-medium text-ink">{email}</p>
        <button
          onClick={() => void signOut()}
          disabled={signingOut}
          className="press mt-1.5 text-xs text-ink-soft transition hover:text-accent disabled:opacity-50"
        >
          {signingOut ? "退出中…" : "退出登录"}
        </button>
      </div>
    ) : (
      <div className="space-y-2">
        <Link
          href="/signup"
          className="press block rounded-full bg-accent py-2.5 text-center text-sm font-medium text-white transition hover:bg-accent/90"
        >
          注册(内测邀请码)
        </Link>
        <Link
          href="/login"
          className="press block rounded-full border border-line bg-white py-2.5 text-center text-sm font-medium text-ink transition hover:border-accent/40"
        >
          登录
        </Link>
      </div>
    )
  ) : (
    <div className="rounded-2xl bg-band p-3">
      <p className="text-xs font-medium text-ink">本地模式</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-ink-faint">
        数据仅存本机,配置 Supabase 后开放注册
      </p>
    </div>
  );

  return (
    <div className="min-h-dvh">
      {/* 桌面侧栏 */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-white px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-9 space-y-1">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`press block rounded-full px-4 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-accent-soft text-accent"
                    : "text-ink-soft hover:bg-band hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3">{accountBlock}</div>
      </aside>

      {/* 移动端顶栏 */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
        <Logo compact />
        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  active ? "bg-accent-soft text-accent" : "text-ink-soft"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="w-16 text-right text-xs text-ink-soft">
          {saas ? (email ? email.split("@")[0].slice(0, 8) : "未登录") : "本地"}
        </div>
      </header>

      <main className="lg:pl-60">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">{children}</div>
      </main>
    </div>
  );
}
