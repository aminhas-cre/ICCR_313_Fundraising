-- Venmo as a second free way to pay (shown next to Zelle). Additive: old code ignores the column.
alter table campaign_settings add column if not exists venmo_handle text not null default 'ICCR1';

-- Allow "venmo" as a recorded payment method.
alter table tickets drop constraint if exists tickets_pay_method_check;
alter table tickets add constraint tickets_pay_method_check
  check (pay_method in ('zelle', 'venmo', 'cash', 'check', 'card', 'other'));
