
-- ── site_offer_tasks ──────────────────────────────────────────────────────────
-- Structured goals/tasks for a site-specific offer.
-- Each site_offer can have ordered tasks (install, milestone, purchase, etc.)

CREATE TABLE site_offer_tasks (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  site_offer_id   uuid        NOT NULL REFERENCES site_offers(id) ON DELETE CASCADE,
  sort_order      integer     NOT NULL DEFAULT 0,
  title           text        NOT NULL,
  reward_amount   numeric     NOT NULL DEFAULT 0 CHECK (reward_amount >= 0),
  reward_display  text,
  task_type       text        NOT NULL DEFAULT 'milestone'
                              CHECK (task_type IN ('install','milestone','purchase','signup','other')),
  time_limit_text text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_site_offer_tasks_offer_id ON site_offer_tasks (site_offer_id, sort_order ASC);

ALTER TABLE site_offer_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_offer_tasks: public read"
  ON site_offer_tasks FOR SELECT USING (true);

CREATE POLICY "site_offer_tasks: editor insert"
  ON site_offer_tasks FOR INSERT
  WITH CHECK (get_my_role() = ANY (ARRAY['admin'::user_role, 'editor'::user_role]));

CREATE POLICY "site_offer_tasks: editor update"
  ON site_offer_tasks FOR UPDATE
  USING (get_my_role() = ANY (ARRAY['admin'::user_role, 'editor'::user_role]));

CREATE POLICY "site_offer_tasks: editor delete"
  ON site_offer_tasks FOR DELETE
  USING (get_my_role() = ANY (ARRAY['admin'::user_role, 'editor'::user_role]));
;
