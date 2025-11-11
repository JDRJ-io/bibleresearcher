-- Migration: Sync navigation_history → user_last_location with trigger
-- Purpose: Ensure user_last_location table stays updated whenever navigation_history gets a new entry
-- This fixes the issue where session restore always loads gen.1:6 instead of actual last verse

-- Ensure the pointer table exists
create table if not exists public.user_last_location (
  user_id uuid primary key default auth.uid(),
  verse_reference text not null,
  translation text not null,
  updated_at timestamptz not null default now()
);

alter table public.user_last_location enable row level security;

-- RLS policies
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_last_location' and policyname = 'self_read_last_location'
  ) then
    create policy self_read_last_location
      on public.user_last_location for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'user_last_location' and policyname = 'self_upsert_last_location'
  ) then
    create policy self_upsert_last_location
      on public.user_last_location for insert with check (auth.uid() = user_id);
    create policy self_update_last_location
      on public.user_last_location for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end$$;

-- Trigger: sync navigation_history → user_last_location automatically
create or replace function public.sync_last_location()
returns trigger language plpgsql as $$
begin
  insert into public.user_last_location (user_id, verse_reference, translation, updated_at)
  values (new.user_id, new.verse_reference, new.translation, now())
  on conflict (user_id) do update
    set verse_reference = excluded.verse_reference,
        translation     = excluded.translation,
        updated_at      = now();
  return new;
end;
$$;

drop trigger if exists trg_sync_last_location on public.navigation_history;
create trigger trg_sync_last_location
after insert on public.navigation_history
for each row execute function public.sync_last_location();
