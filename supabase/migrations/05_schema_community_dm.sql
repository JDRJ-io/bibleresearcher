create table community.dm_threads (
  id bigserial primary key,
  user_a uuid references auth.users(id) on delete cascade,
  user_b uuid references auth.users(id) on delete cascade,
  started_at timestamptz default now()
);
create unique index dm_threads_pair_unique
  on community.dm_threads (least(user_a,user_b), greatest(user_a,user_b));

create table community.dm_messages (
  id bigserial primary key,
  thread_id bigint references community.dm_threads(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete cascade,
  body text not null,
  sent_at timestamptz default now()
);
create index dm_messages_thread_time_idx
  on community.dm_messages(thread_id, sent_at desc);
