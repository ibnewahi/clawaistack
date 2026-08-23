import { logAuditEntry } from './auditLogger';

export async function runAgentAutonomousTask({ agentName, taskType, payload, confidenceScore = 0.95 }) {
  try {
    const result = await logAuditEntry({
      userId: null, // System / background execution
      agentName: agentName,
      actionType: taskType,
      status: 'success',
      previousState: null,
      newState: payload,
      confidenceScore: confidenceScore
    });

    if (!result.success) {
      console.error(`Failed to log autonomous execution for ${agentName}:`, result.error);
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  } catch (err) {
    console.error('Agent dispatcher exception:', err);
    return { success: false, error: err.message };
  }
}