
-- Allow admin and editor roles to INSERT into offer_history
-- (required for recording payout changes when manually editing offers)
CREATE POLICY "offer_history: editor insert"
  ON offer_history
  FOR INSERT
  WITH CHECK (get_my_role() = ANY (ARRAY['admin'::user_role, 'editor'::user_role]));
;
