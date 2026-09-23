import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXECUTE_PERMISSION = "ai.execute";
const TASK_TYPE = "CLAW_ANALYSIS";
const GROQ_EXECUTION_MODEL = "openai/gpt-oss-20b";

type ExecuteClawRequest = {
  workspaceId?: unknown;
  clawKey?: unknown;
  payload?: unknown;
};

type CanonicalClaw = {
  id: string;
  claw_key: string;
  is_enabled: boolean;
  required_permission: string;
};

type TrustedSop = {
  id: string;
  version: string;
  system_prompt: string;
  rules_config: unknown;
};

const jsonResponse = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const safeInputContext = (payload: Record<string, unknown>) => ({
  request_source: "browser",
  payload_present: Object.keys(payload).length > 0,
  payload_key_count: Object.keys(payload).length,
});

const safeFailureSummary = (category: string) => ({
  outcome: "failed",
  category,
});

const normalizeForDisclosureCheck = (value: string) =>
  value
    .toLowerCase()
    .replace(/\\(["\\/])/g, "$1")
    .replace(/\\[nrt]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const containsTrustedConfigurationDisclosure = (
  result: unknown,
  systemPrompt: string,
  rulesConfig: unknown,
) => {
  const serializedResult = JSON.stringify(result);
  if (!serializedResult) return false;

  const trustedMaterials = [
    systemPrompt,
    rulesConfig && typeof rulesConfig === "object" ? JSON.stringify(rulesConfig) : "",
  ];
  const normalizedResult = normalizeForDisclosureCheck(serializedResult);

  return trustedMaterials.some((material) => {
    const normalizedMaterial = normalizeForDisclosureCheck(material);
    if (!normalizedMaterial) return false;
    if (normalizedResult.includes(normalizedMaterial)) return true;

    const substantialLength = Math.max(80, Math.ceil(normalizedMaterial.length * 0.5));
    if (normalizedMaterial.length < substantialLength) return false;

    for (let start = 0; start <= normalizedMaterial.length - substantialLength; start += Math.floor(substantialLength / 2)) {
      if (normalizedResult.includes(normalizedMaterial.slice(start, start + substantialLength))) {
        return true;
      }
    }
    return false;
  });
};

const logGroqProviderError = (status: number, model: string | null, responseBody: unknown) => {
  try {
    const providerError = responseBody && typeof responseBody === "object" && !Array.isArray(responseBody)
      ? (responseBody as Record<string, unknown>).error
      : null;
    const errorDetails = providerError && typeof providerError === "object" && !Array.isArray(providerError)
      ? providerError as Record<string, unknown>
      : {};
    console.error("[Groq API Error]:", {
      status,
      model,
      ...(typeof errorDetails.code === "string" || typeof errorDetails.code === "number"
        ? { code: errorDetails.code }
        : {}),
      ...(typeof errorDetails.type === "string" ? { type: errorDetails.type } : {}),
      ...(typeof errorDetails.param === "string" ? { param: errorDetails.param } : {}),
    });
  } catch {
    // Diagnostics must not interfere with the canonical failure path.
    console.error("[Groq API Error]:", { status, model });
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  const bearerMatch = /^Bearer\s+(.+)$/i.exec(authHeader);
  const accessToken = bearerMatch?.[1]?.trim();
  if (!accessToken) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[Configuration Error]: Supabase Auth configuration is unavailable.");
    return jsonResponse({ success: false, error: "Internal server error" }, 500);
  }

  // Legacy gateway JWT verification remains disabled. This user-scoped client both
  // verifies the bearer token and evaluates authorization in the caller's JWT context.
  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: authData, error: authError } = await supabaseUser.auth.getUser(accessToken);
  const authenticatedUser = authData.user;
  if (authError || !authenticatedUser) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }
  const authenticatedUserId = authenticatedUser.id;

  let executionId: string | null = null;
  let activeModel: string | null = null;
  let supabaseAdmin: ReturnType<typeof createClient> | null = null;
  const startTime = Date.now();

  const markExecutionFailed = async (category: string) => {
    if (!executionId || !supabaseAdmin) return;

    const { error } = await supabaseAdmin
      .from("ai_executions")
      .update({
        status: "FAILED",
        completed_at: new Date().toISOString(),
        model_provider: activeModel ? "groq" : null,
        model_name: activeModel,
        output_summary: safeFailureSummary(category),
      })
      .eq("id", executionId);

    if (error) {
      console.error("[AI Execution Failure Update Error]:", error.message);
    }
  };

  const writeLegacyLog = async (clawKey: string, succeeded: boolean) => {
    try {
      if (!supabaseAdmin) return;

      const { error } = await supabaseAdmin.from("claw_execution_logs").insert({
        claw_id: clawKey,
        task_name: TASK_TYPE,
        status: succeeded ? "Success" : "Failed",
        accuracy_score: null,
        execution_time_ms: Date.now() - startTime,
      });

      if (error) {
        console.error("[Legacy Execution Log Error]:", error.message);
      }
    } catch (error) {
      console.error("[Legacy Execution Log Exception]:", error instanceof Error ? error.message : "unknown error");
    }
  };

  try {
    let requestBody: Record<string, unknown>;
    try {
      const parsedBody = await req.json();
      if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
        return jsonResponse({ error: "Malformed request body" }, 400);
      }
      requestBody = parsedBody as Record<string, unknown>;
    } catch {
      return jsonResponse({ error: "Malformed request body" }, 400);
    }

    // The execution request has a deliberately narrow contract. Trusted prompts,
    // rules, tenant identity, authorization, and approval state are server-derived.
    const allowedFields = new Set(["workspaceId", "clawKey", "payload"]);
    if (Object.keys(requestBody).some((field) => !allowedFields.has(field))) {
      return jsonResponse({ error: "Unsupported request field" }, 400);
    }

    const { workspaceId, clawKey, payload } = requestBody as ExecuteClawRequest;
    if (typeof workspaceId !== "string" || !UUID_PATTERN.test(workspaceId)) {
      return jsonResponse({ error: "Invalid workspaceId" }, 400);
    }
    if (typeof clawKey !== "string" || !clawKey.trim()) {
      return jsonResponse({ error: "Invalid clawKey" }, 400);
    }
    if (payload !== undefined && (!payload || typeof payload !== "object" || Array.isArray(payload))) {
      return jsonResponse({ error: "Invalid payload" }, 400);
    }
    const payloadData = (payload ?? {}) as Record<string, unknown>;
    const requestedClawKey = clawKey.trim();

    // This RPC runs with the caller's bearer token, so auth.uid() is the verified user.
    const { data: permitted, error: permissionError } = await supabaseUser.rpc(
      "has_workspace_permission",
      { p_workspace_id: workspaceId, p_permission_key: EXECUTE_PERMISSION },
    );
    if (permissionError) {
      console.error("[Workspace Permission Check Error]:", permissionError.message);
      return jsonResponse({ error: "Internal server error" }, 500);
    }
    if (permitted !== true) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseServiceKey) {
      console.error("[Configuration Error]: Supabase server configuration is unavailable.");
      return jsonResponse({ error: "Internal server error" }, 500);
    }
    // This client is used only after caller authentication and authorization succeed.
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: workspace, error: workspaceError } = await supabaseAdmin
      .from("workspaces")
      .select("id, organization_id")
      .eq("id", workspaceId)
      .maybeSingle();
    if (workspaceError || !workspace?.organization_id) {
      console.error("[Trusted Workspace Resolution Error]:", workspaceError?.message ?? "missing organization");
      return jsonResponse({ error: "Internal server error" }, 500);
    }

    const { data: clawRows, error: clawError } = await supabaseAdmin
      .from("claw_registry")
      .select("id, claw_key, is_enabled, required_permission")
      .eq("claw_key", requestedClawKey)
      .limit(2);
    if (clawError) {
      console.error("[Canonical Claw Resolution Error]:", clawError.message);
      return jsonResponse({ error: "Internal server error" }, 500);
    }
    if (!clawRows || clawRows.length === 0) {
      return jsonResponse({ error: "Claw not found" }, 404);
    }
    if (clawRows.length !== 1) {
      return jsonResponse({ error: "Canonical configuration conflict" }, 409);
    }
    const canonicalClaw = clawRows[0] as CanonicalClaw;
    if (!canonicalClaw.is_enabled || canonicalClaw.required_permission !== EXECUTE_PERMISSION) {
      return jsonResponse({ error: "Claw is not available" }, 409);
    }

    const { data: workspaceClawRows, error: workspaceClawError } = await supabaseAdmin
      .from("workspace_claws")
      .select("status")
      .eq("workspace_id", workspaceId)
      .eq("claw_id", canonicalClaw.claw_key)
      .limit(2);
    if (workspaceClawError) {
      console.error("[Workspace Claw Resolution Error]:", workspaceClawError.message);
      return jsonResponse({ error: "Internal server error" }, 500);
    }
    if (
      !workspaceClawRows ||
      workspaceClawRows.length !== 1 ||
      typeof workspaceClawRows[0].status !== "string" ||
      workspaceClawRows[0].status.toLowerCase() !== "active"
    ) {
      return jsonResponse({ error: "Claw is not enabled for this workspace" }, 409);
    }

    const { data: sopRows, error: sopError } = await supabaseAdmin
      .from("claw_sop_versions")
      .select("id, version, system_prompt, rules_config")
      .eq("claw_id", canonicalClaw.id)
      .eq("status", "ACTIVE")
      .limit(2);
    if (sopError) {
      console.error("[Trusted SOP Resolution Error]:", sopError.message);
      return jsonResponse({ error: "Internal server error" }, 500);
    }
    if (!sopRows || sopRows.length !== 1) {
      return jsonResponse({ error: "Trusted SOP configuration conflict" }, 409);
    }
    const trustedSop = sopRows[0] as TrustedSop;
    if (!trustedSop.system_prompt || typeof trustedSop.system_prompt !== "string") {
      return jsonResponse({ error: "Trusted SOP configuration conflict" }, 409);
    }

    const { data: execution, error: executionError } = await supabaseAdmin
      .from("ai_executions")
      .insert({
        organization_id: workspace.organization_id,
        workspace_id: workspace.id,
        initiated_by_user_id: authenticatedUserId,
        claw_key: canonicalClaw.claw_key,
        claw_sop_version_id: trustedSop.id,
        task_type: TASK_TYPE,
        status: "STARTED",
        input_context: safeInputContext(payloadData),
      })
      .select("id")
      .single();
    if (executionError || !execution?.id) {
      console.error("[AI Execution Creation Error]:", executionError?.message ?? "missing execution id");
      return jsonResponse({ error: "Internal server error" }, 500);
    }
    executionId = execution.id;

    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) {
      await markExecutionFailed("server_configuration");
      return jsonResponse({ error: "Internal server error" }, 500);
    }

    // The production model is server-owned and deterministic. Requests never select models.
    activeModel = GROQ_EXECUTION_MODEL;

    const trustedRules = trustedSop.rules_config && typeof trustedSop.rules_config === "object"
      ? `\n\nTrusted rules configuration: ${JSON.stringify(trustedSop.rules_config)}`
      : "";
    const systemInstruction = trustedSop.system_prompt.toLowerCase().includes("json")
      ? `${trustedSop.system_prompt}${trustedRules}`
      : `${trustedSop.system_prompt}${trustedRules}\n\nRespond strictly in valid JSON format.`;

    const llmResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [
          { role: "system", content: systemInstruction },
          {
            role: "user",
            content: `Run analysis for canonical Claw ${canonicalClaw.claw_key}. Untrusted task context: ${JSON.stringify(payloadData)}`,
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });
    let llmData: unknown = null;
    let hasProviderJson = false;
    try {
      llmData = await llmResponse.json();
      hasProviderJson = true;
    } catch {
      // A malformed provider error response is handled as a generic provider failure.
    }
    const duration = Date.now() - startTime;
    const providerData = llmData && typeof llmData === "object" && !Array.isArray(llmData)
      ? llmData as Record<string, unknown>
      : {};
    if (!llmResponse.ok || providerData.error) {
      logGroqProviderError(llmResponse.status, activeModel, llmData);
      await markExecutionFailed("provider_failure");
      await writeLegacyLog(canonicalClaw.claw_key, false);
      return jsonResponse({ success: false, error: "AI provider request failed" }, 502);
    }
    if (!hasProviderJson) {
      await markExecutionFailed("invalid_provider_response");
      await writeLegacyLog(canonicalClaw.claw_key, false);
      return jsonResponse({ success: false, error: "AI provider returned an invalid response" }, 502);
    }

    const choices = Array.isArray(providerData.choices) ? providerData.choices : [];
    const firstChoice = choices[0] && typeof choices[0] === "object" && !Array.isArray(choices[0])
      ? choices[0] as Record<string, unknown>
      : {};
    const message = firstChoice.message && typeof firstChoice.message === "object" && !Array.isArray(firstChoice.message)
      ? firstChoice.message as Record<string, unknown>
      : {};
    const content = message.content;
    let result: unknown = llmData;
    if (typeof content === "string") {
      try {
        result = JSON.parse(content);
      } catch {
        await markExecutionFailed("invalid_provider_response");
        await writeLegacyLog(canonicalClaw.claw_key, false);
        return jsonResponse({ success: false, error: "AI provider returned an invalid response" }, 502);
      }
    }

    if (containsTrustedConfigurationDisclosure(result, trustedSop.system_prompt, trustedSop.rules_config)) {
      await markExecutionFailed("trusted_configuration_disclosure");
      await writeLegacyLog(canonicalClaw.claw_key, false);
      return jsonResponse({ success: false, error: "AI provider returned an unsafe response" }, 502);
    }

    const { error: completionError } = await supabaseAdmin
      .from("ai_executions")
      .update({
        status: "SUCCEEDED",
        model_provider: "groq",
        model_name: activeModel,
        completed_at: new Date().toISOString(),
        output_summary: { outcome: "succeeded", response_format: "json_object" },
      })
      .eq("id", executionId);
    if (completionError) {
      console.error("[AI Execution Completion Error]:", completionError.message);
      return jsonResponse({ error: "Internal server error" }, 500);
    }

    await writeLegacyLog(canonicalClaw.claw_key, true);
    return jsonResponse(
      {
        success: true,
        executionId,
        clawKey: canonicalClaw.claw_key,
        model: activeModel,
        duration,
        result,
      },
      200,
    );
  } catch (error) {
    console.error("[Edge Function Exception]:", error instanceof Error ? error.message : "unknown error");
    await markExecutionFailed("internal_error");
    return jsonResponse({ success: false, error: "Internal server error" }, 500);
  }
});
