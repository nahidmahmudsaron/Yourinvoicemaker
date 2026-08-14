ALTER TABLE public.invoices ALTER COLUMN is_public SET DEFAULT false;
UPDATE public.invoices SET is_public = false WHERE is_public = true;