# 架构总览

> 用途:要理解或修改架构的人。架构决策、目录结构、数据组织、模块依赖。操作步骤看 `docs/GET-START.md`。

## 总体架构

Next.js 16 App Router 单体全栈:同一进程承载 React 页面(Static/PPR)与 Route Handlers
(Node runtime API)。无独立后端。两条运行主线:

- **请求线**:浏览器 → `src/proxy.ts`(SaaS 模式下校验会话、放行公开页)→ 页面或 API →
  `getApiContext()`(鉴权 + 选存储)→ 存储 → 响应。
- **LLM 线**:API 路由 → `lib/llm.ts`(OpenAI 兼容 chat,超时/网络重试/WAF 识别)→
  `lib/prompts.ts` 提示词 → `jsonrepair` 兜底解析 → 结果并入 Project → 存储落盘。

关键决策(变更需在 `HISTORY.md` 记录缘由):

1. **双模式**:是否配置 Supabase 环境变量决定本地/SaaS 模式,代码零分叉——所有 API 通过
   `getApiContext()` 拿到 `{store, userId}`,本地模式固定 `userId="local"`。
2. **Project 单 JSON 文档**:一个稿件 = 一份 `Project`(含 sections/critique/reviews/responses/
   revision/seminar/literature),整读整写,无局部更新。规模(单稿 < 数 MB)下换来零迁移成本;
   Supabase 侧存 `data jsonb`。
3. **提示词即产品**:全部 LLM 提示词集中在 `lib/prompts.ts`,调优不散落在路由里。
4. **演示模式兜底**:`isLlmConfigured()` 为假时各路由走 `lib/mocks.ts` 占位实现,流水线永远可走通。
5. **文献 grounding**:审稿前可选检索(OpenAlex→S2 兜底),真实文献清单注入审稿提示词并
   禁止编造引用;结果存 `project.literature` 供初稿审稿与修改稿重审共用。

## 目录结构

```
src/
├── app/                  页面与 API(App Router 约定)
│   ├── api/              21 个 Route Handler,见下表
│   ├── auth/callback/    邮箱确认回调(code 换 session)
│   ├── insights/         审稿洞察页
│   ├── login/ signup/    认证页
│   ├── pricing/          定价页(公开)
│   ├── projects/[id]/    流水线工作台(7 页签)
│   ├── layout.tsx        根布局:侧栏外壳 + 元数据/OG
│   └── page.tsx          首页:本地模式=仪表盘,SaaS 未登录=落地页
├── components/           AppShell / Dashboard / Uploader / Landing / FooterYear
├── lib/                  核心逻辑(见下)
├── types/                mammoth 类型 shim
└── proxy.ts              Next 16 路由保护(middleware 新名)
```

`src/lib/` 模块与职责:

| 模块 | 职责 |
|---|---|
| `types.ts` | 全部领域类型;`Project` 是中心文档 |
| `parse.ts` | PDF/DOCX/文本 → 章节(IMRaD 启发式) |
| `sanitize.ts` | 敏感信息打码规则与报告 |
| `llm.ts` | OpenAI 兼容客户端;`LLM_EXTRA_BODY`;jsonrepair;重试 |
| `prompts.ts` | 全部提示词与 persona 定义 |
| `mocks.ts` | 演示模式占位实现 |
| `store.ts` | `ProjectStore` 接口 + 本地文件/Supabase 双实现 |
| `auth.ts` | `getApiContext()`:API 统一鉴权入口 |
| `quota.ts` | 方案读取与免费额度(自然月) |
| `literature.ts` | OpenAlex/Semantic Scholar 检索、摘要重建、去重排序 |
| `supabase/server.ts` | SSR 客户端工厂 |

## API 路由一览

| 路由 | 方法 | 作用 |
|---|---|---|
| `api/projects` | GET/POST | 列表+方案信息 / 上传解析(含额度检查) |
| `api/projects/[id]` | GET/PATCH/DELETE | 读 / 标题·期刊·采纳·线程·清修改稿 / 删 |
| `api/projects/[id]/critique` | POST | 逐段 Critique |
| `api/projects/[id]/literature` | POST | 文献对标检索 |
| `api/projects/[id]/review` | POST | 三位审稿人 + 重建回复线程(保留草稿/裁决) |
| `api/projects/[id]/responses` | PATCH/POST | 保存草稿·裁决·承诺 / AI 打磨单条 |
| `api/projects/[id]/responses/commitments` | POST | AI 批量提取修改承诺 |
| `api/projects/[id]/cover-letter` | POST | Cover Letter |
| `api/projects/[id]/seminar` | POST | 组会大纲+讲稿+Q&A |
| `api/projects/[id]/seminar/pptx` | GET | PPTX 导出(讲稿在备注) |
| `api/projects/[id]/revision` | POST | 上传修改稿(解析+脱敏) |
| `api/projects/[id]/revision/summary` | POST | 逐节差异+总评 |
| `api/projects/[id]/revision/re-review` | POST | 修改稿重审 |
| `api/projects/[id]/revision/promise-check` | POST | 承诺兑现核查 |
| `api/projects/[id]/export/*` | GET | Word 导出 ×2 |
| `api/auth/*`、`auth/callback` | — | 注册/登录/登出/确认回调 |
| `api/insights` | GET | 跨项目聚合(命中率/兑现率) |

## 数据组织

- **本地模式**:`.data/projects/<userId>/<uuid>.json`,每稿一文件;旧版单层目录首次访问自动迁入
  `local/`。整目录已 gitignore。
- **SaaS 模式**:`projects` 表(`id uuid PK, user_id, title, status, data jsonb, created_at,
  updated_at`),`data` 即完整 Project;RLS 限定 `auth.uid() = user_id`;`profiles`(方案)、
  `invite_codes`(邀请码,仅 service role)建表见 `supabase/migration.sql`。
- **`.env.local`**:LLM 与 Supabase 凭据,gitignore;模板在 `.env.example`。

## 模块依赖

```
页面(components) ──▶ API 路由(app/api)
                        │
                getApiContext(auth.ts) ──▶ store.ts ──▶ .data/ 或 Supabase
                        │
                quota.ts(SaaS 上传额度检查)
                        │
                llm.ts ──▶ prompts.ts(与 mocks.ts 互为演示兜底)
                        │            ▲
                literature.ts(检索) ┘(审稿提示词注入)
parse.ts + sanitize.ts(上传与修改稿共用)
```

依赖规则:`lib/` 不得 import 页面代码;API 路由不得绕过 `getApiContext` 直接触存储;
新增 LLM 能力 = `prompts.ts` 加提示词 + 路由编排 + `mocks.ts` 补演示实现 + smoke 补步骤。
