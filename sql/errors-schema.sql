-- /sql/errors-schema.sql
-- Lightweight client error logging table for PositiveBacklink
-- Run in Supabase SQL Editor after main schema

create table if not exists public.client_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  url text,
  user_agent text,
  message text,
  stack text,
  source text,
  lineno integer,
  colno integer,
  user_id uuid references auth.users(id) on delete set null,
  severity text default 'error' check (severity in ('info','warn','error','fatal'))
);

create index if not exists idx_client_errors_created on public.client_errors(created_at desc);
create index if not exists idx_client_errors_severity on public.client_errors(severity, created_at desc);

-- RLS: only service role can read/write
alter table public.client_errors enable row level security;

-- Allow anyone (anon) to INSERT errors (we limit by rate in the API endpoint)
drop policy if exists "client_errors_insert_anon" on public.client_errors;
create policy "client_errors_insert_anon" on public.client_errors
  for insert to anon, authenticated
  with check (true);

-- Only admins can read errors
drop policy if exists "client_errors_read_admin" on public.client_errors;
create policy "client_errors_read_admin" on public.client_errors
  for select to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));