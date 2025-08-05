-- 1.  Add the column (nullable so existing rows don’t fail)
alter table public.profiles
  add column if not exists email text;

-- 2.  Back-fill existing profiles
update public.profiles p
set    email = u.email
from   auth.users u
where  p.id = u.id;

-- 3.  Keep it in sync for every new sign-up or email change
create or replace function public.sync_profile_email()
returns trigger language plpgsql as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end $$;

drop trigger if exists trg_sync_profile_email on auth.users;
create trigger trg_sync_profile_email
  after insert or update on auth.users
  for each row execute function public.sync_profile_email();
