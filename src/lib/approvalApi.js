import { supabase } from './supabase';

const requestFailed = () => new Error('Request failed');

export async function listReviewQueue({ workspaceId, pageSize = 20 }) {
  if (typeof workspaceId !== 'string' || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
    throw requestFailed();
  }

  const { data, error } = await supabase.functions.invoke('approval-admin', {
    body: {
      action: 'list-review-queue',
      workspaceId,
      pageSize,
    },
  });

  if (error || !data || !Array.isArray(data.items) ||
    (data.nextCursor !== null && data.nextCursor !== undefined && typeof data.nextCursor !== 'object')) {
    throw requestFailed();
  }

  return {
    items: data.items,
    nextCursor: data.nextCursor ?? null,
  };
}

export async function decideApproval({ workspaceId, approvalRequestId, approvalStepId, decision }) {
  if (typeof workspaceId !== 'string' || typeof approvalRequestId !== 'string' ||
    typeof approvalStepId !== 'string' || (decision !== 'APPROVED' && decision !== 'REJECTED')) {
    throw requestFailed();
  }

  const { data, error } = await supabase.functions.invoke('approval-admin', {
    body: {
      action: 'decide',
      workspaceId,
      approvalRequestId,
      approvalStepId,
      decision,
    },
  });

  if (error || !data || data.success !== true || typeof data.approvalDecisionId !== 'string' ||
    typeof data.approvalStepStatus !== 'string' || typeof data.approvalRequestStatus !== 'string' ||
    typeof data.idempotentReplay !== 'boolean') {
    throw requestFailed();
  }

  return data;
}
