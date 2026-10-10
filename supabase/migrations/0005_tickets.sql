-- One numbered ticket per row (ICCR-1 .. ICCR-N), applied additively.
-- Legacy donor columns (ticket_no, ticket_count, status, paid_at, referred_by)
-- and the empty payments table are left in place, unused.
create table if not exists public.tickets (
  ticket_no int primary key check (ticket_no between 1 and 10000),
  donor_id uuid not null references public.donors(id) on delete cascade,
  created_at timestamptz not null default now(),
  paid boolean not null default false,
  paid_at timestamptz,
  paid_amount int,
  pay_method text check (pay_method in ('zelle', 'cash', 'check', 'card', 'other')),
  received_on date,
  bank_memo text,
  passed_on boolean not null default false,
  passed_to text
);
create index if not exists tickets_donor_idx on public.tickets (donor_id);
alter table public.tickets enable row level security;

create table if not exists public.ticket_events (
  id bigserial primary key,
  ticket_no int not null,
  action text not null check (action in ('pledged', 'paid', 'unpaid', 'note')),
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists ticket_events_ticket_idx on public.ticket_events (ticket_no);
alter table public.ticket_events enable row level security;

create unique index if not exists donors_email_unique on public.donors (lower(email)) where email is not null;

alter table public.campaign_settings
  add column if not exists admin_notify_email text not null default 'islamiccentercastlerock@gmail.com';

create or replace function public.allocate_tickets(p_donor uuid, p_count int, p_cap int)
returns int[]
language plpgsql
as $fn$
declare
  nums int[];
  free_n int;
begin
  perform pg_advisory_xact_lock(313313);
  select array_agg(n order by n) into nums from (
    select g as n from generate_series(1, p_cap) g
    where not exists (select 1 from public.tickets t where t.ticket_no = g)
    order by g
    limit p_count
  ) s;
  free_n := coalesce(array_length(nums, 1), 0);
  if free_n = 0 then
    raise exception using message = 'sold_out';
  end if;
  if free_n < p_count then
    raise exception using message = format('only_%s_left', free_n);
  end if;
  insert into public.tickets (ticket_no, donor_id) select unnest(nums), p_donor;
  insert into public.ticket_events (ticket_no, action) select unnest(nums), 'pledged';
  return nums;
end
$fn$;
revoke all on function public.allocate_tickets(uuid, int, int) from public, anon, authenticated;
grant execute on function public.allocate_tickets(uuid, int, int) to service_role;

create or replace function public.backfill_tickets()
returns int
language plpgsql
as $fn$
declare
  d record;
  total int := 0;
  got int[];
  price int := coalesce((select ticket_price from public.campaign_settings where id = 1), 250);
begin
  for d in
    select id, ticket_count, status, paid_at from public.donors
    where not exists (select 1 from public.tickets t where t.donor_id = donors.id)
    order by created_at
  loop
    got := public.allocate_tickets(d.id, d.ticket_count, 10000);
    total := total + d.ticket_count;
    if d.status = 'paid' then
      update public.tickets set paid = true, paid_at = coalesce(d.paid_at, now()),
        paid_amount = price, pay_method = 'other', received_on = current_date
      where ticket_no = any(got);
    end if;
  end loop;
  return total;
end
$fn$;
revoke all on function public.backfill_tickets() from public, anon, authenticated;
grant execute on function public.backfill_tickets() to service_role;
