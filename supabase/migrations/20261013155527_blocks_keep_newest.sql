create or replace function public.blocks_keep_newest()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.updated_at < old.updated_at then
    return null;
  end if;
  return new;
end;
$$;

create trigger blocks_keep_newest
  before update on public.blocks
  for each row execute function public.blocks_keep_newest();