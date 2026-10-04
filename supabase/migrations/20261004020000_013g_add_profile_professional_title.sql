ALTER TABLE public.profiles
ADD COLUMN professional_title text;

UPDATE public.profiles
SET professional_title = role
WHERE professional_title IS NULL
  AND role IS NOT NULL;

GRANT INSERT (professional_title)
ON TABLE public.profiles
TO authenticated;

GRANT UPDATE (professional_title)
ON TABLE public.profiles
TO authenticated;
