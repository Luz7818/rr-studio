-- R&R Studio Supabase 迁移脚本(M3)
-- 在 Supabase Dashboard → SQL Editor 中完整执行本文件,
-- 然后在 .env.local 填入 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
-- (内测邀请码校验还需 SUPABASE_SERVICE_ROLE_KEY)。

-- ============ 1. 稿件存储 ============
create table if not exists public.projects (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '未命名稿件',
  status text not null default 'uploaded',
  -- Project 的完整 JSON(sections/critique/reviews/responses/coverLetter/seminar)
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_idx on public.projects (user_id, created_at desc);

-- ============ 2. 用户方案(free / pro / lab)============
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'lab')),
  plan_expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- 注册时自动创建 profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ 3. 邀请码(内测期)============
create table if not exists public.invite_codes (
  code text primary key,
  note text,
  used_by uuid references auth.users (id),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- 生成邀请码示例(按需执行,替换 XXXX-XXXX):
-- insert into public.invite_codes (code, note) values ('RR-BETA-0001', '首批内测'), ('RR-BETA-0002', '课题组');

-- ============ 4. RLS ============
alter table public.projects enable row level security;
drop policy if exists "users own their projects" on public.projects;
create policy "users own their projects"
  on public.projects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.profiles enable row level security;
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- invite_codes 不开任何 client 策略:仅 service role 可读写(邀请码校验在服务端完成)
alter table public.invite_codes enable row level security;

-- ============ 5. LLM 月度用量(成本限额)============
-- Free 方案每月有 LLM 分析次数上限(默认 60,可由环境变量 FREE_LLM_MONTHLY_LIMIT 调整),
-- Pro/Lab 不限。计数走服务端 service role(rpc 原子累加),不开放 client 策略。
-- 已建环境的用户:重新完整执行本文件即可(全部语句幂等)。
create table if not exists public.llm_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  month text not null,
  calls int not null default 0,
  primary key (user_id, month)
);

alter table public.llm_usage enable row level security;

-- 原子累加:service role 在每次成功调用 LLM 后执行
create or replace function public.increment_llm_usage(p_user uuid, p_month text, p_amount int)
returns void
language sql
as $$
  insert into public.llm_usage (user_id, month, calls)
  values (p_user, p_month, greatest(p_amount, 0))
  on conflict (user_id, month) do update
    set calls = public.llm_usage.calls + greatest(excluded.calls, 0);
$$;
