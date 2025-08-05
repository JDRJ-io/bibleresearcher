-- apply staff override to the remaining community tables
create policy comments_staff on community.comments
  for all using (public.is_staff());
create policy groups_staff on community.group_chats
  for all using (public.is_staff());
-- …repeat as necessary

-- GRANT an admin role (manual call)
-- update public.profiles set role='admin' where email = 'you@example.com';
