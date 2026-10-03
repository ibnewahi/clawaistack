-- Migration 013G: add the caller-authorized trusted workspace Claw state boundary.
--
-- A state change and its audit event are transactional. The browser supplies
-- only a workspace selector, canonical Claw key selector, and desired boolean.

CREATE OR REPLACE FUNCTION public.set_workspace_claw_state(
  p_workspace_id uuid,
  p_claw_key text,
  p_active boolean
)
RETURNS TABLE (
  workspace_id uuid,
  claw_key text,
  status text,
  changed boolean,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_actor_user_id uuid := auth.uid();
  v_normalized_claw_key text := NULLIF(pg_catalog.btrim(p_claw_key), '');
  v_desired_status text;
  v_organization_id uuid;
  v_organization_membership_id uuid;
  v_workspace_access_mode text;
  v_registry_row_count integer;
  v_registry public.claw_registry%ROWTYPE;
  v_canonical_claw_key text;
  v_registry_enabled boolean;
  v_previous_status text;
  v_persisted_workspace_id uuid;
  v_persisted_claw_key text;
  v_persisted_status text;
  v_persisted_updated_at timestamptz;
  v_state_set_attempt integer := 0;
  v_assignment_inserted boolean := false;
BEGIN
  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '28000',
      MESSAGE = 'AUTH_REQUIRED';
  END IF;

  IF p_workspace_id IS NULL
    OR p_active IS NULL
    OR v_normalized_claw_key IS NULL
    OR pg_catalog.char_length(v_normalized_claw_key) > 128 THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'INVALID_INPUT';
  END IF;

  v_desired_status := CASE
    WHEN p_active THEN 'Active'
    ELSE 'Paused'
  END;

  IF NOT public.has_workspace_permission(
    p_workspace_id,
    'workspace.manage'
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'FORBIDDEN';
  END IF;

  SELECT workspaces.organization_id
  INTO v_organization_id
  FROM public.workspaces AS workspaces
  WHERE workspaces.id = p_workspace_id
  FOR KEY SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0002',
      MESSAGE = 'NOT_FOUND';
  END IF;

  SELECT
    memberships.id,
    memberships.workspace_access_mode
  INTO
    v_organization_membership_id,
    v_workspace_access_mode
  FROM public.organization_memberships AS memberships
  WHERE memberships.organization_id = v_organization_id
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

  IF v_workspace_access_mode = 'restricted' THEN
    PERFORM 1
    FROM public.workspace_memberships AS memberships
    WHERE memberships.workspace_id = p_workspace_id
      AND memberships.organization_membership_id = v_organization_membership_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING
        ERRCODE = '42501',
        MESSAGE = 'FORBIDDEN';
    END IF;
  END IF;

  IF NOT public.has_workspace_permission(
    p_workspace_id,
    'workspace.manage'
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'FORBIDDEN';
  END IF;

  v_registry_row_count := 0;
  FOR v_registry IN
    SELECT registry.*
    FROM public.claw_registry AS registry
    WHERE registry.claw_key = v_normalized_claw_key
    FOR KEY SHARE
  LOOP
    v_registry_row_count := v_registry_row_count + 1;

    IF v_registry_row_count > 1 THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'INTERNAL_ERROR';
    END IF;

    v_canonical_claw_key := v_registry.claw_key;
    v_registry_enabled := v_registry.is_enabled;
  END LOOP;

  IF v_registry_row_count = 0 THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0002',
      MESSAGE = 'NOT_FOUND';
  END IF;

  IF v_registry_enabled IS DISTINCT FROM true THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0002',
      MESSAGE = 'NOT_FOUND';
  END IF;

  LOOP
    v_state_set_attempt := v_state_set_attempt + 1;

    INSERT INTO public.workspace_claws AS assignments (
      workspace_id,
      claw_id,
      status,
      updated_at
    )
    VALUES (
      p_workspace_id,
      v_canonical_claw_key,
      v_desired_status,
      pg_catalog.clock_timestamp()
    )
    ON CONFLICT DO NOTHING
    RETURNING
      assignments.workspace_id,
      assignments.claw_id,
      assignments.status,
      assignments.updated_at
    INTO
      v_persisted_workspace_id,
      v_persisted_claw_key,
      v_persisted_status,
      v_persisted_updated_at;

    IF FOUND THEN
      v_previous_status := NULL;
      v_assignment_inserted := true;
      EXIT;
    END IF;

    SELECT
      assignments.status,
      assignments.updated_at
    INTO
      v_previous_status,
      v_persisted_updated_at
    FROM public.workspace_claws AS assignments
    WHERE assignments.workspace_id = p_workspace_id
      AND assignments.claw_id = v_canonical_claw_key
    FOR UPDATE;

    IF NOT FOUND THEN
      IF v_state_set_attempt >= 2 THEN
        RAISE EXCEPTION USING
          ERRCODE = 'P0001',
          MESSAGE = 'INTERNAL_ERROR';
      END IF;

      CONTINUE;
    END IF;

    IF v_previous_status IS NOT DISTINCT FROM v_desired_status THEN
      workspace_id := p_workspace_id;
      claw_key := v_canonical_claw_key;
      status := v_previous_status;
      changed := false;
      updated_at := v_persisted_updated_at;
      RETURN NEXT;
      RETURN;
    END IF;

    UPDATE public.workspace_claws AS assignments
    SET
      status = v_desired_status,
      updated_at = pg_catalog.clock_timestamp()
    WHERE assignments.workspace_id = p_workspace_id
      AND assignments.claw_id = v_canonical_claw_key
    RETURNING
      assignments.workspace_id,
      assignments.claw_id,
      assignments.status,
      assignments.updated_at
    INTO
      v_persisted_workspace_id,
      v_persisted_claw_key,
      v_persisted_status,
      v_persisted_updated_at;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING
        ERRCODE = 'P0001',
        MESSAGE = 'INTERNAL_ERROR';
    END IF;

    EXIT;
  END LOOP;

  INSERT INTO public.audit_events (
    organization_id,
    workspace_id,
    event_type,
    actor_type,
    actor_user_id,
    subject_type,
    subject_id,
    approval_request_id,
    ai_execution_id,
    ai_proposal_id,
    previous_state,
    new_state,
    metadata,
    previous_event_hash,
    event_hash
  )
  VALUES (
    v_organization_id,
    p_workspace_id,
    'workspace_claw.state_changed',
    'HUMAN',
    v_actor_user_id,
    'workspace',
    p_workspace_id,
    NULL,
    NULL,
    NULL,
    CASE
      WHEN v_assignment_inserted THEN NULL
      ELSE jsonb_build_object(
        'claw_key', v_canonical_claw_key,
        'status', v_previous_status
      )
    END,
    jsonb_build_object(
      'claw_key', v_canonical_claw_key,
      'status', v_desired_status
    ),
    '{}'::jsonb,
    NULL,
    NULL
  );

  workspace_id := v_persisted_workspace_id;
  claw_key := v_persisted_claw_key;
  status := v_persisted_status;
  changed := true;
  updated_at := v_persisted_updated_at;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.set_workspace_claw_state(uuid, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_workspace_claw_state(uuid, text, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.set_workspace_claw_state(uuid, text, boolean) FROM service_role;
GRANT EXECUTE ON FUNCTION public.set_workspace_claw_state(uuid, text, boolean) TO authenticated;
