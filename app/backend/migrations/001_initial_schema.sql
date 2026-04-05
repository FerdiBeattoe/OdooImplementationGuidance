-- Accounts table (extends Supabase auth.users)
create table if not exists public.accounts (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  company_name text not null,
  created_at timestamptz default now()
);

-- Projects table
create table if not exists public.projects (
  id text primary key,
  account_id uuid references public.accounts(id) on delete cascade,
  odoo_url text,
  odoo_database text,
  created_at timestamptz default now()
);

-- Licences table (replace flat JSON licence files)
create table if not exists public.licences (
  id uuid default gen_random_uuid() primary key,
  account_id uuid references public.accounts(id) on delete cascade,
  project_id text references public.projects(id),
  status text default 'active',
  plan text default 'paid',
  expires_at timestamptz,
  stripe_payment_intent_id text,
  created_at timestamptz default now()
);

-- Row level security
alter table public.accounts enable row level security;
alter table public.projects enable row level security;
alter table public.licences enable row level security;

-- Policies: users can only see their own data
create policy "accounts: own row" on public.accounts
  for all using (auth.uid() = id);
create policy "projects: own rows" on public.projects
  for all using (auth.uid() = account_id);
create policy "licences: own rows" on public.licences
  for all using (auth.uid() = account_id);
