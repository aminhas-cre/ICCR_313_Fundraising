-- OPTIONAL cleanup of the first version of the data model. Run by hand in the Supabase SQL editor
-- (the editor asks you to confirm destructive statements). Nothing in the app reads these.
-- A copy of the old per-donor values is kept in public.legacy_donor_columns_backup (already created).
drop function if exists public.backfill_tickets();
drop table if exists public.payments;
alter table public.donors
  drop column if exists ticket_no,
  drop column if exists ticket_count,
  drop column if exists status,
  drop column if exists paid_at,
  drop column if exists referred_by;
