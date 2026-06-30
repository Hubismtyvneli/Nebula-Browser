-- Nebula Browser — Plugin marketplace + device tabs schema
-- Run this in Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- Creates: plugins table (community marketplace)
-- Creates: storage bucket 'plugins' for plugin file uploads
-- Creates: device_tabs table (real-time tab sync across devices)
-- Enables RLS on all tables

-- ============================================================================
-- PLUGINS TABLE
-- ============================================================================
create table if not exists public.plugins (
  id            text primary key,
  author_id     uuid references auth.users(id) on delete set null,
  author_name   text,
  name          text not null,
  description   text,
  version       text default '1.0.0',
  type          text not null default 'sidebar', -- sidebar | toolbar | theme | ai | content | ntp-widget
  icon          text,        -- emoji or icon name
  entry_url     text,        -- URL to plugin's JS entry point (Supabase Storage)
  manifest      jsonb,       -- full plugin manifest
  permissions   text[] default '{}',
  tags          text[] default '{}',
  installs      integer default 0,
  rating        numeric(2,1) default 0,
  rating_count  integer default 0,
  is_public     boolean default true,
  is_approved   boolean default true,
  is_builtin    boolean default false,
  created_at    timestamptz default now()
);

create index if not exists plugins_public_idx
  on public.plugins(is_public, is_approved, created_at desc);

alter table public.plugins enable row level security;

drop policy if exists "Anyone can view public plugins" on public.plugins;
create policy "Anyone can view public plugins" on public.plugins
  for select using (is_public = true and is_approved = true);

drop policy if exists "Users can view all plugins" on public.plugins;
create policy "Users can view all plugins" on public.plugins
  for select using (auth.uid() = author_id or (is_public = true and is_approved = true));

drop policy if exists "Users can insert plugins" on public.plugins;
create policy "Users can insert plugins" on public.plugins
  for insert with check (auth.uid() = author_id);

drop policy if exists "Users can update own plugins" on public.plugins;
create policy "Users can update own plugins" on public.plugins
  for update using (auth.uid() = author_id);

drop policy if exists "Users can delete own plugins" on public.plugins;
create policy "Users can delete own plugins" on public.plugins
  for delete using (auth.uid() = author_id);

-- ============================================================================
-- DEVICE TABS TABLE (real-time sync)
-- ============================================================================
create table if not exists public.device_tabs (
  id            text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  device_id     text not null,
  device_name   text not null,
  tab_url       text not null,
  tab_title     text not null,
  tab_favicon   text,
  last_active   timestamptz default now()
);

create index if not exists device_tabs_user_idx
  on public.device_tabs(user_id, last_active desc);

-- Enable realtime for device_tabs
alter table public.device_tabs replica identity full;
alter publication supabase_realtime add table public.device_tabs;

alter table public.device_tabs enable row level security;

drop policy if exists "Users can view own device tabs" on public.device_tabs;
create policy "Users can view own device tabs" on public.device_tabs
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own device tabs" on public.device_tabs;
create policy "Users can insert own device tabs" on public.device_tabs
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own device tabs" on public.device_tabs;
create policy "Users can update own device tabs" on public.device_tabs
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own device tabs" on public.device_tabs;
create policy "Users can delete own device tabs" on public.device_tabs
  for delete using (auth.uid() = user_id);

-- ============================================================================
-- STORAGE BUCKET FOR PLUGIN FILES
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('plugins', 'plugins', true)
on conflict (id) do nothing;

drop policy if exists "Public can read plugins bucket" on storage.objects;
create policy "Public can read plugins bucket" on storage.objects
  for select using (bucket_id = 'plugins');

drop policy if exists "Authenticated can upload to plugins" on storage.objects;
create policy "Authenticated can upload to plugins" on storage.objects
  for insert with check (bucket_id = 'plugins' and auth.role() = 'authenticated');

drop policy if exists "Users can update own plugin files" on storage.objects;
create policy "Users can update own plugin files" on storage.objects
  for update using (bucket_id = 'plugins' and auth.uid() = owner);

drop policy if exists "Users can delete own plugin files" on storage.objects;
create policy "Users can delete own plugin files" on storage.objects
  for delete using (bucket_id = 'plugins' and auth.uid() = owner);

-- ============================================================================
-- DONE
-- ============================================================================
-- After running:
--   public.plugins table exists with RLS
--   public.device_tabs table exists with RLS + realtime enabled
--   'plugins' storage bucket exists (public read, auth write)
