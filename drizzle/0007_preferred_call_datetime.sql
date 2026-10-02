ALTER TABLE public.bulk_queries
  ADD COLUMN IF NOT EXISTS preferred_call_at timestamp without time zone;
