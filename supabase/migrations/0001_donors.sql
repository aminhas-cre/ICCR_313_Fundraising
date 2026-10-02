-- Run once in the Supabase SQL editor.
create table if not exists public.donors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  full_name text not null,
  phone text,
  email text,
  ticket_count int not null default 1 check (ticket_count between 1 and 100),
  status text not null default 'pledged' check (status in ('pledged', 'paid')),
  paid_at timestamptz,
  referred_by uuid references public.donors(id) on delete set null,
  show_public boolean not null default true,
  notes text
);

create index if not exists donors_status_idx on public.donors (status);
create index if not exists donors_referred_by_idx on public.donors (referred_by);

-- No client-side access. All reads/writes go through server routes using the
-- service role key, which bypasses RLS.
alter table public.donors enable row level security;
