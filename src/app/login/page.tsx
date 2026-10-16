"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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
    <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold">登录 R&amp;R Studio</h1>
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
        placeholder="密码"
        required
        className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
      >
        {busy ? "登录中…" : "登录"}
      </button>
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
    <div className="flex min-h-[60vh] items-center justify-center">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
