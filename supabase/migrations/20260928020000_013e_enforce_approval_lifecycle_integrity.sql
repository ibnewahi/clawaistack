-- Migration 013E: enforce canonical approval lifecycle integrity.
--
-- These triggers preserve tenant enforcement and establish structural lifecycle
-- invariants. User authorization and independent-reviewer checks remain in the
-- future trusted approval RPC and Edge Function boundary.

CREATE OR REPLACE FUNCTION public.enforce_approval_request_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'DRAFT' THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'approval request lifecycle must begin in DRAFT';
    END IF;

    -- Lifecycle timestamps are database-controlled and have no meaning on a draft.
    NEW.submitted_at := NULL;
    NEW.resolved_at := NULL;
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'approval request identity is immutable';
  END IF;

  -- Snapshot changes are allowed only while the request remains a draft.
  -- A transition out of DRAFT must submit or cancel the exact prior snapshot.
  IF NOT (OLD.status = 'DRAFT' AND NEW.status = 'DRAFT') AND (
    NEW.organization_id IS DISTINCT FROM OLD.organization_id
    OR NEW.workspace_id IS DISTINCT FROM OLD.workspace_id
    OR NEW.requested_by_user_id IS DISTINCT FROM OLD.requested_by_user_id
    OR NEW.origin_type IS DISTINCT FROM OLD.origin_type
    OR NEW.action_type IS DISTINCT FROM OLD.action_type
    OR NEW.target_type IS DISTINCT FROM OLD.target_type
    OR NEW.target_id IS DISTINCT FROM OLD.target_id
    OR NEW.proposed_payload IS DISTINCT FROM OLD.proposed_payload
    OR NEW.requires_independent_approval IS DISTINCT FROM OLD.requires_independent_approval
    OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'submitted approval request snapshot is immutable';
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    IF OLD.status = 'DRAFT' THEN
      NEW.submitted_at := NULL;
      NEW.resolved_at := NULL;
      RETURN NEW;
    END IF;

    IF NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
      OR NEW.resolved_at IS DISTINCT FROM OLD.resolved_at THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'approval request lifecycle timestamps are immutable';
    END IF;

    IF OLD.status IN ('SUBMITTED', 'PENDING_APPROVAL') AND OLD.resolved_at IS NOT NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'unresolved approval request cannot have a resolution timestamp';
    END IF;

    IF OLD.status IN ('APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED')
      AND OLD.resolved_at IS NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'resolved approval request must have a resolution timestamp';
    END IF;

    RETURN NEW;
  END IF;

  IF OLD.status = 'DRAFT' AND NEW.status = 'SUBMITTED' THEN
    NEW.submitted_at := pg_catalog.clock_timestamp();
    NEW.resolved_at := NULL;
    RETURN NEW;
  END IF;

  IF OLD.status = 'DRAFT' AND NEW.status = 'CANCELLED' THEN
    NEW.submitted_at := NULL;
    NEW.resolved_at := pg_catalog.clock_timestamp();
    RETURN NEW;
  END IF;

  IF OLD.status = 'SUBMITTED' AND NEW.status = 'PENDING_APPROVAL' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.approval_steps AS steps
      WHERE steps.approval_request_id = OLD.id
    ) THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'approval request requires at least one approval step';
    END IF;

    IF OLD.submitted_at IS NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'submitted approval request must have a submission timestamp';
    END IF;

    NEW.submitted_at := OLD.submitted_at;
    NEW.resolved_at := NULL;
    RETURN NEW;
  END IF;

  IF OLD.status IN ('SUBMITTED', 'PENDING_APPROVAL')
    AND NEW.status IN ('CANCELLED', 'EXPIRED') THEN
    IF OLD.submitted_at IS NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'submitted approval request must have a submission timestamp';
    END IF;

    IF NEW.status = 'EXPIRED' AND (
      NEW.expires_at IS NULL
      OR NEW.expires_at > pg_catalog.clock_timestamp()
    ) THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'approval request cannot expire before its expiry timestamp';
    END IF;

    NEW.submitted_at := OLD.submitted_at;
    NEW.resolved_at := pg_catalog.clock_timestamp();
    RETURN NEW;
  END IF;

  IF OLD.status = 'PENDING_APPROVAL'
    AND NEW.status IN ('APPROVED', 'REJECTED') THEN
    IF OLD.submitted_at IS NULL THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'submitted approval request must have a submission timestamp';
    END IF;

    NEW.submitted_at := OLD.submitted_at;
    NEW.resolved_at := pg_catalog.clock_timestamp();
    RETURN NEW;
  END IF;

  RAISE EXCEPTION USING
    ERRCODE = '23514',
    MESSAGE = 'invalid approval request lifecycle transition';
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_approval_step_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_old_parent_status text;
  v_new_parent_status text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT requests.status
    INTO v_new_parent_status
    FROM public.approval_requests AS requests
    WHERE requests.id = NEW.approval_request_id
    FOR KEY SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING
        ERRCODE = '23503',
        MESSAGE = 'approval step parent request does not exist';
    END IF;

    IF v_new_parent_status <> 'DRAFT' THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'approval steps cannot be added after submission';
    END IF;

    IF NEW.status <> 'PENDING' THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'approval step lifecycle must begin in PENDING';
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    SELECT requests.status
    INTO v_old_parent_status
    FROM public.approval_requests AS requests
    WHERE requests.id = OLD.approval_request_id
    FOR KEY SHARE;

    IF NOT FOUND THEN
      RAISE EXCEPTION USING
        ERRCODE = '23503',
        MESSAGE = 'approval step parent request does not exist';
    END IF;

    IF v_old_parent_status <> 'DRAFT' THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'approval steps cannot be deleted after submission';
    END IF;

    RETURN OLD;
  END IF;

  SELECT requests.status
  INTO v_old_parent_status
  FROM public.approval_requests AS requests
  WHERE requests.id = OLD.approval_request_id
  FOR KEY SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = '23503',
      MESSAGE = 'approval step parent request does not exist';
  END IF;

  SELECT requests.status
  INTO v_new_parent_status
  FROM public.approval_requests AS requests
  WHERE requests.id = NEW.approval_request_id
  FOR KEY SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = '23503',
      MESSAGE = 'approval step parent request does not exist';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'approval step identity is immutable';
  END IF;

  IF (v_old_parent_status <> 'DRAFT' OR v_new_parent_status <> 'DRAFT') AND (
    NEW.approval_request_id IS DISTINCT FROM OLD.approval_request_id
    OR NEW.step_order IS DISTINCT FROM OLD.step_order
    OR NEW.name IS DISTINCT FROM OLD.name
    OR NEW.required_permission_key IS DISTINCT FROM OLD.required_permission_key
    OR NEW.required_approvals IS DISTINCT FROM OLD.required_approvals
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'submitted approval step configuration is immutable';
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Terminal requests cannot have their approval workflow altered further.
  IF v_old_parent_status IN ('APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED')
    OR v_new_parent_status IN ('APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED') THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'approval step status cannot change after request resolution';
  END IF;

  -- Before a request enters review, its configured steps remain pending.
  IF v_old_parent_status IN ('DRAFT', 'SUBMITTED')
    OR v_new_parent_status IN ('DRAFT', 'SUBMITTED') THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'approval step status must remain PENDING before review';
  END IF;

  -- A review step becomes active only after its request enters review.
  IF OLD.status = 'PENDING' AND NEW.status = 'ACTIVE' THEN
    IF v_old_parent_status <> 'PENDING_APPROVAL'
      OR v_new_parent_status <> 'PENDING_APPROVAL' THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'approval step can become active only for a pending approval request';
    END IF;

    RETURN NEW;
  END IF;

  IF OLD.status = 'PENDING' AND NEW.status IN ('CANCELLED', 'EXPIRED') THEN
    IF v_old_parent_status <> 'PENDING_APPROVAL'
      OR v_new_parent_status <> 'PENDING_APPROVAL' THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'approval step can change only for a pending approval request';
    END IF;

    RETURN NEW;
  END IF;

  IF OLD.status = 'ACTIVE' AND NEW.status IN ('APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED') THEN
    IF v_old_parent_status <> 'PENDING_APPROVAL'
      OR v_new_parent_status <> 'PENDING_APPROVAL' THEN
      RAISE EXCEPTION USING
        ERRCODE = '23514',
        MESSAGE = 'approval step can change only for a pending approval request';
    END IF;

    RETURN NEW;
  END IF;

  RAISE EXCEPTION USING
    ERRCODE = '23514',
    MESSAGE = 'invalid approval step lifecycle transition';
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_approval_decision_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_request_status text;
  v_step_request_id uuid;
  v_step_status text;
BEGIN
  SELECT requests.status
  INTO v_request_status
  FROM public.approval_requests AS requests
  WHERE requests.id = NEW.approval_request_id
  FOR KEY SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = '23503',
      MESSAGE = 'approval decision parent request does not exist';
  END IF;

  IF v_request_status <> 'PENDING_APPROVAL' THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'approval decision requires a pending approval request';
  END IF;

  SELECT steps.approval_request_id, steps.status
  INTO v_step_request_id, v_step_status
  FROM public.approval_steps AS steps
  WHERE steps.id = NEW.approval_step_id
  FOR KEY SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING
      ERRCODE = '23503',
      MESSAGE = 'approval decision step does not exist';
  END IF;

  IF v_step_request_id IS DISTINCT FROM NEW.approval_request_id THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'approval decision step does not belong to request';
  END IF;

  IF v_step_status <> 'ACTIVE' THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'approval decision requires an active approval step';
  END IF;

  IF NEW.reviewer_user_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '23502',
      MESSAGE = 'approval decision requires a reviewer';
  END IF;

  IF NEW.decision NOT IN ('APPROVED', 'REJECTED') THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'invalid approval decision';
  END IF;

  -- The database, rather than a caller, establishes the decision timestamp.
  NEW.decided_at := pg_catalog.clock_timestamp();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_approval_decision_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = '55000',
    MESSAGE = 'approval decisions are append-only';
END;
$$;

-- Preserve the existing approval_requests_enforce_tenant trigger.
CREATE TRIGGER approval_requests_enforce_lifecycle
BEFORE INSERT OR UPDATE ON public.approval_requests
FOR EACH ROW
EXECUTE FUNCTION public.enforce_approval_request_lifecycle();

CREATE TRIGGER approval_steps_enforce_lifecycle
BEFORE INSERT OR UPDATE OR DELETE ON public.approval_steps
FOR EACH ROW
EXECUTE FUNCTION public.enforce_approval_step_lifecycle();

CREATE TRIGGER approval_decisions_enforce_insert
BEFORE INSERT ON public.approval_decisions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_approval_decision_insert();

CREATE TRIGGER approval_decisions_prevent_mutation
BEFORE UPDATE OR DELETE ON public.approval_decisions
FOR EACH ROW
EXECUTE FUNCTION public.prevent_approval_decision_mutation();
