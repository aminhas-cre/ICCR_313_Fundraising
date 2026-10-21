-- LAUNCH RESET: removes all test pledges so the campaign starts clean (next pledge becomes ICCR-1).
-- Run by hand in Supabase -> SQL Editor and confirm the destructive-statement prompt.
-- Safe to run: copies of everything were saved first in launch_backup_donors, launch_backup_tickets
-- and launch_backup_ticket_events. campaign_settings (price, Zelle, Venmo, EIN, etc.) is NOT touched.
-- Order matters: events and tickets reference donors.
begin;
delete from public.ticket_events;
delete from public.tickets;
delete from public.donors;
delete from public.request_log;
commit;

-- Check (should return 0, 0, 0):
select (select count(*) from public.donors) as donors,
       (select count(*) from public.tickets) as tickets,
       (select count(*) from public.ticket_events) as events;
