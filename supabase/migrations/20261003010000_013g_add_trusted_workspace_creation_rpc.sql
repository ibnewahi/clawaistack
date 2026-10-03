-- Migration 013G: add the caller-authorized trusted workspace creation boundary.
--
-- Workspace creation is transactional: the workspace, required restricted
-- membership, and audit event either all succeed or all roll back.

ALTER TABLE public.workspaces
  ADD COLUMN idempotency_key uuid;

CREATE UNIQUE INDEX workspaces_creator_idempotency_key_unique
  ON public.workspaces (
    organization_id,
    owner_id,
    idempotency_key
  )
  WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_workspace(
  p_organization_id uuid,
  p_workspace_name text,
  p_idempotency_key uuid
)
RETURNS TABLE (
  workspace_id uuid,
  workspace_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_actor_user_id uuid := auth.uid();
  v_normalized_workspace_name text := NULLIF(
    pg_catalog.btrim(p_workspace_name),
    ''
  );
  v_organization_membership_id uuid;
  v_workspace_access_mode text;
  v_workspace_id uuid;
  v_created_workspace_name text;
  v_workspace_organization_id uuid;
BEGIN
  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '28000',
      MESSAGE = 'AUTH_REQUIRED';
  END IF;

  IF p_organization_id IS NULL
    OR p_idempotency_key IS NULL
    OR v_normalized_workspace_name IS NULL
    OR pg_catalog.char_length(v_normalized_workspace_name) > 120 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'INVALID_INPUT';
  END IF;

  SELECT
    memberships.id,
    memberships.workspace_access_mode
  INTO
    v_organization_membership_id,
    v_workspace_access_mode
  FROM public.organization_memberships AS memberships
  WHERE memberships.organization_id = p_organization_id
    AND memberships.user_id = v_actor_user_id
    AND memberships.status = 'active'
  ORDER BY memberships.id
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'FORBIDDEN';
  END IF;

  IF v_workspace_access_mode IS NULL
    OR v_workspace_access_mode NOT IN ('all', 'restricted') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'INTERNAL_ERROR';
  END IF;

  -- The organization ID is a request selector only. This final check runs
  -- while the actor's active membership remains locked.
  IF NOT public.has_permission(
    p_organization_id,
    'workspace.manage'
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'FORBIDDEN';
  END IF;

  INSERT INTO public.workspaces AS created (
    organization_id,
    owner_id,
    name,
    idempotency_key
  )
  VALUES (
    p_organization_id,
    v_actor_user_id,
    v_normalized_workspace_name,
    p_idempotency_key
  )
  ON CONFLICT (
    organization_id,
    owner_id,
    idempotency_key
  )
  WHERE idempotency_key IS NOT NULL
  DO NOTHING
  RETURNING
    created.id,
    created.name,
    created.organization_id
  INTO
    v_workspace_id,
    v_created_workspace_name,
    v_workspace_organization_id;

  IF v_workspace_id IS NULL THEN
    SELECT
      existing.id,
      existing.name
    INTO
      v_workspace_id,
      v_created_workspace_name
    FROM public.workspaces AS existing
    WHERE existing.organization_id = p_organization_id
      AND existing.owner_id = v_actor_user_id
      AND existing.idempotency_key = p_idempotency_key
    FOR KEY SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'INTERNAL_ERROR';
    END IF;

    IF v_created_workspace_name IS DISTINCT FROM v_normalized_workspace_name THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'IDEMPOTENCY_CONFLICT';
    END IF;

    workspace_id := v_workspace_id;
    workspace_name := v_created_workspace_name;
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_workspace_access_mode = 'restricted' THEN
    INSERT INTO public.workspace_memberships (
      workspace_id,
      organization_membership_id
    )
    VALUES (
      v_workspace_id,
      v_organization_membership_id
    );
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
    event_hash
  )
  VALUES (
    v_workspace_organization_id,
    v_workspace_id,
    'workspace.created',
    'HUMAN',
    v_actor_user_id,
    'workspace',
    v_workspace_id,
    NULL,
    jsonb_build_object('created', true),
    jsonb_build_object(
      'workspace_access_mode',
      v_workspace_access_mode
    ),
    NULL,
    NULL
  );

  workspace_id := v_workspace_id;
  workspace_name := v_created_workspace_name;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.create_workspace(uuid, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_workspace(uuid, text, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.create_workspace(uuid, text, uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.create_workspace(uuid, text, uuid) TO authenticated;
