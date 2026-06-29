-- SnackPlan — Supabase schema starter.
-- Run this in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
-- It creates the tables the app will sync to, with Row Level Security so each
-- user only sees/edits their own rows (reviews are world-readable).

-- ---------------------------------------------------------------------------
-- profiles: 1:1 with auth.users. Mirrors the on-device UserProfile.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text default '',
  email text default '',
  diets text[] default '{}',
  weekly_grocery_budget numeric,
  favorite_meals text[] default '{}',
  usual_meals text[] default '{}',
  staples text[] default '{}',
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "own profile - read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile - upsert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile - update" on public.profiles for update using (auth.uid() = id);

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- recipes: user-created recipes (the curated library stays in app code).
-- ---------------------------------------------------------------------------
create table if not exists public.recipes (
  id text primary key,                  -- app-generated id (e.g. "user-...")
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  emoji text default '🍽️',
  cost numeric default 0,
  calories integer default 0,
  health text default '',
  slots text[] default '{}',
  tags text[] default '{}',
  contains text[] default '{}',
  ingredients jsonb default '[]',       -- [{ name, qty, cost }]
  steps text[] default '{}',
  created_at timestamptz default now()
);

alter table public.recipes enable row level security;
create policy "own recipes" on public.recipes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- cookbooks: collections of recipe ids.
-- ---------------------------------------------------------------------------
create table if not exists public.cookbooks (
  id text primary key,                  -- app-generated id (e.g. "cb-...")
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text,
  recipe_ids text[] default '{}',
  created_at timestamptz default now()
);

alter table public.cookbooks enable row level security;
create policy "own cookbooks" on public.cookbooks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- reviews: world-readable; each user manages their own.
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  recipe_id text not null,              -- references a library or user recipe id
  user_id uuid not null references auth.users (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text default '',
  created_at timestamptz default now(),
  unique (recipe_id, user_id)           -- one review per user per dish
);

alter table public.reviews enable row level security;
create policy "reviews - public read" on public.reviews for select using (true);
create policy "reviews - own write"   on public.reviews for insert with check (auth.uid() = user_id);
create policy "reviews - own update"  on public.reviews for update using (auth.uid() = user_id);
create policy "reviews - own delete"  on public.reviews for delete using (auth.uid() = user_id);
