-- =============================================================
-- MediTriage — Phase 3 schema (orgs, clinic cases, API keys)
-- Paste AFTER schema.sql into Supabase SQL Editor → Run
-- Safe to re-run (idempotent).
-- =============================================================

-- ---------- ORGANIZATIONS (white-label tenants) ----------
create table if not exists public.organizations (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  logo_url       text,
  primary_color  text not null default '#0f766e',
  tagline        text,
  disclaimer     text,
  created_at     timestamptz not null default now()
);

create index if not exists organizations_slug_idx
  on public.organizations (slug);

-- ---------- ORG MEMBERS (clinic staff) ----------
create table if not exists public.org_members (
  org_id     uuid not null references public.organizations (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null check (role in ('owner', 'clinician', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists org_members_user_idx
  on public.org_members (user_id);

-- ---------- CLINIC CASES (shared triage inbox) ----------
create table if not exists public.clinic_cases (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.organizations (id) on delete cascade,
  conversation_id  uuid references public.conversations (id) on delete set null,
  patient_user_id  uuid references auth.users (id) on delete set null,
  title            text not null default 'Shared assessment',
  urgency          text,
  assessment       jsonb not null,
  status           text not null default 'new'
                   check (status in ('new', 'reviewing', 'closed')),
  notes            text,
  shared_at        timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists clinic_cases_org_shared_idx
  on public.clinic_cases (org_id, shared_at desc);

create index if not exists clinic_cases_urgency_idx
  on public.clinic_cases (org_id, urgency);

-- ---------- API KEYS (public triage API) ----------
create table if not exists public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  name         text not null default 'Default key',
  key_prefix   text not null,
  key_hash     text not null unique,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);

create index if not exists api_keys_org_idx
  on public.api_keys (org_id);

-- ---------- EXTEND CONVERSATIONS with optional org ----------
alter table public.conversations
  add column if not exists org_id uuid references public.organizations (id) on delete set null;

-- ---------- updated_at on clinic_cases ----------
drop trigger if exists clinic_cases_set_updated_at on public.clinic_cases;
create trigger clinic_cases_set_updated_at
  before update on public.clinic_cases
  for each row execute function public.set_updated_at();

-- =============================================================
-- RLS
-- =============================================================
alter table public.organizations enable row level security;
alter table public.org_members   enable row level security;
alter table public.clinic_cases  enable row level security;
alter table public.api_keys      enable row level security;

-- Helper: is the current user a member of this org?
create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = target_org and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_clinician(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.org_members m
    where m.org_id = target_org
      and m.user_id = auth.uid()
      and m.role in ('owner', 'clinician')
  );
$$;

-- ORGANIZATIONS: public read by slug (white-label branding); members can see full row
drop policy if exists "orgs_select_public" on public.organizations;
create policy "orgs_select_public"
  on public.organizations for select
  using (true);

drop policy if exists "orgs_update_owner" on public.organizations;
create policy "orgs_update_owner"
  on public.organizations for update
  using (
    exists (
      select 1 from public.org_members m
      where m.org_id = id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

-- ORG MEMBERS
drop policy if exists "members_select_own_org" on public.org_members;
create policy "members_select_own_org"
  on public.org_members for select
  using (auth.uid() = user_id or public.is_org_member(org_id));

drop policy if exists "members_insert_owner" on public.org_members;
create policy "members_insert_owner"
  on public.org_members for insert
  with check (public.is_org_clinician(org_id) or auth.uid() = user_id);

drop policy if exists "members_delete_owner" on public.org_members;
create policy "members_delete_owner"
  on public.org_members for delete
  using (
    exists (
      select 1 from public.org_members m
      where m.org_id = org_members.org_id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );

-- CLINIC CASES: staff read/update; any signed-in user can share (insert)
drop policy if exists "cases_select_staff" on public.clinic_cases;
create policy "cases_select_staff"
  on public.clinic_cases for select
  using (
    public.is_org_member(org_id)
    or auth.uid() = patient_user_id
  );

drop policy if exists "cases_insert_share" on public.clinic_cases;
create policy "cases_insert_share"
  on public.clinic_cases for insert
  with check (auth.uid() = patient_user_id or public.is_org_clinician(org_id));

drop policy if exists "cases_update_staff" on public.clinic_cases;
create policy "cases_update_staff"
  on public.clinic_cases for update
  using (public.is_org_clinician(org_id))
  with check (public.is_org_clinician(org_id));

-- API KEYS: only org owners/clinicians can see metadata (never raw key)
drop policy if exists "keys_select_staff" on public.api_keys;
create policy "keys_select_staff"
  on public.api_keys for select
  using (public.is_org_clinician(org_id));

drop policy if exists "keys_insert_owner" on public.api_keys;
create policy "keys_insert_owner"
  on public.api_keys for insert
  with check (
    exists (
      select 1 from public.org_members m
      where m.org_id = api_keys.org_id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );

drop policy if exists "keys_update_owner" on public.api_keys;
create policy "keys_update_owner"
  on public.api_keys for update
  using (
    exists (
      select 1 from public.org_members m
      where m.org_id = api_keys.org_id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );

-- =============================================================
-- Seed a demo clinic (safe upsert by slug)
-- =============================================================
insert into public.organizations (slug, name, primary_color, tagline, disclaimer)
values (
  'demo-clinic',
  'Demo Clinic',
  '#0f766e',
  'Partner triage for Demo Clinic',
  'Shared assessments are advisory only — not a diagnosis. Clinicians must verify independently.'
)
on conflict (slug) do update set
  name = excluded.name,
  tagline = excluded.tagline;

-- =============================================================
-- AFTER RUNNING:
-- 1. Sign in once in the app (magic link) so your user exists.
-- 2. Add yourself as clinic staff (replace YOUR_USER_UUID):
--
-- insert into public.org_members (org_id, user_id, role)
-- select id, 'YOUR_USER_UUID', 'owner'
-- from public.organizations where slug = 'demo-clinic'
-- on conflict do nothing;
--
-- Find YOUR_USER_UUID in Authentication → Users.
-- =============================================================
