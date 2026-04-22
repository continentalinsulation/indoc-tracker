-- =============================================================================
-- CONTINENTAL INSULATION — OPERATIONS DAILY LOG
-- Supabase schema + RLS + seed data
--
-- HOW TO RUN:
--   1. Go to supabase.com → your project → SQL Editor (left sidebar)
--   2. Click "New query"
--   3. Paste this ENTIRE file
--   4. Click "Run" (or Ctrl+Enter)
--   5. Scroll to the bottom of the output — you should see "Setup complete"
--
-- Safe to re-run: every statement uses IF NOT EXISTS or ON CONFLICT.
-- =============================================================================

-- ─── TABLES ──────────────────────────────────────────────────────────────────

create table if not exists ops_crew (
  id text primary key,
  name text not null,
  trade text not null check (trade in ('Mechanic','Apprentice','Asbestos','Labour','Ops')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists ops_facilities (
  id text primary key,
  name text not null,
  sort_order int not null default 0
);

create table if not exists ops_jobs (
  id uuid primary key default gen_random_uuid(),
  wo text,
  jonas text,
  facility_id text references ops_facilities(id) on delete set null,
  name text not null,
  status text not null default 'active' check (status in ('active','hold','deferred','complete','planned','visit')),
  pct int not null default 0 check (pct between 0 and 100),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ops_daily_logs (
  date date primary key,
  signoff text,
  submitted boolean not null default false,
  submitted_at timestamptz,
  weather_temp int,
  weather_feels int,
  weather_cond text,
  weather_alert text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ops_daily_crew_presence (
  date date not null,
  crew_id text not null references ops_crew(id) on delete cascade,
  on_site boolean not null default false,
  primary key (date, crew_id)
);

create table if not exists ops_daily_job_entries (
  date date not null,
  job_id uuid not null references ops_jobs(id) on delete cascade,
  pct int,
  status text check (status in ('active','hold','deferred','complete','planned','visit')),
  notes text,
  primary key (date, job_id)
);

create table if not exists ops_daily_job_crew (
  date date not null,
  job_id uuid not null references ops_jobs(id) on delete cascade,
  crew_id text not null references ops_crew(id) on delete cascade,
  reg_hours numeric(5,2) not null default 0,
  ot_hours numeric(5,2) not null default 0,
  primary key (date, job_id, crew_id)
);

create table if not exists ops_todos (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  text text not null,
  priority text not null default 'med' check (priority in ('high','med','low')),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists ops_meetings (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time text,
  what text not null,
  "where" text,
  who text
);

create table if not exists ops_photos (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  job_id uuid references ops_jobs(id) on delete cascade,
  storage_path text not null,
  caption text,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

-- ─── ROW-LEVEL SECURITY ──────────────────────────────────────────────────────
-- Any authenticated user can read and write all ops_ tables.
-- Anonymous (not-logged-in) users get nothing.

alter table ops_crew                 enable row level security;
alter table ops_facilities           enable row level security;
alter table ops_jobs                 enable row level security;
alter table ops_daily_logs           enable row level security;
alter table ops_daily_crew_presence  enable row level security;
alter table ops_daily_job_entries    enable row level security;
alter table ops_daily_job_crew       enable row level security;
alter table ops_todos                enable row level security;
alter table ops_meetings             enable row level security;
alter table ops_photos               enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'ops_crew','ops_facilities','ops_jobs','ops_daily_logs','ops_daily_crew_presence',
    'ops_daily_job_entries','ops_daily_job_crew','ops_todos','ops_meetings','ops_photos'
  ]) loop
    execute format('drop policy if exists "auth_all_%s" on %s', t, t);
    execute format('create policy "auth_all_%s" on %s for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;

-- ─── STORAGE BUCKET FOR PHOTOS ──────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('ops-photos', 'ops-photos', false)
on conflict (id) do nothing;

drop policy if exists "auth read ops photos" on storage.objects;
drop policy if exists "auth write ops photos" on storage.objects;

create policy "auth read ops photos" on storage.objects
  for select to authenticated using (bucket_id = 'ops-photos');
create policy "auth write ops photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'ops-photos');
create policy "auth update ops photos" on storage.objects
  for update to authenticated using (bucket_id = 'ops-photos');
create policy "auth delete ops photos" on storage.objects
  for delete to authenticated using (bucket_id = 'ops-photos');

-- ─── SEED DATA ──────────────────────────────────────────────────────────────

insert into ops_facilities (id, name, sort_order) values
  ('smelter',         'Smelter',         1),
  ('nickel-refinery', 'Nickel Refinery', 2),
  ('other',           'Other',           3),
  ('all-other-ci',    'All Other CI',    4)
on conflict (id) do nothing;

insert into ops_crew (id, name, trade, active) values
  -- Mechanics / Insulators
  ('bob-b',      'Bob Bertrand',        'Mechanic', true),
  ('bob-s',      'Bob Spooner',         'Mechanic', true),
  ('dave-j',     'Dave Jewitt',         'Mechanic', true),
  ('charlie-a',  'Charlie Antsy',       'Mechanic', true),
  ('jim-e',      'Jim Elliott',         'Mechanic', true),
  ('richard-c',  'Richard Cuthbertson', 'Mechanic', true),
  ('justin-l',   'Justin Langelier',    'Mechanic', true),
  ('chris-g',    'Chris Godkin',        'Mechanic', true),
  ('zach-l',     'Zach Legault',        'Mechanic', true),
  ('kevin-s',    'Kevin St Jean',       'Mechanic', true),
  -- Apprentices
  ('matt-s',     'Matt Santi',          'Apprentice', true),
  ('malcom-m',   'Malcom Macko',        'Apprentice', true),
  ('pat-l',      'Pat Lebarron',        'Apprentice', true),
  ('jessica-f',  'Jessica Friedberg',   'Apprentice', true),
  ('marc-l',     'Marc Leroux',         'Apprentice', true),
  -- Asbestos Removers
  ('bailey-d',   'Bailey Depatie',      'Asbestos', true),
  ('mike-v',     'Mike Viancourt',      'Asbestos', true),
  ('charles-a',  'Charles Allen',       'Asbestos', true),
  ('mitch-b',    'Mitch Brideau',       'Asbestos', true),
  ('kienan-c',   'Kienan Camsell',      'Asbestos', true),
  ('derek-p',    'Derek Penton',        'Asbestos', true),
  -- Labour
  ('edwin-b',    'Edwin Barreto',       'Labour', true),
  ('charles-r',  'Charles Railson',     'Labour', true),
  ('will-l',     'Will Lantz',          'Labour', true),
  ('doug-d',     'Doug Dow',            'Labour', true),
  ('ryder-l',    'Ryder Lalonde',       'Labour', true),
  ('darwin-p',   'Darwin Peer',         'Labour', true),
  -- Ops
  ('reid-m',     'Reid Morrison',       'Ops', true),
  ('ken',        'Ken',                 'Ops', true)
on conflict (id) do nothing;

-- =============================================================================
-- Done. Scroll down in the Supabase output and look for:
--   "Success. No rows returned"
-- If you see that, the schema is ready.
--
-- NEXT STEPS (in the Supabase dashboard):
--   1. Left sidebar → Authentication → Users → "Add user"
--   2. Enter your email + a password. Check "Auto Confirm User".
--   3. Repeat for each team member (up to 5).
--   4. Come back and tell me when done; I'll send the app code.
-- =============================================================================
