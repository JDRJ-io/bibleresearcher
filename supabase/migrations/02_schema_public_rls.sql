-- ROW-LEVEL SECURITY
alter table public.profiles   enable row level security;
alter table public.notes      enable row level security;
alter table public.highlights enable row level security;
alter table public.bookmarks  enable row level security;
alter table public.access_codes enable row level security;

-- self-owned policies
create policy profiles_self on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy notes_rw on public.notes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy highlights_rw on public.highlights
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy bookmarks_rw on public.bookmarks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- block access_codes to clients
create policy codes_block on public.access_codes
  for all using (false);

-- helper: staff check
create or replace function public.is_staff()
returns boolean language sql stable as $$
  select role in ('admin','mod')
  from public.profiles
  where id = auth.uid()
$$;

-- auto-insert profile on new auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql as $$
begin
  insert into public.profiles(id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
