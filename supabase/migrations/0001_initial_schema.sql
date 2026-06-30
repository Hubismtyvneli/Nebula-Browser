-- Nebula Browser — Supabase schema for user data sync
-- Run this in Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- Creates tables: bookmarks, settings, history_entries
-- Enables Row Level Security (RLS) so users can only access their own data
-- Creates policies for authenticated users

-- ============================================================================
-- BOOKMARKS
-- ============================================================================
create table if not exists public.bookmarks (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  url         text not null,
  favicon     text,
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

-- Enable Row Level Security
alter table public.bookmarks enable row level security;

-- Policy: users can only see/edit their own bookmarks
drop policy if exists "Users can view own bookmarks" on public.bookmarks;
create policy "Users can view own bookmarks" on public.bookmarks
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own bookmarks" on public.bookmarks;
create policy "Users can insert own bookmarks" on public.bookmarks
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own bookmarks" on public.bookmarks;
create policy "Users can update own bookmarks" on public.bookmarks
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own bookmarks" on public.bookmarks;
create policy "Users can delete own bookmarks" on public.bookmarks
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- SETTINGS (one row per user)
-- ============================================================================
create table if not exists public.settings (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  accent       text default 'cyan',
  theme        text default 'dark',
  glass        text default 'strong',
  wallpaper    text default 'aurora',
  reduce_motion boolean default false,
  updated_at   timestamptz default now()
);

alter table public.settings enable row level security;

drop policy if exists "Users can view own settings" on public.settings;
create policy "Users can view own settings" on public.settings
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own settings" on public.settings;
create policy "Users can insert own settings" on public.settings
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own settings" on public.settings;
create policy "Users can update own settings" on public.settings
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own settings" on public.settings;
create policy "Users can delete own settings" on public.settings
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- HISTORY ENTRIES
-- ============================================================================
create table if not exists public.history_entries (
  id          text primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  url         text not null,
  visited_at  timestamptz default now()
);

-- Index for fast queries ordered by time
create index if not exists history_entries_user_visited_idx
  on public.history_entries(user_id, visited_at desc);

alter table public.history_entries enable row level security;

drop policy if exists "Users can view own history" on public.history_entries;
create policy "Users can view own history" on public.history_entries
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own history" on public.history_entries;
create policy "Users can insert own history" on public.history_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own history" on public.history_entries;
create policy "Users can delete own history" on public.history_entries
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- AUTO-UPDATE updated_at ON SETTINGS
-- ============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at
  before update on public.settings
  for each row execute function public.handle_updated_at();

-- ============================================================================
-- DONE
-- ============================================================================
-- After running this, the following tables exist:
--   public.bookmarks        — synced bookmarks
--   public.settings         — synced settings (accent, theme, glass, wallpaper)
--   public.history_entries  — synced browsing history
--
-- All protected by RLS — users can only access their own rows.
