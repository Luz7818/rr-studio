# 页面与组件结构

> 用途:改页面的人。每个页面是什么、由哪些组件与数据来源构成。视觉规则看 `DESIGN.md`。

## 页面清单(6 个,复核:`find src/app -name page.tsx`)

| 路由 | 文件 | 作用 | 数据来源 |
|---|---|---|---|
| `/` | `app/page.tsx` | 本地模式=仪表盘;SaaS 未登录=落地页 | 服务端判 `getSessionUser` |
| `/projects/[id]` | `app/projects/[id]/page.tsx` | 流水线工作台(Suspense 包 Workspace) | `GET /api/projects/[id]` |
| `/insights` | `app/insights/page.tsx` | 审稿洞察 | `GET /api/insights` |
| `/pricing` | `app/pricing/page.tsx` | 定价(公开) | 静态 |
| `/login` `signup` | 各自 `page.tsx` | 认证表单 | `POST /api/auth/*` |
| `/auth/callback` | `app/auth/callback/route.ts` | 邮箱确认回调(非页面) | code 换 session |

公开性由 `src/proxy.ts` 控制:`/` 与 `/pricing` 放行,其余未登录跳 `/login`。

## 工作台页签(`projects/[id]/Workspace.tsx`)

七个页签,同页切换不换路由:解析概览 / Critique 报告 / 模拟审稿(含文献对标卡)/
回复审稿人(裁决 + 修改承诺 + 批量打磨)/ Cover Letter / 组会汇报 / 修改稿对照
(`RevisionPanel.tsx`:上传、差异、重审、承诺核查)。

## 组件

| 组件 | 职责 | 备注 |
|---|---|---|
| `AppShell.tsx` | 侧栏外壳(桌面)+ 顶栏(移动)、账号区 | 唯一用 `usePathname` 的地方 |
| `DashboardClient.tsx` | 方案额度条、上传器、稿件列表 | 列表拉取 + 删除 |
| `Uploader.tsx` | 文件/粘贴双模式新建 | FormData 上传,成功跳工作台 |
| `Landing.tsx` | SaaS 落地页 | hero 点阵、浮岛 mockup、对比区、CTA |
| `FooterYear` | 版权年份 | 客户端组件,绕开预渲染时间限制 |

## 交互约定

- 所有写操作经 `runPipeline` / `patchProject` / `saveThread`,失败进页面错误条;
  `busy` 单值防重入。
- 自动保存:标题、期刊、回复草稿、承诺在 `onBlur` 时 PATCH;乐观更新本地 state 再落库。
- 导出按钮一律 `<a href>` 直链 GET;PPTX/DOCX 响应带 `attachment` 头。
