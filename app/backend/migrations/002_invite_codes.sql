create table if not exists public.invite_codes (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  used boolean default false,
  used_by_email text,
  used_at timestamptz,
  plan text default 'free_forever',
  created_at timestamptz default now()
);

alter table public.invite_codes
  enable row level security;

-- Only service role can read/write invite codes
-- No user-level access needed

-- Seed the 5 beta invite codes
insert into public.invite_codes
  (code, used, plan) values
  ('BETA-PROJ-A1X9', false, 'free_forever'),
  ('BETA-PROJ-B2Y8', false, 'free_forever'),
  ('BETA-PROJ-C3Z7', false, 'free_forever'),
  ('BETA-PROJ-D4W6', false, 'free_forever'),
  ('BETA-PROJ-E5V5', false, 'free_forever')
on conflict (code) do nothing;
