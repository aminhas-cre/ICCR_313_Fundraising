-- Who actually paid (from Stripe) + the Stripe payment id, and a one-table view of every pledge.
alter table public.tickets add column if not exists paid_by_name text;
alter table public.tickets add column if not exists paid_by_email text;
alter table public.tickets add column if not exists stripe_payment_id text;
update public.tickets set stripe_payment_id = substring(bank_memo from '^stripe (pi_[A-Za-z0-9]+)$')
  where stripe_payment_id is null and bank_memo ~ '^stripe pi_[A-Za-z0-9]+$';

create or replace view public.pledge_overview with (security_invoker = true) as
select
  'ICCR-' || t.ticket_no as iccr_number,
  t.ticket_no,
  d.full_name as pledger_name,
  d.email as pledger_email,
  d.phone as pledger_phone,
  case when t.paid then 'Paid' else 'Pledged' end as status,
  array_to_string(t.chosen_methods, ' + ') as planned_to_pay_by,
  t.pay_method as paid_by_method,
  t.paid_amount as amount_paid,
  t.paid_at,
  t.received_on,
  t.paid_by_name,
  t.paid_by_email,
  t.stripe_payment_id,
  t.bank_memo,
  t.passed_to,
  t.created_at as pledged_at
from public.tickets t
join public.donors d on d.id = t.donor_id
order by t.ticket_no;
revoke all on public.pledge_overview from anon, authenticated;
