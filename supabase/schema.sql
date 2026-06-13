create table if not exists public.meals (
  id text primary key,
  meal_date date not null,
  meal_type text not null check (meal_type in ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
  meal_name text not null default '',
  description text not null,
  calories integer not null default 0 check (calories >= 0),
  protein integer not null default 0 check (protein >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meals
add column if not exists meal_name text not null default '';

update public.meals
set meal_name = description
where meal_name = '';

create table if not exists public.app_settings (
  id text primary key default 'default',
  calories_target integer not null default 1900 check (calories_target >= 0),
  protein_target integer not null default 120 check (protein_target >= 0),
  body_weight integer not null default 175 check (body_weight >= 0),
  goal text not null default 'Lose fat',
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id, calories_target, protein_target, body_weight, goal)
values ('default', 1900, 120, 175, 'Lose fat')
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_meals_updated_at on public.meals;
create trigger set_meals_updated_at
before update on public.meals
for each row execute function public.set_updated_at();

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

-- Personal/no-auth mode:
-- For this app's current no-auth requirement, leave RLS disabled while using
-- only a publishable/anon browser key. Add authentication and RLS policies
-- before exposing this app as a multi-user product.
