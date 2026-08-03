-- =============================================================
-- MediTriage — Phase 2 schema (Supabase / Postgres)
-- Paste this whole file into: Supabase Dashboard → SQL Editor → Run
-- Safe to re-run (idempotent).
-- =============================================================

-- ---------- CONVERSATIONS ----------
create table if not exists public.conversations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null default 'New assessment',
  triage_result jsonb,
  assessment    jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists conversations_user_updated_idx
  on public.conversations (user_id, updated_at desc);

-- ---------- MESSAGES ----------
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'system')),
  content         text not null,
  show_urgency    boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at asc);

-- ---------- ASSESSMENT EXPORTS (audit trail) ----------
create table if not exists public.assessment_exports (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations (id) on delete set null,
  user_id         uuid not null references auth.users (id) on delete cascade,
  urgency         text,
  payload         jsonb not null,
  created_at      timestamptz not null default now()
);

create index if not exists assessment_exports_user_idx
  on public.assessment_exports (user_id, created_at desc);

-- ---------- AUTO-UPDATE updated_at ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

-- =============================================================
-- ROW LEVEL SECURITY — each user sees only their own data
-- =============================================================
alter table public.conversations       enable row level security;
alter table public.messages            enable row level security;
alter table public.assessment_exports  enable row level security;

-- CONVERSATIONS
drop policy if exists "conversations_select_own" on public.conversations;
create policy "conversations_select_own"
  on public.conversations for select
  using (auth.uid() = user_id);

drop policy if exists "conversations_insert_own" on public.conversations;
create policy "conversations_insert_own"
  on public.conversations for insert
  with check (auth.uid() = user_id);

drop policy if exists "conversations_update_own" on public.conversations;
create policy "conversations_update_own"
  on public.conversations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "conversations_delete_own" on public.conversations;
create policy "conversations_delete_own"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- MESSAGES
drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own"
  on public.messages for select
  using (auth.uid() = user_id);

drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own"
  on public.messages for insert
  with check (auth.uid() = user_id);

drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own"
  on public.messages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_delete_own"
  on public.messages for delete
  using (auth.uid() = user_id);

-- ASSESSMENT EXPORTS
drop policy if exists "exports_select_own" on public.assessment_exports;
create policy "exports_select_own"
  on public.assessment_exports for select
  using (auth.uid() = user_id);

drop policy if exists "exports_insert_own" on public.assessment_exports;
create policy "exports_insert_own"
  on public.assessment_exports for insert
  with check (auth.uid() = user_id);

drop policy if exists "exports_delete_own" on public.assessment_exports;
create policy "exports_delete_own"
  on public.assessment_exports for delete
  using (auth.uid() = user_id);

-- =============================================================
-- DONE
-- After running: Authentication → Providers → Email → enable
-- (Magic Link works with the default Email provider.)
-- Add your site URL under Authentication → URL Configuration:
--   http://localhost:3000
-- =============================================================
