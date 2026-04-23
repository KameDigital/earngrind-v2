-- Add new columns to guides for the layout system
ALTER TABLE guides
  ADD COLUMN IF NOT EXISTS excerpt             text,
  ADD COLUMN IF NOT EXISTS layout_style        text NOT NULL DEFAULT 'classic'
                                               CHECK (layout_style IN ('classic','steps','pro')),
  ADD COLUMN IF NOT EXISTS key_takeaways       text,
  ADD COLUMN IF NOT EXISTS checklist_items     text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS show_related_offers boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_related_guides boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN guides.layout_style        IS 'classic | steps | pro — controls which page layout is rendered';
COMMENT ON COLUMN guides.key_takeaways       IS 'Free text block shown in Pro layout as a highlighted box';
COMMENT ON COLUMN guides.checklist_items     IS 'Array of checklist strings shown in Pro layout';
COMMENT ON COLUMN guides.show_related_offers IS 'Whether to show related offers in the sidebar';
COMMENT ON COLUMN guides.show_related_guides IS 'Whether to show related guides in the sidebar';;
