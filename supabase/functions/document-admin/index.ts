import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const ALLOWED_ORIGINS = new Set([
  "https://www.clawaistack.com",
  "http://localhost:5173",
]);
const DOCUMENT_BUCKET = "financial-documents";
const DOCUMENT_UPLOAD_PERMISSION = "document.upload";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FILENAME_LENGTH = 180;

type Action = "prepare-upload" | "finalize-upload";
type FileMetadata = {
  originalFileName: string;
  safeFileName: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
};
type DocumentRow = {
  id: string;
  organization_id: string;
  workspace_id: string;
  bucket_id: string;
  object_path: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  status: string;
};
type FinalizationResult = {
  document_id: string;
  status: string;
  transitioned: boolean;
};

const FILE_TYPES: Record<string, readonly string[]> = {
  pdf: ["application/pdf"],
  csv: ["text/csv", "application/csv"],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
};

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

const safeServerLog = (action: string, category: string) => {
  console.error("[Document Admin Error]:", { action, category });
};

const allowedFieldsForAction: Record<Action, ReadonlySet<string>> = {
  "prepare-upload": new Set(["action", "workspaceId", "file"]),
  "finalize-upload": new Set(["action", "workspaceId", "documentId"]),
};

const readAction = (body: Record<string, unknown>): Action | null => {
  const action = body.action;
  return action === "prepare-upload" || action === "finalize-upload" ? action : null;
};

const hasOnlyAllowedFields = (body: Record<string, unknown>, action: Action) =>
  Object.keys(body).every((field) => allowedFieldsForAction[action].has(field));

const resolveUuid = (value: unknown) =>
  typeof value === "string" && UUID_PATTERN.test(value) ? value : null;

const normalizeMimeType = (value: string) => value.trim().toLowerCase();

const resolveTrustedObjectLocation = (
  objectPath: unknown,
  organizationId: string,
  workspaceId: string,
  documentId: string,
) => {
  if (typeof objectPath !== "string") return null;
  const segments = objectPath.split("/");
  if (
    segments.length !== 7 ||
    segments.some((segment) => !segment || segment === "." || segment === "..") ||
    segments[0] !== "organizations" ||
    segments[1] !== organizationId ||
    segments[2] !== "workspaces" ||
    segments[3] !== workspaceId ||
    segments[4] !== "documents" ||
    segments[5] !== documentId ||
    segments[6].includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(segments[6])
  ) {
    return null;
  }
  return {
    parentPath: segments.slice(0, 6).join("/"),
    fileName: segments[6],
  };
};

const resolveStorageMetadata = (value: unknown) => {
  if (!isRecord(value) || !isRecord(value.metadata)) return null;
  const size = value.metadata.size;
  const mimeType = value.metadata.mimetype;
  if (
    typeof size !== "number" ||
    !Number.isFinite(size) ||
    !Number.isInteger(size) ||
    size <= 0 ||
    typeof mimeType !== "string" ||
    !mimeType.trim()
  ) {
    return null;
  }
  return { size, mimeType: normalizeMimeType(mimeType) };
};

const sanitizeFilename = (name: string, extension: string) => {
  const basename = name.split(/[\\/]+/).pop() ?? "";
  const stem = basename.slice(0, -(extension.length + 1));
  const sanitizedStem = stem
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[^A-Za-z0-9 _-]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/-+/g, "-")
    .trim()
    .slice(0, MAX_FILENAME_LENGTH - extension.length - 1);
  return `${sanitizedStem || "document"}.${extension}`;
};

