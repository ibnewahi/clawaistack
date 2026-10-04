REVOKE INSERT (role), UPDATE (role)
ON TABLE public.profiles
FROM authenticated;
