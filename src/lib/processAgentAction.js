import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function handleAgentAction(userId, agentName, actionType, payload, confidenceScore) {
  const AUTO_EXECUTE_THRESHOLD = 0.95;

  if (confidenceScore >= AUTO_EXECUTE_THRESHOLD) {
    // 1. Execute the action immediately (e.g., push to Odoo/Zoho or update ledger)
    const executionResult = await executeLedgerAction(payload);

    // 2. Log to immutable audit trail as auto-executed
    await logToAuditTrail({
      userId,
      agentName,
      actionType,
      status: 'auto_executed',
      payload,
      confidenceScore
    });

    return { status: 'success', executed: true, message: 'Action executed autonomously.' };
  } else {
    // Queue for human controller review
    const { data, error } = await supabase
      .from('action_queue')
      .insert([
        {
          user_id: userId,
          agent_name: agentName,
          action_type: actionType,
          payload: payload,
          confidence_score: confidenceScore,
          status: 'pending'
        }
      ])
      .select();

    if (error) throw new Error(error.message);

    return { status: 'success', executed: false, message: 'Confidence below threshold. Queued for human review.' };
  }
}

async function executeLedgerAction(payload) {
  // Placeholder for Odoo / Zoho API integration call
  console.log('Syncing transaction to ledger...', payload);
  return true;
}

async function logToAuditTrail(logData) {
  await supabase.from('ledger_audit_logs').insert([
    {
      user_id: logData.userId,
      agent_name: logData.agentName,
      action_type: logData.actionType,
      status: logData.status,
      new_state: logData.payload,
      confidence_score: logData.confidenceScore
    }
  ]);
}