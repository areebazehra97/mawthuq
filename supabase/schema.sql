create table if not exists public.mawthuq_app_state (
  id text primary key,
  state_json jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_mawthuq_app_state()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists mawthuq_app_state_touch on public.mawthuq_app_state;
create trigger mawthuq_app_state_touch
before update on public.mawthuq_app_state
for each row
execute function public.touch_mawthuq_app_state();

insert into public.mawthuq_app_state (id, state_json)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

-- Create a storage bucket named `vendor-packages` in Supabase Storage
-- before enabling cloud file persistence for Mawthūq.
