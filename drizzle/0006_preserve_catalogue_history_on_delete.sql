-- Retain catalogue view events after the catalogue itself has been removed.
ALTER TABLE public.link_views
  ALTER COLUMN catalogue_link_id DROP NOT NULL;
