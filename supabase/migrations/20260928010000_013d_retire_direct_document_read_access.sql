-- Migration 013D: retire direct authenticated document metadata reads.
--
-- The production Documents UI now reads document metadata and authorizes
-- downloads exclusively through the trusted document-admin server boundary.
--
-- Production verification completed before this cutover:
--   - tenant-scoped document listing
--   - workspace switching/isolation
--   - UPLOADED-only download authorization
--   - private Storage signed-read flow
--   - short-lived signed URL behavior
--   - document.download_authorized auditing
--   - production Documents UI listing/download
--
-- service_role access is intentionally preserved for the trusted
-- document-admin boundary.

DROP POLICY IF EXISTS documents_authenticated_select
ON public.documents;

REVOKE SELECT
ON TABLE public.documents
FROM authenticated;
