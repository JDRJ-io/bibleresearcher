create table community.group_chats (
  id bigserial primary key,
  title text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create table community.group_members (
  group_id bigint references community.group_chats(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member',             -- owner / member
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);
create index group_members_by_user on community.group_members(user_id);

create table community.group_messages (
  id bigserial primary key,
  group_id bigint references community.group_chats(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete cascade,
  body text not null,
  sent_at timestamptz default now()
);
create index group_messages_time_idx
  on community.group_messages(group_id, sent_at desc);
