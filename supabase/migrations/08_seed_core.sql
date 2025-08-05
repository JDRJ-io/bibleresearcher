insert into community.categories (slug, name) values
  ('cross-references','Cross References'),
  ('prophecy-verses','Prophecy Verses'),
  ('bug-reports','Bug Reports'),
  ('feature-ideas','Feature Ideas'),
  ('spiritual-insights','Spiritual Insights'),
  ('prayer-requests','Prayer Requests')
on conflict (slug) do nothing;

-- dev code
insert into public.access_codes (code, tier, max_uses)
values ('DEV-ALPHA-2025','premium',9999)
on conflict (code) do nothing;
