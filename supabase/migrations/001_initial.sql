create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null check (role in ('instructor','manager','admin')) default 'instructor',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  check_in_at timestamptz not null default now(),
  attendance_date date generated always as ((check_in_at at time zone 'Asia/Kolkata')::date) stored,
  selfie_path text not null,
  status text not null default 'present' check (status in ('present','late')),
  created_at timestamptz not null default now(),
  unique(user_id, attendance_date)
);

create table if not exists public.attendance_archives (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  file_path text not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null
);

create index if not exists attendance_user_id_idx on public.attendance(user_id);
create index if not exists attendance_date_idx on public.attendance(attendance_date);
create index if not exists attendance_check_in_idx on public.attendance(check_in_at);

create or replace function public.current_role() returns text language sql stable security definer set search_path=public as $$
  select role from public.profiles where id=auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.attendance enable row level security;
alter table public.attendance_archives enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (id=auth.uid() or public.current_role() in ('manager','admin'));

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all using (public.current_role()='admin') with check (public.current_role()='admin');

drop policy if exists attendance_select on public.attendance;
create policy attendance_select on public.attendance for select using (user_id=auth.uid() or public.current_role() in ('manager','admin'));

drop policy if exists attendance_insert on public.attendance;
create policy attendance_insert on public.attendance for insert with check (user_id=auth.uid() and public.current_role()='instructor');

drop policy if exists attendance_admin_all on public.attendance;
create policy attendance_admin_all on public.attendance for all using (public.current_role()='admin') with check (public.current_role()='admin');

drop policy if exists archives_read on public.attendance_archives;
create policy archives_read on public.attendance_archives for select using (public.current_role() in ('manager','admin'));

drop policy if exists archives_admin_all on public.attendance_archives;
create policy archives_admin_all on public.attendance_archives for all using (public.current_role()='admin') with check (public.current_role()='admin');

insert into storage.buckets (id,name,public) values ('attendance-selfies','attendance-selfies',false) on conflict (id) do nothing;

drop policy if exists "attendance selfie insert" on storage.objects;
create policy "attendance selfie insert" on storage.objects for insert to authenticated with check (bucket_id='attendance-selfies' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "attendance selfie read" on storage.objects;
create policy "attendance selfie read" on storage.objects for select to authenticated using (bucket_id='attendance-selfies' and ((storage.foldername(name))[1]=auth.uid()::text or public.current_role() in ('manager','admin')));

drop policy if exists "attendance selfie delete" on storage.objects;
create policy "attendance selfie delete" on storage.objects for delete to authenticated using (bucket_id='attendance-selfies' and public.current_role()='admin');
