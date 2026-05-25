-- Ensure active_offers_view runs with caller permissions so underlying RLS
-- policies are enforced for anon and authenticated API roles.
alter view public.active_offers_view
set (security_invoker = true);
