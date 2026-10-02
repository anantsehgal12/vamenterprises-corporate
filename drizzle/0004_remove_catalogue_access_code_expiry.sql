-- Catalogue links are no longer protected by access codes or expiry dates.
ALTER TABLE IF EXISTS public.catalogue_links
  DROP COLUMN IF EXISTS access_code,
  DROP COLUMN IF EXISTS expires_at;