const resolveFileMetadata = (value: unknown): FileMetadata | null => {
  if (!isRecord(value) || Object.keys(value).length !== 3) return null;
  const name = value.name;
  const mimeType = value.mimeType;
  const sizeBytes = value.sizeBytes;
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof mimeType !== "string" ||
    !mimeType ||
    typeof sizeBytes !== "number" ||
    !Number.isInteger(sizeBytes) ||
    sizeBytes <= 0 ||
    sizeBytes > MAX_FILE_SIZE_BYTES
  ) {
    return null;
  }

  const basename = name.trim().split(/[\\/]+/).pop() ?? "";
  const extension = basename.includes(".") ? basename.split(".").pop()?.toLowerCase() : null;
  if (!extension || !FILE_TYPES[extension]?.includes(mimeType)) return null;

  const safeFileName = sanitizeFilename(name.trim(), extension);
  return {
    originalFileName: safeFileName,
    safeFileName,
    extension,
    mimeType,
    sizeBytes,
  };
};

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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  const bearerMatch = authHeader ? /^Bearer\s+(.+)$/i.exec(authHeader) : null;
  const accessToken = bearerMatch?.[1]?.trim();
  if (!accessToken) return jsonResponse({ success: false, error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    safeServerLog("unknown", "auth_configuration");
    return jsonResponse({ error: "Internal server error" }, 500);
  }

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: authData, error: authError } = await supabaseUser.auth.getUser(accessToken);
  if (authError || !authData.user) return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  const authenticatedUserId = authData.user.id;

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

    const requestedDocumentId = action === "finalize-upload" ? resolveUuid(body.documentId) : null;
    if (action === "finalize-upload" && !requestedDocumentId) {
      return jsonResponse({ error: "Invalid documentId" }, 400);
    }

    const { data: permitted, error: permissionError } = await supabaseUser.rpc(
      "has_workspace_permission",
      { p_workspace_id: workspaceId, p_permission_key: DOCUMENT_UPLOAD_PERMISSION },
    );
    if (permissionError) {
      safeServerLog(action, "workspace_permission_check");
      return jsonResponse({ error: "Internal server error" }, 500);
    }
    if (permitted !== true) return jsonResponse({ error: "Forbidden" }, 403);

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
      safeServerLog(action, "server_configuration");
      return jsonResponse({ error: "Internal server error" }, 500);
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from("workspaces")
      .select("id, organization_id")
      .eq("id", workspaceId)
      .maybeSingle();
    if (workspaceError || !workspace?.organization_id) {
      safeServerLog(action, "workspace_resolution");
      return jsonResponse({ error: "Internal server error" }, 500);
    }
    const organizationId = workspace.organization_id as string;

    if (action === "finalize-upload") {
      const documentId = requestedDocumentId;
      if (!documentId) return jsonResponse({ error: "Invalid documentId" }, 400);

      const { data: documentData, error: documentError } = await supabaseAdmin
        .from("documents")
        .select("id, organization_id, workspace_id, bucket_id, object_path, mime_type, file_size_bytes, status")
        .eq("id", documentId)
        .maybeSingle();
      if (documentError) {
        safeServerLog(action, "document_resolution");
        return jsonResponse({ error: "Internal server error" }, 500);
      }
      if (!documentData) return jsonResponse({ error: "Document not found" }, 404);

      const document = documentData as DocumentRow;
      if (
        document.id !== documentId ||
        document.organization_id !== organizationId ||
        document.workspace_id !== workspaceId ||
        document.bucket_id !== DOCUMENT_BUCKET
      ) {
        return jsonResponse({ error: "Document not found" }, 404);
      }
      if (document.status !== "PENDING_UPLOAD" && document.status !== "UPLOADED") {
        return jsonResponse({ error: "Document cannot be finalized" }, 409);
      }
      if (
        typeof document.file_size_bytes !== "number" ||
        !Number.isInteger(document.file_size_bytes) ||
        document.file_size_bytes <= 0 ||
        typeof document.mime_type !== "string" ||
        !document.mime_type.trim()
      ) {
        safeServerLog(action, "document_metadata_invalid");
        return jsonResponse({ error: "Unable to finalize document upload" }, 409);
      }

      const objectLocation = resolveTrustedObjectLocation(
        document.object_path,
        organizationId,
        workspaceId,
        documentId,
      );
      if (!objectLocation) {
        safeServerLog(action, "document_path_invalid");
        return jsonResponse({ error: "Unable to finalize document upload" }, 409);
      }

      const { data: storageObjects, error: storageError } = await supabaseAdmin.storage
        .from(DOCUMENT_BUCKET)
        .list(objectLocation.parentPath, {
          search: objectLocation.fileName,
          limit: 10,
        });
      if (storageError) {
        safeServerLog(action, "storage_object_lookup");
        return jsonResponse({ error: "Unable to finalize document upload" }, 502);
      }

      const exactObjects = (storageObjects ?? []).filter((storageObject) =>
        storageObject.id !== null && storageObject.name === objectLocation.fileName
      );
      if (exactObjects.length !== 1) {
        safeServerLog(action, "storage_object_missing_or_ambiguous");
        return jsonResponse({ error: "Unable to finalize document upload" }, 409);
      }

      const storageMetadata = resolveStorageMetadata(exactObjects[0]);
      if (!storageMetadata) {
        safeServerLog(action, "storage_metadata_unavailable");
        return jsonResponse({ error: "Unable to finalize document upload" }, 502);
      }

      const approvedMimeType = normalizeMimeType(document.mime_type);
      if (
        document.mime_type !== approvedMimeType ||
        storageMetadata.size !== document.file_size_bytes ||
        storageMetadata.mimeType !== approvedMimeType
      ) {
        safeServerLog(action, "storage_metadata_mismatch");
        return jsonResponse({ error: "Unable to finalize document upload" }, 409);
      }

      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
        "finalize_document_upload",
        {
          p_document_id: document.id,
          p_organization_id: organizationId,
          p_workspace_id: workspaceId,
          p_actor_user_id: authenticatedUserId,
          p_stored_size_bytes: storageMetadata.size,
          p_stored_mime_type: storageMetadata.mimeType,
        },
      );
      if (rpcError || !Array.isArray(rpcData) || rpcData.length !== 1 || !isRecord(rpcData[0])) {
        safeServerLog(action, "document_finalization_rpc");
        return jsonResponse({ error: "Unable to finalize document upload" }, 500);
      }

      const rpcResult = rpcData[0] as FinalizationResult;
      if (
        rpcResult.document_id !== document.id ||
        rpcResult.status !== "UPLOADED" ||
        typeof rpcResult.transitioned !== "boolean"
      ) {
        safeServerLog(action, "document_finalization_rpc_result");
        return jsonResponse({ error: "Unable to finalize document upload" }, 500);
      }

      return jsonResponse({
        success: true,
        document: { id: rpcResult.document_id, status: rpcResult.status },
        transitioned: rpcResult.transitioned,
      }, 200);
    }

    const file = resolveFileMetadata(body.file);
    if (!file) return jsonResponse({ error: "Invalid file metadata" }, 400);

    const documentId = crypto.randomUUID();
    const objectPath = [
      "organizations",
      organizationId,
      "workspaces",
      workspaceId,
      "documents",
      documentId,
      file.safeFileName,
    ].join("/");

    const { error: documentInsertError } = await supabaseAdmin.from("documents").insert({
      id: documentId,
      organization_id: organizationId,
      workspace_id: workspaceId,
      uploaded_by_user_id: authenticatedUserId,
      bucket_id: DOCUMENT_BUCKET,
      object_path: objectPath,
      original_file_name: file.originalFileName,
      mime_type: file.mimeType,
      file_size_bytes: file.sizeBytes,
      checksum_sha256: null,
      document_type: null,
      status: "PENDING_UPLOAD",
    });
    if (documentInsertError) {
      safeServerLog(action, "document_metadata_create");
      return jsonResponse({ error: "Internal server error" }, 500);
    }

    const { data: signedUpload, error: signedUploadError } = await supabaseAdmin.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUploadUrl(objectPath);
    if (signedUploadError || !signedUpload?.token || signedUpload.path !== objectPath) {
      safeServerLog(action, "signed_upload_authorization");
      return jsonResponse({ error: "Unable to prepare document upload" }, 500);
    }

    const { error: auditError } = await supabaseAdmin.from("audit_events").insert({
      organization_id: organizationId,
      workspace_id: workspaceId,
      event_type: "document.upload_prepared",
      actor_type: "HUMAN",
      actor_user_id: authenticatedUserId,
      subject_type: "document",
      subject_id: documentId,
      previous_state: null,
      new_state: { status: "PENDING_UPLOAD" },
      metadata: {
        bucket_id: DOCUMENT_BUCKET,
        file_extension: file.extension,
        declared_size_bytes: file.sizeBytes,
        mime_type: file.mimeType,
        status: "PENDING_UPLOAD",
      },
      previous_event_hash: null,
      event_hash: null,
      occurred_at: new Date().toISOString(),
    });
    if (auditError) {
      safeServerLog(action, "audit_append");
      return jsonResponse({ error: "Unable to prepare document upload" }, 500);
    }

    return jsonResponse({
      success: true,
      document: {
        id: documentId,
        status: "PENDING_UPLOAD",
        originalFileName: file.originalFileName,
      },
      upload: {
        bucketId: DOCUMENT_BUCKET,
        objectPath,
        signedUploadToken: signedUpload.token,
      },
    }, 200);
  } catch {
    safeServerLog(action, "unexpected_error");
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
