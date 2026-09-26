-- Migration 013D: retire legacy direct document upload access.
--
-- Broad Storage read/upload policies are retired only after the signed
-- document-admin upload path was production verified.

DROP POLICY IF EXISTS "Allow file reads"
ON storage.objects;

DROP POLICY IF EXISTS "Allow file uploads"
ON storage.objects;

-- Authenticated direct document creation is retired because document metadata
-- is now created through the trusted document-admin server boundary.
DROP POLICY IF EXISTS documents_authenticated_insert
ON public.documents;

REVOKE INSERT ON TABLE public.documents FROM authenticated;

-- Tenant-scoped authenticated document metadata SELECT remains intentionally
-- available through documents_authenticated_select.
