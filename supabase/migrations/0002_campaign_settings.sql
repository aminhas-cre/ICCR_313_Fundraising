-- Single-row table holding what the public landing page displays.
create table if not exists public.campaign_settings (
  id int primary key default 1 check (id = 1),
  goal_donors int not null default 313 check (goal_donors between 1 and 10000),
  ticket_price int not null default 250 check (ticket_price between 1 and 100000),
  zelle_email text not null default 'islamiccentercastlerock@gmail.com',
  zelle_note text not null default 'Put your name in the memo so we can confirm your ticket.',
  -- Offline gifts (cash/check/pre-launch) added on top of donor-row totals.
  adjust_paid_amount int not null default 0 check (adjust_paid_amount between 0 and 10000000),
  adjust_pledged_amount int not null default 0 check (adjust_pledged_amount between 0 and 10000000),
  adjust_note text,
  updated_at timestamptz not null default now()
);

insert into public.campaign_settings (id) values (1) on conflict (id) do nothing;

-- Server-only access via the service role key, same as donors.
alter table public.campaign_settings enable row level security;
