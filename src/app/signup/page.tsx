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
    <div className="flex min-h-[60vh] items-center justify-center">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold">注册 R&amp;R Studio</h1>
        <p className="text-xs text-ink-faint">内测期需要邀请码,可在定价页了解获取方式。</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="邮箱"
          required
          className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码(至少 8 位)"
          required
          minLength={8}
          className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="邀请码"
          className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
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
            className="w-full rounded-xl bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
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
