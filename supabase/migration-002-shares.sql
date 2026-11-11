-- R&R Studio Supabase 增量迁移 002:报告分享(只读链接)
-- 在 Supabase Dashboard → SQL Editor 中执行本文件(增量,不重跑 001;全部语句幂等可重复执行)。
-- 设计依据:研究三轮-后端功能批设计.md §2.3-A ——
--   * owner 全权(auth.uid() = created_by):创建/列表/撤销走登录态 client,RLS 兜底;
--   * 不给 anon 任何 select 策略:公开读取只能走服务端 API 用 service role
--     (SUPABASE_SERVICE_ROLE_KEY)按 token 校验后投影返回——与 invite_codes 同一权限模型;
--   * token 校验不过(不存在/过期/已撤销)一律 404,不区分原因,防枚举探测。

-- ============ 1. 分享记录 ============
create table if not exists public.report_shares (
  id uuid primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  token text unique not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null,     -- 创建时 + ttlDays(默认 7 天)
  revoked_at timestamptz,              -- 撤销即置(软撤销,留审计痕迹)
  created_at timestamptz not null default now()
);

create index if not exists report_shares_project_idx
  on public.report_shares (project_id, created_at desc);

-- ============ 2. RLS ============
alter table public.report_shares enable row level security;

-- owner 全权(管理视图:创建/列表/撤销)
drop policy if exists "share owner all" on public.report_shares;
create policy "share owner all"
  on public.report_shares
  for all
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- 刻意不给 anon/authenticated 任何额外 select 策略:
-- 未登录访客走 GET /api/share/[token],服务端用 service role 读表;
-- anon 直接查表(即使拿到 project_id/token 猜测)一律空集,无存在性泄露。
