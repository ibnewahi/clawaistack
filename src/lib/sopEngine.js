import { supabase } from './supabase';

/**
 * Fetch the active SOP prompt for a specific Claw from Supabase
 */
export async function getActiveSOPPrompt(clawKey) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('sop_prompts')
      .select('*')
      .eq('claw_key', clawKey)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`Error loading SOP for ${clawKey}:`, err.message);
    return null;
  }
}

/**
 * Combine prompt settings and input data into a unified payload
 */
export async function compileClawPayload(clawKey, inputData = {}) {
  const sop = await getActiveSOPPrompt(clawKey);

  return {
    clawKey,
    version: sop?.version || 'v1.0.0',
    systemPrompt: sop?.system_prompt || 'You are an autonomous AI finance agent. Analyze input parameters and output structured JSON.',
    rulesConfig: sop?.rules_config || {},
    payload: inputData,
    executedAt: new Date().toISOString()
  };
}

/**
 * Invoke the deployed 'execute-claw' Supabase Edge Function
 */
export async function executeClawFunction(compiledPayload) {
  if (!supabase) throw new Error("Supabase client is not initialized");

  const { data, error } = await supabase.functions.invoke('execute-claw', {
    body: compiledPayload,
  });

  if (error) throw error;
  return data;
}