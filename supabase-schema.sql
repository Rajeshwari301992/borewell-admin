-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New Query)

-- 1. Bookings table
create table if not exists public.bookings (
  booking_id        text primary key,
  customer_name     text not null default '',
  mobile            text not null default '',
  alt_mobile        text default '',
  email             text default '',
  address           text default '',
  village           text default '',
  pincode           text default '',
  service_type      text default '',
  depth             integer default 0,
  estimated_amount  numeric default 0,
  booking_date      text default '',
  required_date     text default '',
  status            text default 'Booking Received',
  notes             text default '',
  time_slot         text default '',
  assigned_team     text default '',
  assigned_operator text default '',
  assigned_vehicle  text default '',
  scheduled_date    text default '',
  scheduled_time    text default '',
  final_depth       integer,
  water_strike_level text,
  final_amount      numeric,
  job_notes         text default '',
  created_at        timestamptz default now()
);

-- Index for fast email/mobile lookups
create index if not exists idx_bookings_email         on public.bookings(email);
create index if not exists idx_bookings_mobile        on public.bookings(mobile);
create index if not exists idx_bookings_required_date on public.bookings(required_date);
create index if not exists idx_bookings_status        on public.bookings(status);

-- 2. App settings table (single-row)
create table if not exists public.app_settings (
  id            integer primary key default 1,
  default_limit integer default 3,
  day_limits    jsonb default '{}',
  blocked_dates text[] default array[]::text[],
  constraint single_row check (id = 1)
);
insert into public.app_settings (id) values (1) on conflict (id) do nothing;

-- 3. Slot overrides table
create table if not exists public.slot_overrides (
  date text,
  slot text,
  primary key (date, slot)
);

-- 4. Disable Row Level Security for server-side service-role access
--    (service role key bypasses RLS, so this is safe)
alter table public.bookings    disable row level security;
alter table public.app_settings disable row level security;
alter table public.slot_overrides disable row level security;
