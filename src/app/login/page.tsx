"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(params.get("error"));
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "登录失败");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rise-in panel w-full max-w-sm space-y-4 rounded-xl border border-line bg-white p-8">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" className="h-10 w-10 rounded-full" />
        <h1 className="text-lg font-semibold tracking-tight">登录 R&amp;R Studio</h1>
      </div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="邮箱"
        required
        autoFocus
        autoComplete="email"
        className="field w-full rounded-full px-4 py-2.5 text-sm outline-none"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密码"
        required
        autoComplete="current-password"
        className="field w-full rounded-full px-4 py-2.5 text-sm outline-none"
      />
      {error && <p className="rise-in rounded-xl bg-red-50 px-3.5 py-2 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="btn-primary press w-full rounded-full bg-accent py-2.5 text-sm font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
      >
        {busy ? "登录中…" : "登录"}
      </button>
      <p className="text-center text-xs text-ink-faint">
        <Link href="/" className="inline-flex items-center gap-0.5 transition hover:text-accent">
          <ArrowLeft className="h-3 w-3" strokeWidth={1.75} aria-hidden />
          返回首页
        </Link>
      </p>
      <p className="text-center text-sm text-ink-soft">
        还没有账号?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          注册(内测需邀请码)
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
