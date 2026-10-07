REVOKE
  SELECT,
  UPDATE,
  DELETE,
  TRUNCATE,
  REFERENCES,
  TRIGGER
ON TABLE public.leads
FROM anon, authenticated;

DO $$
BEGIN
  IF current_setting('server_version_num')::integer >= 170000 THEN
    EXECUTE
      'REVOKE MAINTAIN ON TABLE public.leads FROM anon, authenticated';
  END IF;
END;
$$;
