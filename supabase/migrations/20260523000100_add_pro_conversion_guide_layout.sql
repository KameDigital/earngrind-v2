-- Allow the guide renderer/admin to save the combined pro + conversion layout.
ALTER TABLE public.guides
  DROP CONSTRAINT IF EXISTS guides_layout_style_check;

ALTER TABLE public.guides
  ADD CONSTRAINT guides_layout_style_check
  CHECK (layout_style IN ('classic','steps','pro','conversion','pro_conversion'));

COMMENT ON COLUMN public.guides.layout_style IS 'classic | steps | pro | conversion | pro_conversion - controls which page layout is rendered';
