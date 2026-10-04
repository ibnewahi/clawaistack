REVOKE
  INSERT,
  UPDATE,
  DELETE,
  TRUNCATE,
  REFERENCES,
  TRIGGER,
  MAINTAIN
ON TABLE public.sop_prompts
FROM anon, authenticated;
