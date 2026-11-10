ALTER TABLE public.guild_members
  ADD COLUMN IF NOT EXISTS integrated_mastery integer NOT NULL DEFAULT 0
  CHECK (integrated_mastery >= 0);
