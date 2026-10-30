"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CreditCard, FileText } from "lucide-react";

const NAV_GROUPS: Array<{
  label: string;
  items: Array<{ href: string; label: string; icon: typeof FileText }>;
}> = [
  {
    label: "工作区",
    items: [
      { href: "/", label: "工作台", icon: FileText },
      { href: "/insights", label: "审稿洞察", icon: BarChart3 },
    ],
  },
  {
    label: "方案",
    items: [{ href: "/pricing", label: "定价", icon: CreditCard }],
  },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="press inline-flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 card-shadow"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" className="h-8 w-8 rounded-full transition-transform duration-200 hover:-rotate-6" />
      {!compact && <span className="text-[15px] font-semibold tracking-tight">R&amp;R Studio</span>}
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
      <div className="rounded-2xl bg-band p-3.5">
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
          className="btn-primary press block rounded-full bg-accent py-2.5 text-center text-sm font-medium text-white transition hover:bg-accent/90"
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
    <div className="rounded-2xl bg-band p-3.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-ink">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        本地模式
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">
        数据仅存本机,配置 Supabase 后开放注册
      </p>
    </div>
  );

  return (
    <div className="min-h-dvh">
      {/* 桌面侧栏 */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-line bg-white px-3 py-5 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`press flex items-center gap-2.5 rounded-full px-3.5 py-2 text-[13px] transition ${
                        active
                          ? "bg-accent-soft font-medium text-accent"
                          : "text-ink-soft hover:bg-band hover:text-ink"
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-auto space-y-3">{accountBlock}</div>
      </aside>

      {/* 移动端顶栏 */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
        <Logo compact />
        <nav className="flex items-center gap-1">
          {NAV_GROUPS.flatMap((g) => g.items).map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-2.5 py-1.5 text-xs transition ${
                  active ? "bg-accent-soft font-medium text-accent" : "text-ink-soft"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="w-14 text-right text-xs text-ink-soft">
          {saas ? (email ? email.split("@")[0].slice(0, 8) : "未登录") : "本地"}
        </div>
      </header>

      <main className="lg:pl-56">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
