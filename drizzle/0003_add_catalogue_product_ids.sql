-- Persist the exact products selected for each shareable catalogue.
ALTER TABLE IF EXISTS public.catalogue_links
  ADD COLUMN IF NOT EXISTS product_ids jsonb NOT NULL DEFAULT '[]'::jsonb;