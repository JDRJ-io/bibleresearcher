-- ENABLE RLS
alter table community.posts enable row level security;
alter table community.comments enable row level security;
alter table community.post_votes enable row level security;
alter table community.comment_votes enable row level security;
alter table community.follows enable row level security;
alter table community.dm_threads enable row level security;
alter table community.dm_messages enable row level security;
alter table community.group_chats enable row level security;
alter table community.group_members enable row level security;
alter table community.group_messages enable row level security;

-- 🟢 Public read
create policy posts_read    on community.posts    for select using (true);
create policy comments_read on community.comments for select using (true);

-- 🟢 Premium write
create policy posts_premium_insert on community.posts
  for insert with check ( (select tier from public.profiles where id = auth.uid()) = 'premium' );

create policy comments_premium_insert on community.comments
  for insert with check ( (select tier from public.profiles where id = auth.uid()) = 'premium' );

-- 🟢 Owners may update/delete
create policy posts_owner on community.posts
  for update using (user_id = auth.uid());

create policy comments_owner on community.comments
  for update using (user_id = auth.uid());

-- 🟢 Follow privacy
create policy follows_rw on community.follows
  for all
  using (auth.uid() = follower_id or auth.uid() = followee_id)
  with check (auth.uid() = follower_id and follower_id <> followee_id);

-- 🟢 DM privacy
create policy dm_threads_rw on community.dm_threads
  for all using (auth.uid() in (user_a, user_b));

create policy dm_messages_rw on community.dm_messages
  for all
  using (
    auth.uid() in (
      select user_a from community.dm_threads t where t.id = thread_id
      union all
      select user_b from community.dm_threads t where t.id = thread_id
    )
  )
  with check (auth.uid() = sender_id);

-- 🟢 Group chat privacy (members only)
create policy group_chat_member on community.group_chats
  for select using (
    exists (
      select 1 from community.group_members gm
      where gm.group_id = id and gm.user_id = auth.uid()
    )
  );

create policy group_member_rw on community.group_members
  for all
  using (
    exists (
      select 1 from community.group_members gm
      where gm.group_id = group_id and gm.user_id = auth.uid()
    )
  );

create policy group_msg_rw on community.group_messages
  for all
  using (
    exists (
      select 1 from community.group_members gm
      where gm.group_id = group_id and gm.user_id = auth.uid()
    )
  )
  with check (auth.uid() = sender_id);

-- 🟢 Staff override
-- example for posts; repeat for others as needed
create policy posts_staff on community.posts
  for all using (public.is_staff());
