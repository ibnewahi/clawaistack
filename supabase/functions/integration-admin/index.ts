import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import {
  getIntegrationProvider,
  integrationProviders,
  type IntegrationProvider,
} from "../_shared/integrationRegistry.ts";

const ALLOWED_ORIGINS = new Set([
  "https://www.clawaistack.com",
  "http://localhost:5173",
]);

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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MANAGE_PERMISSION = "integration.manage";

type Action = "list" | "configure" | "disconnect";
type IntegrationRow = {
  id: string;
  integration_key: string;
  name: string;
  category: string;
  workspace_id: string | null;
  is_connected: boolean;
  updated_at: string | null;
};
const safeServerLog = (
  action: string,
  providerKey: string | null,
  category: string,
) => {
  console.error("[Integration Admin Error]:", { action, providerKey, category });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const allowedFieldsForAction: Record<Action, ReadonlySet<string>> = {
  list: new Set(["action", "workspaceId"]),
  configure: new Set(["action", "workspaceId", "integrationKey", "credential"]),
  disconnect: new Set(["action", "workspaceId", "integrationKey"]),
};

const readAction = (body: Record<string, unknown>): Action | null => {
  const action = body.action;
  if (action !== "list" && action !== "configure" && action !== "disconnect") return null;
  return action;
};

const hasOnlyAllowedFields = (body: Record<string, unknown>, action: Action) =>
  Object.keys(body).every((field) => allowedFieldsForAction[action].has(field));

const resolveRequestedWorkspace = (workspaceId: unknown) =>
  typeof workspaceId === "string" && UUID_PATTERN.test(workspaceId) ? workspaceId : null;

const resolveCredential = (value: unknown, provider: IntegrationProvider) => {
  if (!isRecord(value) || Object.keys(value).length !== 2) return null;
  const type = value.type;
  const secret = value.value;
  if (
    typeof type !== "string" ||
    typeof secret !== "string" ||
    !secret.trim() ||
    secret.length > 16_384 ||
    !provider.allowedCredentialTypes.includes(type as "api_secret")
  ) {
    return null;
  }
  return { type, value: secret };
};

const safeConnectionState = (hasCredential: boolean) =>
  hasCredential ? "credential_configured_unverified" : "not_configured";

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
    safeServerLog("unknown", null, "auth_configuration");
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
  let providerKey: string | null = null;
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

    const workspaceId = resolveRequestedWorkspace(body.workspaceId);
    if (!workspaceId) return jsonResponse({ error: "Invalid workspaceId" }, 400);

    if (action !== "list") {
      if (typeof body.integrationKey !== "string" || !body.integrationKey.trim()) {
        return jsonResponse({ error: "Invalid integrationKey" }, 400);
      }
      providerKey = body.integrationKey.trim();
    }

    // This RPC uses the verified user's JWT. service_role is not user authorization.
    const { data: permitted, error: permissionError } = await supabaseUser.rpc(
      "has_workspace_permission",
      { p_workspace_id: workspaceId, p_permission_key: MANAGE_PERMISSION },
    );
    if (permissionError) {
      safeServerLog(action, providerKey, "workspace_permission_check");
      return jsonResponse({ error: "Internal server error" }, 500);
    }
    if (permitted !== true) return jsonResponse({ error: "Forbidden" }, 403);

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceRoleKey) {
      safeServerLog(action, providerKey, "server_configuration");
      return jsonResponse({ error: "Internal server error" }, 500);
    }
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from("workspaces")
      .select("id, organization_id")
      .eq("id", workspaceId)
      .maybeSingle();
    if (workspaceError || !workspace?.organization_id) {
      safeServerLog(action, providerKey, "workspace_resolution");
      return jsonResponse({ error: "Internal server error" }, 500);
    }
    const organizationId = workspace.organization_id as string;

    if (action === "list") {
      const { data: integrationRows, error: integrationsError } = await supabaseAdmin
        .from("integrations")
        .select("id, integration_key, name, category, workspace_id, is_connected, updated_at")
        .eq("organization_id", organizationId)
        .or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`);
      if (integrationsError) {
        safeServerLog(action, null, "integration_list_query");
        return jsonResponse({ error: "Internal server error" }, 500);
      }

      const rows = (integrationRows ?? []) as IntegrationRow[];
      const integrationIds = rows.map((row) => row.id);
      let credentialIntegrationIds = new Set<string>();
      if (integrationIds.length > 0) {
        const { data: credentialRows, error: credentialsError } = await supabaseAdmin
          .from("integration_credentials")
          .select("integration_id")
          .in("integration_id", integrationIds);
        if (credentialsError) {
          safeServerLog(action, null, "credential_relationship_list");
          return jsonResponse({ error: "Internal server error" }, 500);
        }
        credentialIntegrationIds = new Set((credentialRows ?? []).map((row) => row.integration_id));
      }

      const integrations = integrationProviders.map((provider) => {
        const matchingRows = rows.filter((row) => row.integration_key === provider.key);
        if (matchingRows.length > 1) {
          return {
            integrationKey: provider.key,
            displayName: provider.displayName,
            category: provider.category,
            scope: provider.supportedScope,
            connectionState: "configuration_conflict",
            updatedAt: null,
          };
        }
        const matchingRow = matchingRows[0];
        const hasCredential = matchingRow ? credentialIntegrationIds.has(matchingRow.id) : false;
        return {
          integrationKey: provider.key,
          displayName: provider.displayName,
          category: provider.category,
          scope: matchingRow?.workspace_id ? "workspace" : provider.supportedScope,
          connectionState: safeConnectionState(hasCredential),
          updatedAt: matchingRow?.updated_at ?? null,
        };
      });

      return jsonResponse({ success: true, workspaceId, integrations }, 200);
    }

    const provider = getIntegrationProvider(providerKey);
    if (!provider) return jsonResponse({ error: "Integration provider not found" }, 404);

    const { data: candidateRows, error: candidatesError } = await supabaseAdmin
      .from("integrations")
      .select("id, integration_key, name, category, workspace_id, is_connected, updated_at")
      .eq("organization_id", organizationId)
      .eq("integration_key", provider.key)
      .or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`);
    if (candidatesError) {
      safeServerLog(action, provider.key, "integration_resolution");
      return jsonResponse({ error: "Internal server error" }, 500);
    }
    const candidates = (candidateRows ?? []) as IntegrationRow[];
    if (candidates.length > 1) return jsonResponse({ error: "Integration configuration conflict" }, 409);

    if (action === "configure") {
      const credential = resolveCredential(body.credential, provider);
      if (!credential) return jsonResponse({ error: "Invalid credential" }, 400);

      let integration = candidates[0] ?? null;
      if (!integration) {
        const { data: insertedIntegration, error: insertError } = await supabaseAdmin
          .from("integrations")
          .insert({
            integration_key: provider.key,
            name: provider.displayName,
            category: provider.category,
            is_connected: false,
            organization_id: organizationId,
            workspace_id: provider.supportedScope === "workspace" ? workspaceId : null,
            user_id: authenticatedUserId,
          })
          .select("id, integration_key, name, category, workspace_id, is_connected, updated_at")
          .single();
        if (insertError || !insertedIntegration) {
          safeServerLog(action, provider.key, "integration_create");
          return jsonResponse({ error: "Internal server error" }, 500);
        }
        integration = insertedIntegration as IntegrationRow;
      }

      // This public SECURITY DEFINER RPC resolves Vault IDs internally, stores the
      // credential atomically, and leaves the integration unverified/disconnected.
      const { data: credentialStored, error: credentialStoreError } = await supabaseAdmin.rpc(
        "store_integration_credential",
        {
          p_integration_id: integration.id,
          p_credential_type: "api_secret",
          p_secret: credential.value,
        },
      );
      if (credentialStoreError || credentialStored !== true) {
        safeServerLog(action, provider.key, "credential_store");
        return jsonResponse({ error: "Internal server error" }, 500);
      }

      return jsonResponse({
        success: true,
        integrationKey: provider.key,
        connectionState: "credential_configured_unverified",
      }, 200);
    }

    const integration = candidates[0];
    if (!integration) return jsonResponse({ error: "Integration not found" }, 404);

    // This RPC atomically disconnects the integration and deletes any internally
    // resolved credential relationship and Vault secret in FK-safe order.
    const { data: credentialDeleted, error: credentialDeleteError } = await supabaseAdmin.rpc(
      "delete_integration_credential",
      {
        p_integration_id: integration.id,
        p_credential_type: "api_secret",
      },
    );
    if (credentialDeleteError || typeof credentialDeleted !== "boolean") {
      safeServerLog(action, provider.key, "credential_delete");
      return jsonResponse({ error: "Internal server error" }, 500);
    }

    return jsonResponse({
      success: true,
      integrationKey: provider.key,
      connectionState: "disconnected",
    }, 200);
  } catch {
    safeServerLog(action, providerKey, "unexpected_error");
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
