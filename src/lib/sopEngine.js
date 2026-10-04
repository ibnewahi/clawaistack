import { supabase } from './supabase';

/**
 * Invoke the deployed 'execute-claw' Supabase Edge Function
 */
export async function executeClawFunction({ workspaceId, clawKey, payload = {} }) {
  if (!supabase) throw new Error("Supabase client is not initialized");

  const { data, error } = await supabase.functions.invoke('execute-claw', {
    body: { workspaceId, clawKey, payload },
  });

  if (error) throw error;
  return data;
}
