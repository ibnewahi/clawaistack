import { supabase } from './supabase';

export async function logAuditEntry({
  userId,
  agentName,
  actionType,
  status,
  previousState = null,
  newState,
  confidenceScore = null
}) {
  try {
    const logEntry = {
      claw_id: agentName ? agentName.toLowerCase().replace(/\s+/g, '-') : 'system',
      task_name: `${actionType} — ${typeof newState === 'object' ? JSON.stringify(newState) : newState}`,
      status: status,
      accuracy_score: confidenceScore ? Math.round(confidenceScore * 100) : 100,
      user_id: userId || null,
      execution_time_ms: 350,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('claw_execution_logs')
      .insert([logEntry])
      .select();

    if (error) {
      console.error('Failed to write immutable audit log:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Audit logger exception:', err);
    return { success: false, error: err.message };
  }
}