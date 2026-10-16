# supabase/ —— SaaS 模式数据库

> 用途:存放 Supabase 建表迁移 SQL。开放注册(SaaS 模式)前在 Supabase SQL Editor 执行。

`migration.sql` 是唯一的库结构事实源:projects(稿件,`data jsonb` 存完整 Project)、
profiles(方案,注册触发器自动建档)、invite_codes(内测邀请码,仅 service role 可读写)
三张表加 RLS。本地模式(未配 Supabase 环境变量)完全不碰数据库。

## 文件清单

| 文件 | 干什么 | 备注 |
|---|---|---|
| `migration.sql` | 建表 + 索引 + 注册触发器 + RLS 策略 | 幂等(if not exists / drop if exists),可重复执行 |

## 和谁打交道

- **上游**:`src/lib/store.ts`(supabaseStore 的表名与字段必须与本 SQL 一致)、
  `src/lib/quota.ts`(读 `profiles.plan` 计数 `projects.created_at`)、
  `src/app/api/auth/signup`(service role 校验 `invite_codes`)。
- **下游**:Supabase 项目本体;`docs/DEPLOYMENT.md` 的接入步骤以本文件为核心。
- **改这里之后要跑**:Supabase SQL Editor 重新执行 + `npm run build` + 演示模式 smoke;
  表结构变更需同步检查 `store.ts`/`quota.ts` 字段名。

## 别动

- 已在用的线上库**禁止改写既有列语义**(尤其 `data jsonb` 的内部结构)——应用按整文档读写,
  删字段等于删用户数据;演进只能加列或加 JSON 字段。
- `invite_codes` 不建任何 client 策略是有意的(仅 service role),别为「方便」加 anon 策略。
