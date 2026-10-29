import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { getSessionUser, isSaasMode } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "R&R Studio — 投稿加速流水线",
  description:
    "上传英文论文草稿,生成逐段 Critique 报告、三份模拟审稿意见(真实文献对标)、Response Letter 打磨、Cover Letter、组会汇报 PPTX、修改稿对照与承诺兑现核查。",
  openGraph: {
    title: "R&R Studio — 投稿前,先被 AI 审稿人虐一遍",
    description:
      "研究生投稿加速流水线:自动脱敏 → 逐段 Critique → 三位 AI 审稿人(真实文献对标)→ Response Letter → Cover Letter → 组会 PPTX。",
    siteName: "R&R Studio",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "R&R Studio — 投稿加速流水线",
    description: "投稿前,先被 AI 审稿人虐一遍。三位 AI 审稿人 + Response Letter + 承诺兑现核查。",
  },
};

// 布局需读会话(SaaS 模式区分营销壳/应用壳):全部路由按请求渲染,
// 避免 cookies() 动态数据与静态预渲染冲突(带 Supabase 构建时的阻塞 bug)
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const saas = isSaasMode();
  const user = saas ? await getSessionUser() : null;

  // SaaS 未登录 = 营销壳:页面自备浮岛导航,脱离应用侧栏
  const bare = saas && !user;

  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <body className="antialiased" data-bare={bare ? "true" : undefined}>
        <div aria-hidden className="page-deco" />
        {bare ? (
          children
        ) : (
          <Suspense fallback={<div className="min-h-dvh" />}>
            <AppShell saas={saas} email={user?.email}>
              {children}
            </AppShell>
          </Suspense>
        )}
      </body>
    </html>
  );
}
