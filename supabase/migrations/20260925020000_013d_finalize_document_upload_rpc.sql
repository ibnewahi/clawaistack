-- Migration 013D: atomically finalize a verified financial document upload.
--
-- The document-admin Edge Function verifies the authenticated user, workspace
-- permission, tenant, and Storage object before calling this service-role-only
-- RPC. This function performs only the database lifecycle transition and its
-- immutable audit event in one PostgreSQL transaction.

CREATE OR REPLACE FUNCTION public.finalize_document_upload(
  p_document_id uuid,
  p_organization_id uuid,
  p_workspace_id uuid,
  p_actor_user_id uuid,
  p_stored_size_bytes bigint,
  p_stored_mime_type text
)
RETURNS TABLE (
  document_id uuid,
  status text,
  transitioned boolean
)
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_document public.documents%ROWTYPE;
BEGIN
  IF p_document_id IS NULL
    OR p_organization_id IS NULL
    OR p_workspace_id IS NULL
    OR p_actor_user_id IS NULL
    OR p_stored_size_bytes IS NULL
    OR p_stored_mime_type IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'invalid document finalization request';
  END IF;

  IF p_stored_size_bytes <= 0
    OR pg_catalog.btrim(p_stored_mime_type) = '' THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'invalid document finalization request';
  END IF;

  -- This lock serializes concurrent finalization attempts for one document.
  SELECT *
  INTO v_document
  FROM public.documents
  WHERE id = p_document_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0002',
      MESSAGE = 'document finalization failed';
  END IF;

  -- The authorized server boundary supplies these tenant values. Requiring the
  -- exact bindings here prevents the RPC from crossing a document tenant scope.
  IF v_document.organization_id <> p_organization_id
    OR v_document.workspace_id <> p_workspace_id
    OR v_document.bucket_id <> 'financial-documents'
    OR v_document.file_size_bytes IS DISTINCT FROM p_stored_size_bytes
    OR v_document.mime_type IS DISTINCT FROM p_stored_mime_type THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'document finalization failed';
  END IF;

  IF v_document.status = 'UPLOADED' THEN
    RETURN QUERY
    SELECT v_document.id, 'UPLOADED'::text, false;
    RETURN;
  END IF;

  IF v_document.status <> 'PENDING_UPLOAD' THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'document finalization is not permitted';
  END IF;

  UPDATE public.documents
  SET status = 'UPLOADED'
  WHERE id = v_document.id
    AND status = 'PENDING_UPLOAD';

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'document finalization failed';
  END IF;

  INSERT INTO public.audit_events (
    organization_id,
    workspace_id,
    event_type,
    actor_type,
    actor_user_id,
    subject_type,
    subject_id,
    previous_state,
    new_state,
    metadata,
    previous_event_hash,
    event_hash,
    occurred_at
  )
  VALUES (
    v_document.organization_id,
    v_document.workspace_id,
    'document.uploaded',
    'HUMAN',
    p_actor_user_id,
    'document',
    v_document.id,
    pg_catalog.jsonb_build_object('status', 'PENDING_UPLOAD'),
    pg_catalog.jsonb_build_object('status', 'UPLOADED'),
    pg_catalog.jsonb_build_object(
      'bucket_id', 'financial-documents',
      'stored_size_bytes', p_stored_size_bytes,
      'mime_type', p_stored_mime_type,
      'status', 'UPLOADED'
    ),
    NULL,
    NULL,
    pg_catalog.clock_timestamp()
  );

  RETURN QUERY
  SELECT v_document.id, 'UPLOADED'::text, true;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_document_upload(uuid, uuid, uuid, uuid, bigint, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_document_upload(uuid, uuid, uuid, uuid, bigint, text) FROM anon;
REVOKE ALL ON FUNCTION public.finalize_document_upload(uuid, uuid, uuid, uuid, bigint, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_document_upload(uuid, uuid, uuid, uuid, bigint, text) TO service_role;
