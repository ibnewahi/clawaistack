REVOKE INSERT, UPDATE
ON TABLE public.profiles
FROM anon, authenticated;

GRANT INSERT (
  id,
  full_name,
  role,
  updated_at
)
ON TABLE public.profiles
TO authenticated;

GRANT UPDATE (
  id,
  full_name,
  role,
  updated_at
)
ON TABLE public.profiles
TO authenticated;
