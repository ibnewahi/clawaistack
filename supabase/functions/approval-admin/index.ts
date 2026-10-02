import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const ALLOWED_ORIGINS = new Set([
  "https://www.clawaistack.com",
  "http://localhost:5173",
]);

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIMESTAMPTZ_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

type Action = "create-draft" | "configure-step" | "submit" | "cancel" | "decide" | "list-review-queue";
type RpcCategory =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "INVALID_STATE"
  | "INDEPENDENT_REVIEW_REQUIRED"
  | "IDEMPOTENCY_CONFLICT"
  | "DECISION_CONFLICT"
  | "INTERNAL_ERROR";

const corsHeadersForOrigin = (origin: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const allowedFieldsForAction: Record<Action, ReadonlySet<string>> = {
  "create-draft": new Set([
    "action",
    "workspaceId",
    "actionType",
    "targetType",
    "targetId",
    "proposedPayload",
    "idempotencyKey",
  ]),
  "configure-step": new Set([
    "action",
    "workspaceId",
    "approvalRequestId",
    "stepOrder",
    "name",
    "requiredPermissionKey",
    "requiredApprovals",
  ]),
  submit: new Set(["action", "workspaceId", "approvalRequestId"]),
  cancel: new Set(["action", "workspaceId", "approvalRequestId"]),
  decide: new Set([
    "action",
    "workspaceId",
    "approvalRequestId",
    "approvalStepId",
    "decision",
    "comment",
  ]),
  "list-review-queue": new Set(["action", "workspaceId", "pageSize", "cursor"]),
};

const readAction = (body: Record<string, unknown>): Action | null => {
  const action = body.action;
  return action === "create-draft" ||
      action === "configure-step" ||
      action === "submit" ||
      action === "cancel" ||
      action === "decide" ||
      action === "list-review-queue"
    ? action
    : null;
};

const hasOnlyAllowedFields = (body: Record<string, unknown>, action: Action) =>
  Object.keys(body).every((field) => allowedFieldsForAction[action].has(field));

const resolveUuid = (value: unknown) =>
  typeof value === "string" && UUID_PATTERN.test(value) ? value : null;

const nonEmptyString = (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const isValidTimestamptz = (value: unknown) =>
  typeof value === "string" && value.length <= 64 && TIMESTAMPTZ_PATTERN.test(value) &&
  !Number.isNaN(Date.parse(value));

const isReviewQueueRow = (value: unknown): value is Record<string, unknown> => {
  if (!isRecord(value)) return false;
  return typeof value.approval_request_id === "string" &&
    typeof value.action_type === "string" &&
    (value.target_type === null || typeof value.target_type === "string") &&
    (value.target_id === null || resolveUuid(value.target_id) !== null) &&
    typeof value.status === "string" &&
    typeof value.submitted_at === "string" &&
    (value.expires_at === null || typeof value.expires_at === "string") &&
    typeof value.requires_independent_approval === "boolean" &&
    typeof value.approval_step_id === "string" &&
    Number.isInteger(value.step_order) &&
    typeof value.step_name === "string" &&
    Number.isInteger(value.required_approvals) &&
    Number.isInteger(value.approved_decision_count);
};

const normalizeDecision = (value: unknown) => {
  if (typeof value !== "string") return null;
  const decision = value.trim().toUpperCase();
  return decision === "APPROVED" || decision === "REJECTED" ? decision : null;
};

const categoryFromRpcError = (error: unknown): RpcCategory => {
  const message = isRecord(error) && typeof error.message === "string" ? error.message : "";
  switch (message) {
    case "AUTH_REQUIRED":
    case "FORBIDDEN":
    case "NOT_FOUND":
    case "INVALID_INPUT":
    case "INVALID_STATE":
    case "INDEPENDENT_REVIEW_REQUIRED":
    case "IDEMPOTENCY_CONFLICT":
    case "DECISION_CONFLICT":
    case "INTERNAL_ERROR":
      return message;
    default:
      return "INTERNAL_ERROR";
  }
};

const errorResponseForCategory = (category: RpcCategory) => {
  switch (category) {
    case "AUTH_REQUIRED":
      return { status: 401, error: "Unauthorized" };
    case "FORBIDDEN":
    case "INDEPENDENT_REVIEW_REQUIRED":
      return { status: 403, error: "Forbidden" };
    case "NOT_FOUND":
      return { status: 404, error: "Approval request not found" };
    case "INVALID_INPUT":
      return { status: 400, error: "Invalid approval request" };
    case "INVALID_STATE":
    case "IDEMPOTENCY_CONFLICT":
    case "DECISION_CONFLICT":
      return { status: 409, error: "Approval request conflict" };
    default:
      return { status: 500, error: "Internal server error" };
  }
};

const rpcResult = (value: unknown) =>
  Array.isArray(value) ? value[0] : value;

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = corsHeadersForOrigin(origin);
  const jsonResponse = (body: Record<string, unknown>, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return jsonResponse({ error: "Origin not allowed" }, 403);
  }
  if (req.method === "OPTIONS") {
    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      return jsonResponse({ error: "Origin not allowed" }, 403);
    }
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  const bearerMatch = authHeader ? /^Bearer\s+(.+)$/i.exec(authHeader) : null;
  const accessToken = bearerMatch?.[1]?.trim();
  if (!accessToken) return jsonResponse({ success: false, error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: authData, error: authError } = await supabaseUser.auth.getUser(accessToken);
  if (authError || !authData.user) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  let action = "unknown";
  try {
    let body: Record<string, unknown>;
    try {
      const parsed = await req.json();
      if (!isRecord(parsed)) return jsonResponse({ error: "Malformed request body" }, 400);
      body = parsed;
    } catch {
      return jsonResponse({ error: "Malformed request body" }, 400);
    }

    const requestedAction = readAction(body);
    if (!requestedAction || !hasOnlyAllowedFields(body, requestedAction)) {
      return jsonResponse({ error: "Unsupported request field or action" }, 400);
    }
    action = requestedAction;

    const workspaceId = resolveUuid(body.workspaceId);
    if (!workspaceId) return jsonResponse({ error: "Invalid workspaceId" }, 400);

    if (action === "create-draft") {
      const actionType = nonEmptyString(body.actionType);
      const targetType = body.targetType === null || body.targetType === undefined
        ? null
        : nonEmptyString(body.targetType);
      const targetId = body.targetId === null || body.targetId === undefined
        ? null
        : resolveUuid(body.targetId);
      const idempotencyKey = resolveUuid(body.idempotencyKey);
      if (!actionType || (body.targetType !== null && body.targetType !== undefined && !targetType)
        || (body.targetId !== null && body.targetId !== undefined && !targetId)
        || !isRecord(body.proposedPayload) || !idempotencyKey) {
        return jsonResponse({ error: "Invalid approval request" }, 400);
      }

      const { data, error } = await supabaseUser.rpc("create_human_approval_draft", {
        p_workspace_id: workspaceId,
        p_action_type: actionType,
        p_target_type: targetType,
        p_target_id: targetId,
        p_proposed_payload: body.proposedPayload,
        p_idempotency_key: idempotencyKey,
      });
      if (error) {
        const category = categoryFromRpcError(error);
        const safeError = errorResponseForCategory(category);
        return jsonResponse({ success: false, error: safeError.error }, safeError.status);
      }
      const result = rpcResult(data);
      if (!isRecord(result) || typeof result.approval_request_id !== "string" ||
        typeof result.status !== "string" || typeof result.idempotent_replay !== "boolean") {
        return jsonResponse({ error: "Internal server error" }, 500);
      }
      return jsonResponse({
        success: true,
        approvalRequestId: result.approval_request_id,
        status: result.status,
        idempotentReplay: result.idempotent_replay,
      }, 200);
    }

    if (action === "configure-step") {
      const approvalRequestId = resolveUuid(body.approvalRequestId);
      const name = nonEmptyString(body.name);
      const requiredPermissionKey = nonEmptyString(body.requiredPermissionKey);
      const stepOrder = body.stepOrder;
      const requiredApprovals = body.requiredApprovals;
      if (!approvalRequestId || !name || !requiredPermissionKey ||
        !Number.isInteger(stepOrder) || stepOrder <= 0 ||
        !Number.isInteger(requiredApprovals) || requiredApprovals < 1 || requiredApprovals > 25) {
        return jsonResponse({ error: "Invalid approval request" }, 400);
      }
      const { data, error } = await supabaseUser.rpc("configure_human_approval_step", {
        p_workspace_id: workspaceId,
        p_approval_request_id: approvalRequestId,
        p_step_order: stepOrder,
        p_name: name,
        p_required_permission_key: requiredPermissionKey,
        p_required_approvals: requiredApprovals,
      });
      if (error) {
        const category = categoryFromRpcError(error);
        const safeError = errorResponseForCategory(category);
        return jsonResponse({ success: false, error: safeError.error }, safeError.status);
      }
      const result = rpcResult(data);
      if (!isRecord(result) || typeof result.approval_step_id !== "string" ||
        typeof result.status !== "string" || typeof result.idempotent_replay !== "boolean") {
        return jsonResponse({ error: "Internal server error" }, 500);
      }
      return jsonResponse({
        success: true,
        approvalStepId: result.approval_step_id,
        status: result.status,
        idempotentReplay: result.idempotent_replay,
      }, 200);
    }

    if (action === "submit" || action === "cancel") {
      const approvalRequestId = resolveUuid(body.approvalRequestId);
      if (!approvalRequestId) return jsonResponse({ error: "Invalid approval request" }, 400);
      const rpcName = action === "submit"
        ? "submit_human_approval_request"
        : "cancel_human_approval_draft";
      const { data, error } = await supabaseUser.rpc(rpcName, {
        p_workspace_id: workspaceId,
        p_approval_request_id: approvalRequestId,
      });
      if (error) {
        const category = categoryFromRpcError(error);
        const safeError = errorResponseForCategory(category);
        return jsonResponse({ success: false, error: safeError.error }, safeError.status);
      }
      const result = rpcResult(data);
      if (!isRecord(result) || typeof result.approval_request_id !== "string" ||
        typeof result.idempotent_replay !== "boolean") {
        return jsonResponse({ error: "Internal server error" }, 500);
      }
      if (action === "submit") {
        if (typeof result.request_status !== "string" ||
          (result.active_approval_step_id !== null && typeof result.active_approval_step_id !== "string")) {
          return jsonResponse({ error: "Internal server error" }, 500);
        }
        return jsonResponse({
          success: true,
          approvalRequestId: result.approval_request_id,
          requestStatus: result.request_status,
          activeApprovalStepId: result.active_approval_step_id,
          idempotentReplay: result.idempotent_replay,
        }, 200);
      }
      if (typeof result.status !== "string") {
        return jsonResponse({ error: "Internal server error" }, 500);
      }
      return jsonResponse({
        success: true,
        approvalRequestId: result.approval_request_id,
        status: result.status,
        idempotentReplay: result.idempotent_replay,
      }, 200);
    }

    if (action === "list-review-queue") {
      const pageSize = body.pageSize === undefined ? 20 : body.pageSize;
      if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
        return jsonResponse({ error: "Invalid approval request" }, 400);
      }

      let cursorSubmittedAt: string | null = null;
      let cursorApprovalRequestId: string | null = null;
      if (body.cursor !== undefined && body.cursor !== null) {
        const cursor = body.cursor;
        if (!isRecord(cursor) ||
          Object.keys(cursor).length !== 2 ||
          !Object.prototype.hasOwnProperty.call(cursor, "submittedAt") ||
          !Object.prototype.hasOwnProperty.call(cursor, "approvalRequestId") ||
          !isValidTimestamptz(cursor.submittedAt) ||
          !resolveUuid(cursor.approvalRequestId)) {
          return jsonResponse({ error: "Invalid approval request" }, 400);
        }
        cursorSubmittedAt = cursor.submittedAt;
        cursorApprovalRequestId = cursor.approvalRequestId;
      }

      const { data, error } = await supabaseUser.rpc("list_reviewable_approval_requests", {
        p_workspace_id: workspaceId,
        p_page_size: pageSize,
        p_cursor_submitted_at: cursorSubmittedAt,
        p_cursor_request_id: cursorApprovalRequestId,
      });
      if (error) {
        const category = categoryFromRpcError(error);
        const safeError = errorResponseForCategory(category);
        return jsonResponse({ success: false, error: safeError.error }, safeError.status);
      }
      if (!Array.isArray(data)) {
        return jsonResponse({ error: "Internal server error" }, 500);
      }
      const rows: Record<string, unknown>[] = [];
      for (const row of data) {
        if (!isReviewQueueRow(row)) {
          return jsonResponse({ error: "Internal server error" }, 500);
        }
        rows.push(row);
      }

      const items = rows.map((row) => ({
        approvalRequestId: row.approval_request_id,
        actionType: row.action_type,
        targetType: row.target_type,
        targetId: row.target_id,
        status: row.status,
        submittedAt: row.submitted_at,
        expiresAt: row.expires_at,
        independentApprovalRequired: row.requires_independent_approval,
        activeStepId: row.approval_step_id,
        activeStepOrder: row.step_order,
        activeStepName: row.step_name,
        requiredApprovals: row.required_approvals,
        approvedDecisionCount: row.approved_decision_count,
        activeStepStatus: "ACTIVE",
      }));
      const finalItem = items[items.length - 1];
      // A full page supplies a continuation cursor, but does not prove another row exists.
      const nextCursor = items.length === pageSize && finalItem
        ? {
          submittedAt: finalItem.submittedAt,
          approvalRequestId: finalItem.approvalRequestId,
        }
        : null;
      return jsonResponse({ items, nextCursor }, 200);
    }

    const approvalRequestId = resolveUuid(body.approvalRequestId);
    const approvalStepId = resolveUuid(body.approvalStepId);
    const decision = normalizeDecision(body.decision);
    const comment = body.comment === null || body.comment === undefined
      ? null
      : typeof body.comment === "string" ? body.comment : null;
    if (!approvalRequestId || !approvalStepId || !decision ||
      (body.comment !== null && body.comment !== undefined &&
        (comment === null || comment.length > 2000))) {
      return jsonResponse({ error: "Invalid approval request" }, 400);
    }
    const { data, error } = await supabaseUser.rpc("decide_human_approval_step", {
      p_workspace_id: workspaceId,
      p_approval_request_id: approvalRequestId,
      p_approval_step_id: approvalStepId,
      p_decision: decision,
      p_comment: comment,
    });
    if (error) {
      const category = categoryFromRpcError(error);
      const safeError = errorResponseForCategory(category);
      return jsonResponse({ success: false, error: safeError.error }, safeError.status);
    }
    const result = rpcResult(data);
    if (!isRecord(result) || typeof result.approval_decision_id !== "string" ||
      typeof result.approval_step_status !== "string" ||
      typeof result.approval_request_status !== "string" ||
      typeof result.idempotent_replay !== "boolean") {
      return jsonResponse({ error: "Internal server error" }, 500);
    }
    return jsonResponse({
      success: true,
      approvalDecisionId: result.approval_decision_id,
      approvalStepStatus: result.approval_step_status,
      approvalRequestStatus: result.approval_request_status,
      idempotentReplay: result.idempotent_replay,
    }, 200);
  } catch {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
