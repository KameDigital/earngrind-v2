
-- Seed 6 games confirmed by GAME_TITLE_MAP audit: patterns already exist,
-- game rows were simply missing from the games table.
-- Conservative: name, slug, category, devices only. No speculative data.
INSERT INTO games (name, slug, category, devices) VALUES
  ('Royal Match',     'royal-match',    'mobile_game', ARRAY['ios','android']::device_type[]),
  ('Clash of Clans',  'clash-of-clans', 'mobile_game', ARRAY['ios','android']::device_type[]),
  ('Clash Royale',    'clash-royale',   'mobile_game', ARRAY['ios','android']::device_type[]),
  ('Gardenscapes',    'gardenscapes',   'mobile_game', ARRAY['ios','android']::device_type[]),
  ('Lords Mobile',    'lords-mobile',   'mobile_game', ARRAY['ios','android']::device_type[]),
  ('Evony',           'evony',          'mobile_game', ARRAY['ios','android']::device_type[])
ON CONFLICT (slug) DO NOTHING;
;
