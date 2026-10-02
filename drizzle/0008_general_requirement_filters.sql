ALTER TABLE public.bulk_queries
  ADD COLUMN IF NOT EXISTS category_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS brand_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
