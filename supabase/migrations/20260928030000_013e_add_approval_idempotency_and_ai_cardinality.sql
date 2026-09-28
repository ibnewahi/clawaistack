ALTER TABLE public.approval_requests
  ADD COLUMN idempotency_key uuid;

CREATE UNIQUE INDEX approval_requests_human_idempotency_key_unique
  ON public.approval_requests (
    organization_id,
    requested_by_user_id,
    idempotency_key
  )
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX ai_proposals_approval_request_id_unique
  ON public.ai_proposals (approval_request_id)
  WHERE approval_request_id IS NOT NULL;
