create schema if not exists community;
set search_path = community, public;

-- CATEGORIES
create table community.categories (
  id smallserial primary key,
  slug text unique not null,
  name text not null,
  description text
);

-- POSTS
create table community.posts (
  id bigserial primary key,
  category_id smallint references community.categories(id),
  user_id uuid references auth.users(id) on delete cascade,
  title text,
  content text not null,
  vote_count int default 0,
  comment_count int default 0,
  created_at timestamptz default now(),
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('english', content), 'B')
  ) stored
);
create index posts_search_idx on community.posts using gin(search);

-- COMMENTS
create table community.comments (
  id bigserial primary key,
  post_id bigint references community.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  parent_comment_id bigint references community.comments(id) on delete cascade,
  created_at timestamptz default now()
);

-- VOTES
create table community.post_votes (
  user_id uuid references auth.users(id) on delete cascade,
  post_id bigint references community.posts(id) on delete cascade,
  vote smallint default 1,
  primary key (user_id, post_id)
);

create table community.comment_votes (
  user_id uuid references auth.users(id) on delete cascade,
  comment_id bigint references community.comments(id) on delete cascade,
  vote smallint default 1,
  primary key (user_id, comment_id)
);
