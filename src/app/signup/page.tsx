"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, inviteCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "注册失败");
      if (data.needsEmailConfirm) {
        setNotice("注册成功!请查收邮箱中的确认邮件,点击确认链接后再登录。");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <form onSubmit={submit} className="rise-in panel w-full max-w-sm space-y-4 rounded-xl border border-line bg-white p-8">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" className="h-10 w-10 rounded-full" />
          <h1 className="text-lg font-semibold tracking-tight">注册 R&amp;R Studio</h1>
        </div>
        <p className="text-xs text-ink-faint">内测期需要邀请码,可在定价页了解获取方式。</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="邮箱"
          required
          className="field w-full rounded-full px-4 py-2.5 text-sm outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码(至少 8 位)"
          required
          minLength={8}
          className="field w-full rounded-full px-4 py-2.5 text-sm outline-none"
        />
        <input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="邀请码"
          className="field w-full rounded-full px-4 py-2.5 text-sm outline-none"
        />
        {error && <p className="rise-in rounded-xl bg-red-50 px-3.5 py-2 text-sm text-red-700">{error}</p>}
        {notice && (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}{" "}
            {notice.includes("确认邮件") && (
              <Link href="/login" className="underline">
                去登录
              </Link>
            )}
          </p>
        )}
        {!notice && (
          <button
            type="submit"
            disabled={busy}
            className="btn-primary press w-full rounded-full bg-accent py-2.5 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
          >
            {busy ? "注册中…" : "注册"}
          </button>
        )}
        <p className="text-center text-sm text-ink-soft">
          已有账号?{" "}
          <Link href="/login" className="text-accent hover:underline">
            登录
          </Link>
        </p>
      </form>
    </div>
  );
}
