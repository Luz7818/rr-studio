import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents(PPR)与根布局读会话的 force-dynamic 不兼容;本应用是登录工具,
  // 全站按请求渲染即可,关闭 PPR(2026-10-19,带 Supabase 构建时暴露的阻塞 bug)
  cacheComponents: false,
  serverExternalPackages: ["unpdf", "mammoth", "pptxgenjs", "docx"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
