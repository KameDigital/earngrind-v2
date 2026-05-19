create or replace function public.prevent_earn_user_profile_protected_self_update()
returns trigger
language plpgsql
as $$
begin
  if current_role in ('postgres', 'service_role', 'supabase_admin')
    or (select auth.role()) = 'service_role'
    or public.get_my_role() in ('admin', 'editor')
  then
    return new;
  end if;

  if new.user_id is distinct from old.user_id
    or new.reward_currency is distinct from old.reward_currency
    or new.reward_status is distinct from old.reward_status
    or new.review_status is distinct from old.review_status
    or new.review_reasons is distinct from old.review_reasons
    or new.accepted_rewards_terms_at is distinct from old.accepted_rewards_terms_at
    or new.last_reward_activity_at is distinct from old.last_reward_activity_at
    or new.created_at is distinct from old.created_at
    or new.updated_at is distinct from old.updated_at
  then
    raise exception 'protected earn user profile fields cannot be self-updated';
  end if;

  return new;
end;
$$;
