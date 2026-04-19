-- Ensure guides.game_id is a required FK to public.games(id)
-- and guides.slug is unique for stable URL routing.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'guides'
          AND column_name = 'game_id'
    ) THEN
        BEGIN
            ALTER TABLE public.guides
                ALTER COLUMN game_id TYPE uuid USING game_id::uuid;
        EXCEPTION WHEN others THEN
            -- Keep migration idempotent; type conversion may already be correct.
            NULL;
        END;
    ELSE
        ALTER TABLE public.guides
            ADD COLUMN game_id uuid;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'guides'
          AND column_name = 'game_id'
    ) THEN
        BEGIN
            ALTER TABLE public.guides
                ALTER COLUMN game_id SET NOT NULL;
        EXCEPTION WHEN others THEN
            NULL;
        END;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'guides_game_id_fkey'
    ) THEN
        ALTER TABLE public.guides
            ADD CONSTRAINT guides_game_id_fkey
            FOREIGN KEY (game_id)
            REFERENCES public.games(id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS guides_slug_unique_idx
    ON public.guides (slug);
