-- Email synchronization enhancements
-- Add email tracking and notification preferences

-- Add email sync tracking to profiles
alter table public.profiles add column if not exists email_verified boolean default false;
alter table public.profiles add column if not exists email_verification_sent_at timestamp;
alter table public.profiles add column if not exists last_email_sync timestamp;

-- Add notification preferences
alter table public.profiles add column if not exists notify_highlights boolean default true;
alter table public.profiles add column if not exists notify_bookmarks boolean default true;
alter table public.profiles add column if not exists notify_forum_activity boolean default true;
alter table public.profiles add column if not exists email_frequency text default 'weekly' check (email_frequency in ('instant', 'daily', 'weekly', 'never'));

-- Create email sync log table
create table if not exists public.email_sync_log (
  id serial primary key,
  user_id uuid references public.profiles(id) not null,
  sync_type text not null check (sync_type in ('verification', 'notification', 'marketing', 'recovery')),
  email_address text not null,
  status text not null check (status in ('sent', 'delivered', 'bounced', 'failed')),
  sent_at timestamp default now(),
  delivered_at timestamp,
  error_message text,
  external_id text -- for tracking with email service providers
);

-- Create index for efficient queries
create index if not exists idx_email_sync_log_user_id on public.email_sync_log(user_id);
create index if not exists idx_email_sync_log_sent_at on public.email_sync_log(sent_at);
create index if not exists idx_email_sync_log_status on public.email_sync_log(status);

-- Enable RLS on email sync log
alter table public.email_sync_log enable row level security;

-- RLS policies for email sync log
create policy email_sync_log_user_access on public.email_sync_log
  for all using (auth.uid() = user_id);

create policy email_sync_log_admin_access on public.email_sync_log
  for all using (public.is_staff());

-- Function to update last_email_sync timestamp
create or replace function public.update_email_sync_timestamp()
returns trigger as $$
begin
  update public.profiles 
  set last_email_sync = now()
  where id = new.user_id;
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update sync timestamp
drop trigger if exists trigger_update_email_sync on public.email_sync_log;
create trigger trigger_update_email_sync
  after insert on public.email_sync_log
  for each row execute function public.update_email_sync_timestamp();

-- Add email preferences validation
alter table public.profiles add constraint check_email_frequency 
  check (email_frequency in ('instant', 'daily', 'weekly', 'never'));