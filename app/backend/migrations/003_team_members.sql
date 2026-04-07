create table if not exists public.team_members (
  id uuid default gen_random_uuid() primary key,
  account_id uuid references public.accounts(id) on delete cascade,
  project_id text not null references public.projects(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in (
    'project_lead',
    'implementor',
    'reviewer',
    'stakeholder'
  )),
  invited_by uuid references public.accounts(id),
  accepted_at timestamptz,
  created_at timestamptz default now(),
  unique (project_id, email)
);

create index if not exists idx_team_members_project
  on public.team_members(project_id);

alter table public.team_members
  enable row level security;

-- Only the backend service role should read or write team membership records
-- directly. Governed access flows through the application layer.
