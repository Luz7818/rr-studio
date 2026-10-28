# 部署说明

> 用途:部署与排障的人。本地运行之外的 Vercel 上线与 Supabase 接入,及上线后验证。

## 上线前检查清单(大规模开放前逐项过)

- [ ] **重跑 `supabase/migration.sql`**(2026-10 后版本含 `llm_usage` 表与 `increment_llm_usage`
      函数,LLM 月度限额依赖;全部语句幂等,已建环境直接完整重跑)。
- [ ] **LLM 供应商换公共渠道**(智谱/DeepSeek 等):高校端点(如 SEU aicloud)在校外 IP 被 WAF
      420 拦截,Vercel 出口必挂;同时确认所选供应商**不拿用户数据训练模型**(见 `/privacy`)。
- [ ] **Vercel 函数时长**:LLM 路由已声明 `maxDuration = 60`;Hobby 计划函数上限即 60s,8 章节
      以上稿件 Critique 可能触顶,**正式开放注册建议升 Pro(300s)**。
- [ ] **Supabase 自定义 SMTP**:免费档内置发信限流(约 2 封/小时),注册确认邮件会排队;Authentication
      → SMTP 配置自定义发信(Resend/阿里云邮件推送均可)。
- [ ] **错误上报(可选)**:接 Sentry 或类似工具;当前服务端错误仅透出到 API 响应与日志。
- [ ] **域名与引流**:挂 luzzz.me 子路径/子域,落地页 OG 卡片实测(https://www.opengraph.xyz)。
- [ ] **免费限额核对**:`FREE_MONTHLY_LIMIT`(稿件数,`lib/quota.ts`)与 `FREE_LLM_MONTHLY_LIMIT`
      (LLM 次数,默认 60,可环境变量覆盖)是否符合定价页承诺。
- [ ] **SaaS 全链路验收**(需真实 Supabase):注册(邀请码)→ 第 2 篇 403 → SQL 升 Pro 解锁 →
      LLM 跑满 61 次第 61 次被 403 → 两个账号互不可见稿件(RLS)。

## Vercel 部署

在仓库根目录执行(首次会引导登录与项目关联):

```bash
npx vercel
```

Dashboard → Settings → Environment Variables 至少配置:

| 变量 | 必填 | 说明 |
|---|---|---|
| `LLM_API_KEY` | 是(否则线上只有演示模式) | OpenAI 兼容供应商 |
| `LLM_BASE_URL` `LLM_MODEL` | 建议 | 不填走智谱默认 |
| `LLM_EXTRA_BODY` | 供应商需要时 | JSON 字符串,见 `.env.example` |
| `NEXT_PUBLIC_SUPABASE_URL` 等 | SaaS 时 | 见下节 |

注意:本地 `.data/` 存储在 Vercel 上**不可用**(文件系统只读、实例不共享)。线上必须完成
Supabase 接入再开放注册;纯演示可在 Vercel 跑,但数据不持久。

## Supabase 接入(开放注册前置)

1. [supabase.com](https://supabase.com) 建项目(免费档够内测)。
2. SQL Editor 完整执行 `supabase/migration.sql`(建表 + 注册触发器 + RLS)。
3. 生成邀请码:`insert into public.invite_codes (code, note) values ('RR-BETA-0001', '首批内测');`
4. 环境变量:`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、
   `SUPABASE_SERVICE_ROLE_KEY`(服务端邀请码校验用,勿泄露)。
5. Authentication → URL Configuration:Site URL 设为线上域名,Redirect URLs 加入
   `https://<域名>/auth/callback`(邮箱确认回调用)。
6. 重部署后验证:头部出现「登录/注册」;未登录访问 `/projects` 跳登录页。

### 接入验证清单

- 注册(填邀请码)→ 收确认邮件 → 登录;错误邀请码被拒。
- Free 账号上传第 2 篇稿件被 403 拒绝,提示升级。
- 在 Supabase SQL Editor 执行定价页展示的升级 SQL → 额度解锁。
- 两个用户互相看不到对方稿件(RLS 隔离)。

## 上线后门禁

```bash
SMOKE_BASE_URL=https://<域名> LLM_API_KEY= npm run smoke
```

14/14 通过即线上功能完整(该轮跑演示模式,不消耗 key;真实模式同理可验)。

## 排障

| 现象 | 处理 |
|---|---|
| 线上全部请求 401 | Supabase 变量未配或 anon key 错;检查 env 与重部署 |
| 邮箱确认后回跳登录页 | Redirect URLs 未含 `/auth/callback` |
| LLM 报 420/非 JSON | 高校端点 WAF:Vercel 出口 IP 在校外,换公共供应商 |
| 函数超时(免费版 10s/60s 限) | Vercel Hobby 对长 LLM 请求有上限;升级计划或改用 Pro |
