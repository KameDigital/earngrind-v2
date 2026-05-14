-- Allow the guide renderer/admin to save the conversion-focused layout.
ALTER TABLE public.guides
  DROP CONSTRAINT IF EXISTS guides_layout_style_check;

ALTER TABLE public.guides
  ADD CONSTRAINT guides_layout_style_check
  CHECK (layout_style IN ('classic','steps','pro','conversion'));

COMMENT ON COLUMN public.guides.layout_style IS 'classic | steps | pro | conversion - controls which page layout is rendered';
