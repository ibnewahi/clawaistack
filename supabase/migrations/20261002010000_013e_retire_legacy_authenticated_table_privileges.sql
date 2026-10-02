-- Migration 013E: retire legacy authenticated browser table privileges.
--
-- Trusted approval lifecycle and review-list access now cross the authorized
-- approval-admin boundary, replacing direct browser approval-table access.
-- action_queue has no remaining browser consumer, and browser execution-log
-- writes are retired. Authorized execution-log SELECT remains for UI reads and
-- realtime; execute-claw server logging is outside this browser grant boundary.
-- Existing RLS policies intentionally remain unchanged.

BEGIN;

REVOKE SELECT, INSERT, UPDATE
ON TABLE public.action_queue
FROM authenticated;

REVOKE INSERT
ON TABLE public.claw_execution_logs
FROM authenticated;

REVOKE SELECT, INSERT
ON TABLE public.approval_requests
FROM authenticated;

REVOKE SELECT
ON TABLE public.approval_steps
FROM authenticated;

REVOKE SELECT
ON TABLE public.approval_decisions
FROM authenticated;

REVOKE SELECT
ON TABLE public.ai_proposals
FROM authenticated;

REVOKE SELECT
ON TABLE public.ai_executions
FROM authenticated;

COMMIT;
