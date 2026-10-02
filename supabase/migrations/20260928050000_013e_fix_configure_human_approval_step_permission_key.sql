-- Migration 013E: fix the canonical permissions-column reference in
-- configure_human_approval_step. The production permissions table uses key.

CREATE OR REPLACE FUNCTION public.configure_human_approval_step(
  p_workspace_id uuid,
  p_approval_request_id uuid,
  p_step_order integer,
  p_name text,
  p_required_permission_key text,
  p_required_approvals integer
)
RETURNS TABLE (
  approval_step_id uuid,
  status text,
  idempotent_replay boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_actor_user_id uuid := auth.uid();
  v_organization_id uuid;
  v_name text := pg_catalog.btrim(p_name);
  v_required_permission_key text := pg_catalog.lower(pg_catalog.btrim(p_required_permission_key));
  v_request public.approval_requests%ROWTYPE;
  v_step public.approval_steps%ROWTYPE;
BEGIN
  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '28000', MESSAGE = 'AUTH_REQUIRED';
  END IF;

  IF p_workspace_id IS NULL OR p_approval_request_id IS NULL
    OR p_step_order IS NULL OR p_step_order <= 0
    OR p_required_approvals IS NULL OR p_required_approvals NOT BETWEEN 1 AND 25
    OR v_name IS NULL OR v_name = '' OR pg_catalog.char_length(v_name) > 160
    OR v_required_permission_key IS NULL OR v_required_permission_key = ''
    OR pg_catalog.char_length(v_required_permission_key) > 128
    OR v_required_permission_key !~ '^[a-z][a-z0-9_.:-]*$' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_INPUT';
  END IF;

  IF NOT public.has_workspace_permission(p_workspace_id, 'approval.request') THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'FORBIDDEN';
  END IF;

  SELECT workspaces.organization_id INTO v_organization_id
  FROM public.workspaces AS workspaces
  WHERE workspaces.id = p_workspace_id
  FOR KEY SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'NOT_FOUND';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.permissions AS permissions
    WHERE permissions.key = v_required_permission_key
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_INPUT';
  END IF;

  SELECT requests.* INTO v_request
  FROM public.approval_requests AS requests
  WHERE requests.id = p_approval_request_id
    AND requests.organization_id = v_organization_id
    AND requests.workspace_id = p_workspace_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'NOT_FOUND';
  END IF;

  IF v_request.requested_by_user_id IS DISTINCT FROM v_actor_user_id
    OR v_request.origin_type IS DISTINCT FROM 'HUMAN' THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'FORBIDDEN';
  END IF;

  SELECT steps.* INTO v_step
  FROM public.approval_steps AS steps
  WHERE steps.approval_request_id = v_request.id
    AND steps.step_order = p_step_order
  FOR UPDATE;

  IF FOUND THEN
    IF v_step.name IS DISTINCT FROM v_name
      OR v_step.required_permission_key IS DISTINCT FROM v_required_permission_key
      OR v_step.required_approvals IS DISTINCT FROM p_required_approvals THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'IDEMPOTENCY_CONFLICT';
    END IF;
    approval_step_id := v_step.id;
    status := v_step.status;
    idempotent_replay := true;
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_request.status IS DISTINCT FROM 'DRAFT' THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'INVALID_STATE';
  END IF;

  INSERT INTO public.approval_steps (
    approval_request_id, step_order, name, required_permission_key,
    required_approvals, status
  )
  VALUES (
    v_request.id, p_step_order, v_name, v_required_permission_key,
    p_required_approvals, 'PENDING'
  )
  RETURNING id INTO approval_step_id;

  INSERT INTO public.audit_events (
    organization_id, workspace_id, event_type, actor_type, actor_user_id,
    subject_type, subject_id, approval_request_id, previous_state, new_state,
    metadata, previous_event_hash, event_hash
  ) VALUES (
    v_organization_id, p_workspace_id, 'approval.step_configured', 'HUMAN',
    v_actor_user_id, 'approval_step', approval_step_id, v_request.id, NULL,
    jsonb_build_object('status', 'PENDING'),
    jsonb_build_object(
      'step_order', p_step_order,
      'required_approvals', p_required_approvals,
      'required_permission_key', v_required_permission_key
    ), NULL, NULL
  );

  status := 'PENDING';
  idempotent_replay := false;
  RETURN NEXT;
END;
$$;
