import { logAuditEntry } from './auditLogger';
import { supabase } from './supabase';

export async function runAgentAutonomousTask({ agentName, taskType, payload, confidenceScore = 0.95 }) {
  try {
    // Define your threshold for autonomous approval (e.g., 90%)
    const CONFIDENCE_THRESHOLD = 0.90;
    const needsReview = confidenceScore < CONFIDENCE_THRESHOLD;

    // Determine status based on confidence
    const executionStatus = needsReview ? 'pending_review' : 'success';

    // 1. Log the execution attempt into the immutable audit trail
    const result = await logAuditEntry({
      userId: null, // System / background execution
      agentName: agentName,
      actionType: taskType,
      status: executionStatus,
      previousState: null,
      newState: payload,
      confidenceScore: confidenceScore
    });

    if (!result.success) {
      console.error(`Failed to log autonomous execution for ${agentName}:`, result.error);
      return { success: false, error: result.error };
    }

    // 2. If confidence is below threshold, automatically push to the Review Queue table
    if (needsReview) {
      const { error: queueError } = await supabase
        .from('action_queue')
        .insert([
          {
            agent_name: agentName,
            task_type: taskType,
            payload: payload,
            confidence_score: confidenceScore,
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ]);

      if (queueError) {
        console.error('Failed to insert item into Review Queue:', queueError);
      } else {
        console.warn(`Low confidence score (${confidenceScore}) detected for ${agentName}. Routed to Review Queue.`);
      }
    }

    return { 
      success: true, 
      requiresReview: needsReview, 
      data: result.data 
    };

  } catch (err) {
    console.error('Agent dispatcher exception:', err);
    return { success: false, error: err.message };
  }
}