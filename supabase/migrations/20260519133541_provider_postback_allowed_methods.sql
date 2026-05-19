alter table public.offer_partner_postback_configs
  add column if not exists allowed_methods text[] default array['POST']::text[];

update public.offer_partner_postback_configs
set allowed_methods = array['POST']::text[]
where allowed_methods is null
   or cardinality(allowed_methods) = 0;

alter table public.offer_partner_postback_configs
  alter column allowed_methods set default array['POST']::text[],
  alter column allowed_methods set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'offer_partner_postback_configs_allowed_methods_check'
      and conrelid = 'public.offer_partner_postback_configs'::regclass
  ) then
    alter table public.offer_partner_postback_configs
      add constraint offer_partner_postback_configs_allowed_methods_check
      check (
        cardinality(allowed_methods) > 0
        and allowed_methods <@ array['GET', 'POST']::text[]
      );
  end if;
end $$;
