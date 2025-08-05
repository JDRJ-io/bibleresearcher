-- USERS → PROFILES (single source of truth)
create table public.profiles (
  id  uuid primary key references auth.users(id) on delete cascade,
  name text,
  bio  text,
  tier text default 'free' check (tier in ('free','premium','lifetime')),
  recovery_passkey_hash text,
  marketing_opt_in boolean default false,
  role text default 'user' check (role in ('user','mod','admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- NOTES
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  verse_ref text not null,
  text text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- HIGHLIGHTS
create table public.highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  verse_ref text not null,
  translation text not null,
  start_pos int not null,
  end_pos int not null,
  color_hsl text not null,
  created_at timestamptz default now()
);

-- BOOKMARKS
create table public.bookmarks (
  user_id uuid references auth.users(id) on delete cascade,
  name text,
  index_value int,
  verse_ref text,
  color text default '#f00',
  created_at timestamptz default now(),
  primary key (user_id, name)
);

-- ACCESS CODES (for gift / promo)
create table public.access_codes (
  code text primary key,
  tier text not null check (tier in ('premium','lifetime')),
  max_uses int default 1 check (max_uses > 0),
  used_count int default 0,
  expires_at timestamptz,
  created_at timestamptz default now()
);
