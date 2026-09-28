-- Migration 013E-3: trusted human approval mutation RPCs.
--
-- Approval is intentionally distinct from execution. These functions create,
-- configure, submit, cancel, and decide approval requests only.

CREATE OR REPLACE FUNCTION public.create_human_approval_draft(
  p_workspace_id uuid,
  p_action_type text,
  p_target_type text,
  p_target_id uuid,
  p_proposed_payload jsonb,
  p_idempotency_key uuid
)
RETURNS TABLE (
  approval_request_id uuid,
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
  v_action_type text;
  v_target_type text;
  v_request public.approval_requests%ROWTYPE;
  v_inserted_request_id uuid;
BEGIN
  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '28000', MESSAGE = 'AUTH_REQUIRED';
  END IF;

  IF p_workspace_id IS NULL OR p_proposed_payload IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_INPUT';
  END IF;

  v_action_type := pg_catalog.lower(pg_catalog.btrim(p_action_type));
  v_target_type := CASE
    WHEN p_target_type IS NULL THEN NULL
    ELSE pg_catalog.lower(pg_catalog.btrim(p_target_type))
  END;

  IF v_action_type IS NULL
    OR v_action_type = ''
    OR pg_catalog.char_length(v_action_type) > 128
    OR v_action_type !~ '^[a-z][a-z0-9_.:-]*$'
    OR (v_target_type IS NOT NULL AND (
      v_target_type = ''
      OR pg_catalog.char_length(v_target_type) > 128
      OR v_target_type !~ '^[a-z][a-z0-9_.:-]*$'
    ))
    OR (p_target_id IS NOT NULL AND v_target_type IS NULL)
    OR pg_catalog.jsonb_typeof(p_proposed_payload) <> 'object'
    OR pg_catalog.octet_length(p_proposed_payload::text) > 65536 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_INPUT';
  END IF;

  IF NOT public.has_workspace_permission(p_workspace_id, 'approval.request') THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'FORBIDDEN';
  END IF;

  SELECT workspaces.organization_id
  INTO v_organization_id
  FROM public.workspaces AS workspaces
  WHERE workspaces.id = p_workspace_id
  FOR KEY SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'NOT_FOUND';
  END IF;

  INSERT INTO public.approval_requests (
    organization_id,
    workspace_id,
    requested_by_user_id,
    origin_type,
    action_type,
    target_type,
    target_id,
    proposed_payload,
    status,
    requires_independent_approval,
    idempotency_key
  )
  VALUES (
    v_organization_id,
    p_workspace_id,
    v_actor_user_id,
    'HUMAN',
    v_action_type,
    v_target_type,
    p_target_id,
    p_proposed_payload,
    'DRAFT',
    true,
    p_idempotency_key
  )
  ON CONFLICT (organization_id, requested_by_user_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_inserted_request_id;

  IF v_inserted_request_id IS NULL AND p_idempotency_key IS NOT NULL THEN
    SELECT requests.*
    INTO v_request
    FROM public.approval_requests AS requests
    WHERE requests.organization_id = v_organization_id
      AND requests.requested_by_user_id = v_actor_user_id
      AND requests.idempotency_key = p_idempotency_key
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INTERNAL_ERROR';
    END IF;

    IF v_request.workspace_id IS DISTINCT FROM p_workspace_id
      OR v_request.action_type IS DISTINCT FROM v_action_type
      OR v_request.target_type IS DISTINCT FROM v_target_type
      OR v_request.target_id IS DISTINCT FROM p_target_id
      OR v_request.proposed_payload IS DISTINCT FROM p_proposed_payload
      OR v_request.origin_type IS DISTINCT FROM 'HUMAN'
      OR v_request.requires_independent_approval IS DISTINCT FROM true THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'IDEMPOTENCY_CONFLICT';
    END IF;

    approval_request_id := v_request.id;
    status := v_request.status;
    idempotent_replay := true;
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_inserted_request_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INTERNAL_ERROR';
  END IF;

  INSERT INTO public.audit_events (
    organization_id, workspace_id, event_type, actor_type, actor_user_id,
    subject_type, subject_id, approval_request_id, previous_state, new_state,
    metadata, previous_event_hash, event_hash
  )
  VALUES (
    v_organization_id, p_workspace_id, 'approval.request_draft_created',
    'HUMAN', v_actor_user_id, 'approval_request', v_inserted_request_id,
    v_inserted_request_id, NULL,
    jsonb_build_object('status', 'DRAFT'),
    jsonb_build_object(
      'action_type', v_action_type,
      'origin_type', 'HUMAN',
      'requires_independent_approval', true,
      'idempotency_key_present', p_idempotency_key IS NOT NULL
    ),
    NULL, NULL
  );

  approval_request_id := v_inserted_request_id;
  status := 'DRAFT';
  idempotent_replay := false;
  RETURN NEXT;
END;
$$;

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
    WHERE permissions.permission_key = v_required_permission_key
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

CREATE OR REPLACE FUNCTION public.submit_human_approval_request(
  p_workspace_id uuid,
  p_approval_request_id uuid
)
RETURNS TABLE (
  approval_request_id uuid,
  request_status text,
  active_approval_step_id uuid,
  idempotent_replay boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_actor_user_id uuid := auth.uid();
  v_organization_id uuid;
  v_request public.approval_requests%ROWTYPE;
  v_step_count integer;
  v_active_count integer;
  v_rejected_count integer;
  v_rejected_step_order integer;
  v_active_step public.approval_steps%ROWTYPE;
  v_invalid_pattern boolean;
BEGIN
  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '28000', MESSAGE = 'AUTH_REQUIRED';
  END IF;
  IF p_workspace_id IS NULL OR p_approval_request_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_INPUT';
  END IF;
  IF NOT public.has_workspace_permission(p_workspace_id, 'approval.request') THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'FORBIDDEN';
  END IF;
  SELECT workspaces.organization_id INTO v_organization_id
  FROM public.workspaces AS workspaces
  WHERE workspaces.id = p_workspace_id FOR KEY SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'NOT_FOUND';
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

  PERFORM 1 FROM public.approval_steps AS steps
  WHERE steps.approval_request_id = v_request.id
  ORDER BY steps.step_order, steps.id
  FOR UPDATE;
  SELECT pg_catalog.count(*) INTO v_step_count
  FROM public.approval_steps AS steps
  WHERE steps.approval_request_id = v_request.id;

  IF v_request.status = 'DRAFT' THEN
    IF v_step_count = 0 THEN
      RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'INVALID_STATE';
    END IF;
    UPDATE public.approval_requests AS requests
    SET status = 'SUBMITTED'
    WHERE requests.id = v_request.id;
    UPDATE public.approval_requests AS requests
    SET status = 'PENDING_APPROVAL'
    WHERE requests.id = v_request.id;
    SELECT steps.* INTO v_active_step
    FROM public.approval_steps AS steps
    WHERE steps.approval_request_id = v_request.id
      AND steps.status = 'PENDING'
    ORDER BY steps.step_order, steps.id
    LIMIT 1
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INTERNAL_ERROR';
    END IF;
    UPDATE public.approval_steps AS steps
    SET status = 'ACTIVE'
    WHERE steps.id = v_active_step.id;
    INSERT INTO public.audit_events (
      organization_id, workspace_id, event_type, actor_type, actor_user_id,
      subject_type, subject_id, approval_request_id, previous_state, new_state,
      metadata, previous_event_hash, event_hash
    ) VALUES (
      v_organization_id, p_workspace_id, 'approval.request_submitted',
      'HUMAN', v_actor_user_id, 'approval_request', v_request.id, v_request.id,
      jsonb_build_object('status', 'DRAFT'),
      jsonb_build_object('status', 'PENDING_APPROVAL'),
      jsonb_build_object('first_active_step_order', v_active_step.step_order),
      NULL, NULL
    );
    approval_request_id := v_request.id;
    request_status := 'PENDING_APPROVAL';
    active_approval_step_id := v_active_step.id;
    idempotent_replay := false;
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_request.status NOT IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED')
    OR v_request.submitted_at IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'INVALID_STATE';
  END IF;
  IF v_step_count = 0 THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'INVALID_STATE';
  END IF;

  IF v_request.status = 'PENDING_APPROVAL' THEN
    SELECT pg_catalog.count(*) INTO v_active_count
    FROM public.approval_steps AS steps
    WHERE steps.approval_request_id = v_request.id AND steps.status = 'ACTIVE';
    SELECT steps.* INTO v_active_step
    FROM public.approval_steps AS steps
    WHERE steps.approval_request_id = v_request.id AND steps.status = 'ACTIVE'
    ORDER BY steps.step_order, steps.id LIMIT 1;
    SELECT EXISTS (
      SELECT 1 FROM public.approval_steps AS steps
      WHERE steps.approval_request_id = v_request.id
        AND (
          steps.status NOT IN ('PENDING', 'ACTIVE', 'APPROVED')
          OR (steps.step_order < v_active_step.step_order AND steps.status <> 'APPROVED')
          OR (steps.step_order > v_active_step.step_order AND steps.status <> 'PENDING')
        )
    ) INTO v_invalid_pattern;
    IF v_active_count <> 1 OR v_invalid_pattern THEN
      RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'INVALID_STATE';
    END IF;
    active_approval_step_id := v_active_step.id;
  ELSIF v_request.status = 'APPROVED' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.approval_steps AS steps
      WHERE steps.approval_request_id = v_request.id AND steps.status <> 'APPROVED'
    ) INTO v_invalid_pattern;
    IF v_invalid_pattern THEN
      RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'INVALID_STATE';
    END IF;
    active_approval_step_id := NULL;
  ELSE
    SELECT pg_catalog.count(*), pg_catalog.min(rejected.step_order)
    INTO v_rejected_count, v_rejected_step_order
    FROM public.approval_steps AS rejected
    WHERE rejected.approval_request_id = v_request.id
      AND rejected.status = 'REJECTED';
    SELECT EXISTS (
      SELECT 1 FROM public.approval_steps AS steps
      WHERE steps.approval_request_id = v_request.id
        AND (
          steps.status NOT IN ('PENDING', 'APPROVED', 'REJECTED')
          OR (steps.step_order < v_rejected_step_order AND steps.status <> 'APPROVED')
          OR (steps.step_order > v_rejected_step_order AND steps.status <> 'PENDING')
        )
    ) INTO v_invalid_pattern;
    IF v_rejected_count <> 1 OR v_invalid_pattern THEN
      RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'INVALID_STATE';
    END IF;
    active_approval_step_id := NULL;
  END IF;

  approval_request_id := v_request.id;
  request_status := v_request.status;
  idempotent_replay := true;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_human_approval_draft(
  p_workspace_id uuid,
  p_approval_request_id uuid
)
RETURNS TABLE (
  approval_request_id uuid,
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
  v_request public.approval_requests%ROWTYPE;
BEGIN
  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '28000', MESSAGE = 'AUTH_REQUIRED';
  END IF;
  IF p_workspace_id IS NULL OR p_approval_request_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_INPUT';
  END IF;
  IF NOT public.has_workspace_permission(p_workspace_id, 'approval.request') THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'FORBIDDEN';
  END IF;
  SELECT workspaces.organization_id INTO v_organization_id
  FROM public.workspaces AS workspaces
  WHERE workspaces.id = p_workspace_id FOR KEY SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'NOT_FOUND';
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
  IF v_request.status = 'CANCELLED' THEN
    approval_request_id := v_request.id;
    status := 'CANCELLED';
    idempotent_replay := true;
    RETURN NEXT;
    RETURN;
  END IF;
  IF v_request.status IS DISTINCT FROM 'DRAFT' THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'INVALID_STATE';
  END IF;
  UPDATE public.approval_requests AS requests
  SET status = 'CANCELLED'
  WHERE requests.id = v_request.id;
  INSERT INTO public.audit_events (
    organization_id, workspace_id, event_type, actor_type, actor_user_id,
    subject_type, subject_id, approval_request_id, previous_state, new_state,
    metadata, previous_event_hash, event_hash
  ) VALUES (
    v_organization_id, p_workspace_id, 'approval.request_cancelled', 'HUMAN',
    v_actor_user_id, 'approval_request', v_request.id, v_request.id,
    jsonb_build_object('status', 'DRAFT'),
    jsonb_build_object('status', 'CANCELLED'), '{}'::jsonb, NULL, NULL
  );
  approval_request_id := v_request.id;
  status := 'CANCELLED';
  idempotent_replay := false;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.decide_human_approval_step(
  p_workspace_id uuid,
  p_approval_request_id uuid,
  p_approval_step_id uuid,
  p_decision text,
  p_comment text
)
RETURNS TABLE (
  approval_decision_id uuid,
  approval_step_status text,
  approval_request_status text,
  idempotent_replay boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_actor_user_id uuid := auth.uid();
  v_organization_id uuid;
  v_decision text := pg_catalog.upper(pg_catalog.btrim(p_decision));
  v_comment text := NULLIF(pg_catalog.btrim(p_comment), '');
  v_request public.approval_requests%ROWTYPE;
  v_step public.approval_steps%ROWTYPE;
  v_existing_decision public.approval_decisions%ROWTYPE;
  v_next_step public.approval_steps%ROWTYPE;
  v_approved_count integer;
  v_result_step_status text;
  v_result_request_status text;
BEGIN
  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '28000', MESSAGE = 'AUTH_REQUIRED';
  END IF;
  IF p_workspace_id IS NULL OR p_approval_request_id IS NULL OR p_approval_step_id IS NULL
    OR v_decision NOT IN ('APPROVED', 'REJECTED')
    OR (v_comment IS NOT NULL AND pg_catalog.char_length(v_comment) > 2000) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_INPUT';
  END IF;
  IF NOT public.has_workspace_permission(p_workspace_id, 'approval.approve') THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'FORBIDDEN';
  END IF;
  SELECT workspaces.organization_id INTO v_organization_id
  FROM public.workspaces AS workspaces
  WHERE workspaces.id = p_workspace_id FOR KEY SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'NOT_FOUND';
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
  PERFORM 1 FROM public.approval_steps AS steps
  WHERE steps.approval_request_id = v_request.id
  ORDER BY steps.step_order, steps.id FOR UPDATE;
  SELECT steps.* INTO v_step
  FROM public.approval_steps AS steps
  WHERE steps.id = p_approval_step_id
    AND steps.approval_request_id = v_request.id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'NOT_FOUND';
  END IF;
  IF NOT public.has_workspace_permission(p_workspace_id, v_step.required_permission_key) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'FORBIDDEN';
  END IF;
  IF v_request.requires_independent_approval
    AND v_request.requested_by_user_id IS NOT NULL
    AND v_actor_user_id = v_request.requested_by_user_id THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'INDEPENDENT_REVIEW_REQUIRED';
  END IF;
  SELECT decisions.* INTO v_existing_decision
  FROM public.approval_decisions AS decisions
  WHERE decisions.approval_step_id = v_step.id
    AND decisions.reviewer_user_id = v_actor_user_id
  FOR UPDATE;
  IF FOUND THEN
    IF v_existing_decision.decision IS DISTINCT FROM v_decision
      OR NULLIF(pg_catalog.btrim(v_existing_decision.comment), '') IS DISTINCT FROM v_comment THEN
      RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'DECISION_CONFLICT';
    END IF;
    approval_decision_id := v_existing_decision.id;
    approval_step_status := v_step.status;
    approval_request_status := v_request.status;
    idempotent_replay := true;
    RETURN NEXT;
    RETURN;
  END IF;
  IF v_request.status IS DISTINCT FROM 'PENDING_APPROVAL'
    OR v_step.status IS DISTINCT FROM 'ACTIVE' THEN
    RAISE EXCEPTION USING ERRCODE = '55000', MESSAGE = 'INVALID_STATE';
  END IF;
  INSERT INTO public.approval_decisions (
    approval_request_id, approval_step_id, reviewer_user_id, decision, comment
  ) VALUES (
    v_request.id, v_step.id, v_actor_user_id, v_decision, v_comment
  ) RETURNING id INTO approval_decision_id;

  IF v_decision = 'REJECTED' THEN
    UPDATE public.approval_steps AS steps SET status = 'REJECTED' WHERE steps.id = v_step.id;
    UPDATE public.approval_requests AS requests SET status = 'REJECTED' WHERE requests.id = v_request.id;
    v_result_step_status := 'REJECTED';
    v_result_request_status := 'REJECTED';
  ELSE
    SELECT pg_catalog.count(DISTINCT decisions.reviewer_user_id) INTO v_approved_count
    FROM public.approval_decisions AS decisions
    WHERE decisions.approval_step_id = v_step.id
      AND decisions.decision = 'APPROVED';
    IF v_approved_count < v_step.required_approvals THEN
      v_result_step_status := 'ACTIVE';
      v_result_request_status := 'PENDING_APPROVAL';
    ELSE
      UPDATE public.approval_steps AS steps SET status = 'APPROVED' WHERE steps.id = v_step.id;
      SELECT steps.* INTO v_next_step
      FROM public.approval_steps AS steps
      WHERE steps.approval_request_id = v_request.id
        AND steps.step_order > v_step.step_order
        AND steps.status = 'PENDING'
      ORDER BY steps.step_order, steps.id LIMIT 1 FOR UPDATE;
      IF FOUND THEN
        UPDATE public.approval_steps AS steps SET status = 'ACTIVE' WHERE steps.id = v_next_step.id;
        v_result_step_status := 'APPROVED';
        v_result_request_status := 'PENDING_APPROVAL';
      ELSE
        UPDATE public.approval_requests AS requests SET status = 'APPROVED' WHERE requests.id = v_request.id;
        v_result_step_status := 'APPROVED';
        v_result_request_status := 'APPROVED';
      END IF;
    END IF;
  END IF;

  INSERT INTO public.audit_events (
    organization_id, workspace_id, event_type, actor_type, actor_user_id,
    subject_type, subject_id, approval_request_id, previous_state, new_state,
    metadata, previous_event_hash, event_hash
  ) VALUES (
    v_organization_id, p_workspace_id, 'approval.decision_recorded', 'HUMAN',
    v_actor_user_id, 'approval_step', v_step.id, v_request.id,
    jsonb_build_object('step_status', 'ACTIVE', 'request_status', 'PENDING_APPROVAL'),
    jsonb_build_object('step_status', v_result_step_status, 'request_status', v_result_request_status),
    jsonb_build_object(
      'decision', v_decision,
      'step_order', v_step.step_order,
      'required_approvals', v_step.required_approvals,
      'approved_decision_count', CASE WHEN v_decision = 'APPROVED' THEN v_approved_count ELSE NULL END,
      'requires_independent_approval', v_request.requires_independent_approval
    ), NULL, NULL
  );
  IF v_result_request_status = 'APPROVED' THEN
    INSERT INTO public.audit_events (
      organization_id, workspace_id, event_type, actor_type, actor_user_id,
      subject_type, subject_id, approval_request_id, previous_state, new_state,
      metadata, previous_event_hash, event_hash
    ) VALUES (
      v_organization_id, p_workspace_id, 'approval.request_approved', 'HUMAN',
      v_actor_user_id, 'approval_request', v_request.id, v_request.id,
      jsonb_build_object('status', 'PENDING_APPROVAL'), jsonb_build_object('status', 'APPROVED'),
      jsonb_build_object('terminal_step_order', v_step.step_order), NULL, NULL
    );
  ELSIF v_result_request_status = 'REJECTED' THEN
    INSERT INTO public.audit_events (
      organization_id, workspace_id, event_type, actor_type, actor_user_id,
      subject_type, subject_id, approval_request_id, previous_state, new_state,
      metadata, previous_event_hash, event_hash
    ) VALUES (
      v_organization_id, p_workspace_id, 'approval.request_rejected', 'HUMAN',
      v_actor_user_id, 'approval_request', v_request.id, v_request.id,
      jsonb_build_object('status', 'PENDING_APPROVAL'), jsonb_build_object('status', 'REJECTED'),
      jsonb_build_object('terminal_step_order', v_step.step_order), NULL, NULL
    );
  END IF;
  approval_step_status := v_result_step_status;
  approval_request_status := v_result_request_status;
  idempotent_replay := false;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.create_human_approval_draft(uuid, text, text, uuid, jsonb, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_human_approval_draft(uuid, text, text, uuid, jsonb, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.create_human_approval_draft(uuid, text, text, uuid, jsonb, uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.create_human_approval_draft(uuid, text, text, uuid, jsonb, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.configure_human_approval_step(uuid, uuid, integer, text, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.configure_human_approval_step(uuid, uuid, integer, text, text, integer) FROM anon;
REVOKE ALL ON FUNCTION public.configure_human_approval_step(uuid, uuid, integer, text, text, integer) FROM service_role;
GRANT EXECUTE ON FUNCTION public.configure_human_approval_step(uuid, uuid, integer, text, text, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.submit_human_approval_request(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_human_approval_request(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.submit_human_approval_request(uuid, uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.submit_human_approval_request(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.cancel_human_approval_draft(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_human_approval_draft(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.cancel_human_approval_draft(uuid, uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.cancel_human_approval_draft(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.decide_human_approval_step(uuid, uuid, uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decide_human_approval_step(uuid, uuid, uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.decide_human_approval_step(uuid, uuid, uuid, text, text) FROM service_role;
GRANT EXECUTE ON FUNCTION public.decide_human_approval_step(uuid, uuid, uuid, text, text) TO authenticated;
