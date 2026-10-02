-- Remove the clients feature and its optional links from catalogues and enquiries.
ALTER TABLE IF EXISTS public.catalogue_links DROP COLUMN IF EXISTS client_id;
ALTER TABLE IF EXISTS public.bulk_queries DROP COLUMN IF EXISTS client_id;
DROP TABLE IF EXISTS public.clients;