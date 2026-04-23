
INSERT INTO platforms (name, slug, platform_kind, is_active)
VALUES ('EarnLab', 'earnlab', 'gpt_site', true)
ON CONFLICT (slug) DO NOTHING;
;
