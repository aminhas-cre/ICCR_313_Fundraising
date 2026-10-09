-- ICCR ticket numbers, private status links, payments ledger, request log.
create sequence if not exists public.ticket_no_seq;

alter table public.donors
  add column if not exists ticket_no int unique default nextval('public.ticket_no_seq'),
  add column if not exists access_token text unique default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  add column if not exists source text not null default 'admin' check (source in ('web', 'admin'));

alter table public.donors alter column ticket_no set not null;
alter table public.donors alter column access_token set not null;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  donor_id uuid not null references public.donors(id) on delete cascade,
  amount int not null check (amount between 1 and 1000000),
  method text not null check (method in ('zelle', 'cash', 'check', 'card', 'other')),
  received_on date not null default current_date,
  memo text,
  reference text unique,
  voided_at timestamptz
);
create index if not exists payments_donor_idx on public.payments (donor_id);
alter table public.payments enable row level security;

create table if not exists public.request_log (
  id bigserial primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index if not exists request_log_key_idx on public.request_log (key, created_at);
alter table public.request_log enable row level security;

-- Carry over donors previously marked paid (before payments existed).
insert into public.payments (donor_id, amount, method, received_on, memo)
select d.id,
       d.ticket_count * coalesce((select ticket_price from public.campaign_settings where id = 1), 250),
       'other', coalesce(d.paid_at::date, current_date), 'Migrated from paid status'
from public.donors d
where d.status = 'paid'
  and not exists (select 1 from public.payments p where p.donor_id = d.id);
