-- Remove product offer pricing and the catalogue-link toggle that controlled it.
ALTER TABLE IF EXISTS public.products DROP COLUMN IF EXISTS offer_price;
ALTER TABLE IF EXISTS public.catalogue_links DROP COLUMN IF EXISTS show_offer_price;
