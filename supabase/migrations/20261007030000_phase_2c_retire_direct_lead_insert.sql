REVOKE INSERT
ON TABLE public.leads
FROM anon, authenticated;

DROP POLICY "Enable public insert"
ON public.leads;
