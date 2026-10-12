-- What the donor said they plan to pay with on the pledge form (intent). pay_method stays "what actually arrived".
alter table tickets add column if not exists chosen_methods text[] not null default '{}';
