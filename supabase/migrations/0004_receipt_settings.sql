-- Legal identity used only in emailed receipts (never on public pages).
alter table public.campaign_settings
  add column if not exists legal_name text not null default 'Islamic Center of Castle Rock',
  add column if not exists ein text not null default '99-2085129',
  add column if not exists receipt_statement text not null default '{legal_name} (EIN {ein}) is a 501(c)(3) tax-exempt organization. No goods or services were provided in exchange for this gift. Please keep this receipt for your records.';
