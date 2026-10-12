-- LaunchGood as another way to give $250. Additive: old code ignores the column.
alter table campaign_settings add column if not exists launchgood_url text not null default 'https://www.launchgood.com/v4/campaign/iccr__keep_the_lights_on';

alter table tickets drop constraint if exists tickets_pay_method_check;
alter table tickets add constraint tickets_pay_method_check
  check (pay_method in ('zelle', 'venmo', 'launchgood', 'cash', 'check', 'card', 'other'));
