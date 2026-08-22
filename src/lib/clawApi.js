import { createClient } from "@supabase/supabase-js";

// Read variables from Vite environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Triggers an agent task via the execute-claw Edge Function
 */
export async function executeClawAgent({ clawKey, systemPrompt, payload }) {
  const { data, error } = await supabase.functions.invoke("execute-claw", {
    body: { clawKey, systemPrompt, payload },
  });

  if (error) {
    console.error("[Claw Execution Error]:", error);
    throw new Error(error.message || "Failed to execute agent task");
  }

  return data;
}

/**
 * Fetches recent agent execution logs for the frontend UI dashboard
 */
export async function getRecentAgentLogs(limit = 10) {
  const { data, error } = await supabase
    .from("claw_execution_logs")
    .select("id, claw_id, task_name, status, execution_time_ms, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Error fetching logs]:", error);
    return [];
  }

  return data || [];
}