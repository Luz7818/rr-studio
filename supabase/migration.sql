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
