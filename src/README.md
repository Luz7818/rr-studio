# src/ —— 全部源码

> 用途:说明本目录(及四个子目录)管哪一段。每个文件干什么、谁依赖谁。

本目录是项目全部源码:App Router 页面与 21 个 API 路由在 `app/`,可复用 UI 在 `components/`,
核心逻辑(解析/脱敏/LLM/存储/配额/检索)在 `lib/`,第三方类型补丁在 `types/`。去掉任何一块,
对应能力即缺失:没有 `app/` 没有产品,没有 `lib/` 所有写路径失效。依赖方向见
[docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) 的模块依赖图;`proxy.ts` 是 Next 16 的
路由保护文件(旧名 middleware)。

## 文件清单

| 文件 | 干什么 | 备注 |
|---|---|---|
| `proxy.ts` | SaaS 模式路由保护(未登录跳登录页) | Next 16 约定,勿改名 middleware.ts |
| `app/layout.tsx` | 根布局:侧栏外壳、元数据/OG | 服务端读会话 |
| `app/page.tsx` | 首页分流:本地=仪表盘,SaaS 未登录=落地页 | |
| `app/globals.css` | Tailwind v4 令牌与全局样式 | 令牌清单见 DESIGN.md |
| `app/icon.svg` | favicon | |
| `favicon.ico` | 脚手架遗留 favicon | 优先级低于 icon.svg,可删 |

`app/` 其余为页面目录(login/signup/pricing/insights/projects)与 `api/`(21 个 Route
Handler,逐个职责见 `docs/ARCHITECTURE.md` 路由表)、`auth/`(确认回调)。

## 子目录

| 子目录 | 负责 |
|---|---|
| `app/` | 页面、布局与全部 API 路由(App Router 约定目录) |
| `components/` | 可复用 UI:AppShell、Dashboard、Uploader、Landing、FooterYear |
| `lib/` | 核心逻辑:types / parse / sanitize / llm / prompts / mocks / store / auth / quota / literature / supabase |
| `types/` | 第三方库类型补丁(`mammoth.d.ts`) |

`lib/` 内各文件职责与依赖方向逐条列在 `docs/ARCHITECTURE.md`,不在此复述。

## 和谁打交道

- **上游**:`package.json`(依赖与脚本)、`.env.local`(凭据,经 `process.env` 读取)。
- **下游**:构建产物进 `.next/`;运行态数据写 `.data/`。
- **改这里之后要跑**:`npm run lint && npm run build && LLM_API_KEY= npm run smoke`。

## 别动

- `proxy.ts` 的文件名与导出名(`proxy`)是 Next 16 框架约定,改名即失去路由保护。
- `app/layout.tsx` 中 `AppShell` 外层的 `<Suspense>` 是构建必需(`usePathname` 预渲染约束),删了 build 失败。
- `lib/llm.ts` 是唯一允许直接调用 LLM HTTP API 的文件;新增 AI 能力走它,不要在路由里写 fetch。
