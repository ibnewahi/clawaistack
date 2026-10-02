-- Migration 013E: add the caller-authorized trusted review-list boundary.

CREATE OR REPLACE FUNCTION public.list_reviewable_approval_requests(
  p_workspace_id uuid,
  p_page_size integer DEFAULT 20,
  p_cursor_submitted_at timestamptz DEFAULT NULL,
  p_cursor_request_id uuid DEFAULT NULL
)
RETURNS TABLE (
  approval_request_id uuid,
  action_type text,
  target_type text,
  target_id uuid,
  status text,
  submitted_at timestamptz,
  expires_at timestamptz,
  requires_independent_approval boolean,
  approval_step_id uuid,
  step_order integer,
  step_name text,
  required_approvals integer,
  approved_decision_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_actor_user_id uuid := auth.uid();
  v_organization_id uuid;
BEGIN
  IF v_actor_user_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '28000', MESSAGE = 'AUTH_REQUIRED';
  END IF;

  IF p_workspace_id IS NULL
    OR p_page_size IS NULL
    OR p_page_size NOT BETWEEN 1 AND 50
    OR ((p_cursor_submitted_at IS NULL) <> (p_cursor_request_id IS NULL)) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'INVALID_INPUT';
  END IF;

  IF NOT public.can_access_workspace(p_workspace_id)
    OR NOT public.has_workspace_permission(p_workspace_id, 'approval.approve') THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'FORBIDDEN';
  END IF;

  SELECT workspaces.organization_id INTO v_organization_id
  FROM public.workspaces AS workspaces
  WHERE workspaces.id = p_workspace_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'FORBIDDEN';
  END IF;

  RETURN QUERY
  SELECT
    requests.id,
    requests.action_type,
    requests.target_type,
    requests.target_id,
    requests.status,
    requests.submitted_at,
    requests.expires_at,
    requests.requires_independent_approval,
    steps.id,
    steps.step_order,
    steps.name,
    steps.required_approvals,
    approved_counts.approved_decision_count
  FROM public.approval_requests AS requests
  JOIN public.approval_steps AS steps
    ON steps.approval_request_id = requests.id
    AND steps.status = 'ACTIVE'
  JOIN public.permissions AS permissions
    ON permissions.key = steps.required_permission_key
  CROSS JOIN LATERAL (
    SELECT pg_catalog.count(*) AS active_step_count
    FROM public.approval_steps AS active_steps
    WHERE active_steps.approval_request_id = requests.id
      AND active_steps.status = 'ACTIVE'
  ) AS active_counts
  CROSS JOIN LATERAL (
    SELECT pg_catalog.count(DISTINCT decisions.reviewer_user_id)::bigint AS approved_decision_count
    FROM public.approval_decisions AS decisions
    WHERE decisions.approval_step_id = steps.id
      AND decisions.decision = 'APPROVED'
  ) AS approved_counts
  WHERE requests.organization_id = v_organization_id
    AND requests.workspace_id = p_workspace_id
    AND requests.status = 'PENDING_APPROVAL'
    AND requests.submitted_at IS NOT NULL
    AND active_counts.active_step_count = 1
    AND public.has_workspace_permission(p_workspace_id, steps.required_permission_key)
    AND (
      NOT requests.requires_independent_approval
      OR requests.requested_by_user_id IS DISTINCT FROM v_actor_user_id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.approval_decisions AS existing_decisions
      WHERE existing_decisions.approval_step_id = steps.id
        AND existing_decisions.reviewer_user_id = v_actor_user_id
    )
    AND (
      p_cursor_submitted_at IS NULL
      OR (requests.submitted_at, requests.id) < (p_cursor_submitted_at, p_cursor_request_id)
    )
  ORDER BY requests.submitted_at DESC, requests.id DESC
  LIMIT p_page_size;
END;
$$;

REVOKE ALL ON FUNCTION public.list_reviewable_approval_requests(uuid, integer, timestamptz, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_reviewable_approval_requests(uuid, integer, timestamptz, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.list_reviewable_approval_requests(uuid, integer, timestamptz, uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.list_reviewable_approval_requests(uuid, integer, timestamptz, uuid) TO authenticated;
