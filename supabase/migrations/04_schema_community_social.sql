create table community.follows (
  follower_id uuid references auth.users(id) on delete cascade,
  followee_id uuid references auth.users(id) on delete cascade,
  followed_at timestamptz default now(),
  primary key (follower_id, followee_id)
);
