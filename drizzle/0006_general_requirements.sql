ALTER TABLE public.bulk_queries
  ADD COLUMN IF NOT EXISTS query_type varchar NOT NULL DEFAULT 'catalogue',
  ADD COLUMN IF NOT EXISTS category_id integer REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantity integer,
  ADD COLUMN IF NOT EXISTS email varchar,
  ADD COLUMN IF NOT EXISTS preferred_call_time varchar,
  ADD COLUMN IF NOT EXISTS preferred_call_at timestamp without time zone;

CREATE INDEX IF NOT EXISTS bulk_queries_query_type_created_at_idx
  ON public.bulk_queries (query_type, created_at DESC);
