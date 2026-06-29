-- Nebula Browser — Wallpaper marketplace schema
-- Run this in Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- Creates: wallpapers table (community marketplace)
-- Creates: storage bucket 'wallpapers' for file uploads
-- Enables RLS so users can only edit/delete their own uploads

-- ============================================================================
-- WALLPAPERS TABLE
-- ============================================================================
create table if not exists public.wallpapers (
  id            text primary key,
  author_id     uuid references auth.users(id) on delete set null,
  author_name   text,
  title         text not null,
  description   text,
  type          text not null default 'static', -- static | animated | gradient | live
  file_url      text,        -- Supabase Storage URL (for static/animated)
  thumbnail_url text,        -- Smaller preview image
  gradient_css  text,        -- CSS gradient string (for gradient type)
  tags          text[] default '{}',
  downloads     integer default 0,
  rating        numeric(2,1) default 0,
  rating_count  integer default 0,
  is_public     boolean default true,
  is_approved   boolean default true,  -- auto-approve for now; can add moderation later
  is_builtin    boolean default false, -- true for preset wallpapers shipped with the app
  created_at    timestamptz default now()
);

-- Index for browsing public wallpapers
create index if not exists wallpapers_public_idx
  on public.wallpapers(is_public, is_approved, created_at desc);

-- Enable RLS
alter table public.wallpapers enable row level security;

-- Anyone can view public, approved wallpapers
drop policy if exists "Anyone can view public wallpapers" on public.wallpapers;
create policy "Anyone can view public wallpapers" on public.wallpapers
  for select using (is_public = true and is_approved = true);

-- Authenticated users can view all wallpapers (including their own unapproved)
drop policy if exists "Users can view all wallpapers" on public.wallpapers;
create policy "Users can view all wallpapers" on public.wallpapers
  for select using (auth.uid() = author_id or (is_public = true and is_approved = true));

-- Authenticated users can insert wallpapers
drop policy if exists "Users can insert wallpapers" on public.wallpapers;
create policy "Users can insert wallpapers" on public.wallpapers
  for insert with check (auth.uid() = author_id);

-- Users can only update/delete their own wallpapers
drop policy if exists "Users can update own wallpapers" on public.wallpapers;
create policy "Users can update own wallpapers" on public.wallpapers
  for update using (auth.uid() = author_id);

drop policy if exists "Users can delete own wallpapers" on public.wallpapers;
create policy "Users can delete own wallpapers" on public.wallpapers
  for delete using (auth.uid() = author_id);

-- ============================================================================
-- STORAGE BUCKET FOR WALLPAPER FILES
-- ============================================================================
-- Create the storage bucket (public read, authenticated write)
insert into storage.buckets (id, name, public)
values ('wallpapers', 'wallpapers', true)
on conflict (id) do nothing;

-- Storage policies: anyone can read, only authenticated users can write
drop policy if exists "Public can read wallpapers bucket" on storage.objects;
create policy "Public can read wallpapers bucket" on storage.objects
  for select using (bucket_id = 'wallpapers');

drop policy if exists "Authenticated can upload to wallpapers" on storage.objects;
create policy "Authenticated can upload to wallpapers" on storage.objects
  for insert with check (bucket_id = 'wallpapers' and auth.role() = 'authenticated');

drop policy if exists "Users can update own wallpaper files" on storage.objects;
create policy "Users can update own wallpaper files" on storage.objects
  for update using (bucket_id = 'wallpapers' and auth.uid() = owner);

drop policy if exists "Users can delete own wallpaper files" on storage.objects;
create policy "Users can delete own wallpaper files" on storage.objects
  for delete using (bucket_id = 'wallpapers' and auth.uid() = owner);

-- ============================================================================
-- DONE
-- ============================================================================
-- After running this:
--   public.wallpapers table exists with RLS
--   'wallpapers' storage bucket exists (public read, auth write)
--   Built-in wallpapers are inserted by the app on first run
