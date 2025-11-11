-- Navigation History Cleanup RPC
-- Fast server-side cleanup: keep newest N per user, delete the rest.
-- This is more efficient and secure than client-side cleanup with string interpolation.

create or replace function public.cleanup_nav_history(p_keep int default 15)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  -- If called without a logged-in user, do nothing
  if v_uid is null then
    return;
  end if;

  with keep as (
    select id
    from public.navigation_history
    where user_id = v_uid
    order by visited_at desc
    limit p_keep
  )
  delete from public.navigation_history h
  where h.user_id = v_uid
    and not exists (select 1 from keep k where k.id = h.id);
end;
$$;

-- Allow authenticated users to call it (RLS still guards rows)
grant execute on function public.cleanup_nav_history(int) to authenticated;

-- Optional: Combined restore state RPC (pointer + recent history in one call)
create or replace function public.bke_restore_state(p_limit int default 50)
returns table(
  verse_reference text,
  translation text,
  updated_at timestamptz,
  recent jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_recent jsonb;
begin
  if v_uid is null then
    return;
  end if;

  -- Get recent history as JSON array
  select jsonb_agg(
    jsonb_build_object(
      'v', h.verse_reference,
      'tr', h.translation,
      't', h.visited_at
    )
    order by h.visited_at desc
  )
  into v_recent
  from (
    select verse_reference, translation, visited_at
    from public.navigation_history
    where user_id = v_uid
    order by visited_at desc
    limit p_limit
  ) h;

  -- Return pointer + recent history
  return query
  select 
    l.verse_reference,
    l.translation,
    l.updated_at,
    coalesce(v_recent, '[]'::jsonb) as recent
  from public.user_last_location l
  where l.user_id = v_uid
  limit 1;
end;
$$;

grant execute on function public.bke_restore_state(int) to authenticated;
