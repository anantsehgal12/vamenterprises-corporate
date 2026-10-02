ALTER TABLE public.catalogue_links
  ADD COLUMN IF NOT EXISTS customer_name varchar,
  ADD COLUMN IF NOT EXISTS company_name varchar,
  ADD COLUMN IF NOT EXISTS mobile_no varchar,
  ADD COLUMN IF NOT EXISTS email varchar;
