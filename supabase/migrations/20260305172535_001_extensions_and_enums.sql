
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Enums
DO $$ BEGIN
  CREATE TYPE platform_kind     AS ENUM ('gpt_site', 'offerwall', 'casino', 'sportsbook', 'cashback');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE offer_status      AS ENUM ('active', 'expired', 'boosted', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE payout_type       AS ENUM ('online_cashback', 'gift_card', 'points', 'crypto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE device_type       AS ENUM ('ios', 'android', 'pc', 'web');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE content_status    AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE user_role         AS ENUM ('user', 'editor', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE completion_status AS ENUM ('started', 'pending_credit', 'completed', 'failed', 'disputed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE alert_type        AS ENUM ('payout_increase', 'new_offer', 'ath', 'boosted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
;
