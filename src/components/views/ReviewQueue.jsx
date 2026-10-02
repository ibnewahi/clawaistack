import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, ShieldAlert, XCircle } from 'lucide-react';
import { decideApproval, listReviewQueue } from '../../lib/approvalApi';

export default function ReviewQueue({ selectedWorkspaceId }) {
  const [queueItems, setQueueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const mountedRef = useRef(true);
  const selectedWorkspaceRef = useRef(selectedWorkspaceId);
  const requestGenerationRef = useRef(0);

  selectedWorkspaceRef.current = selectedWorkspaceId;

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((previous) => ({ ...previous, show: false }));
    }, 4000);
  };

  const isCurrentRequest = useCallback((workspaceId, generation) => (
    mountedRef.current &&
    selectedWorkspaceRef.current === workspaceId &&
    requestGenerationRef.current === generation
  ), []);

  const loadQueue = useCallback(async (workspaceId, showLoading = false) => {
    const generation = ++requestGenerationRef.current;

    if (showLoading && isCurrentRequest(workspaceId, generation)) {
      setQueueItems([]);
      setLoadError(false);
      setLoading(true);
    }

    try {
      const { items } = await listReviewQueue({ workspaceId, pageSize: 20 });
      if (!isCurrentRequest(workspaceId, generation)) return false;

      setQueueItems(items);
      setLoadError(false);
      return true;
    } catch {
      if (isCurrentRequest(workspaceId, generation)) {
        setQueueItems([]);
        setLoadError(true);
      }
      throw new Error('Request failed');
    } finally {
      if (showLoading && isCurrentRequest(workspaceId, generation)) setLoading(false);
    }
  }, [isCurrentRequest]);

  useEffect(() => {
    if (!selectedWorkspaceId) {
      ++requestGenerationRef.current;
      setQueueItems([]);
      setLoadError(false);
      setLoading(false);
      return;
    }

    loadQueue(selectedWorkspaceId, true).catch(() => {});
  }, [loadQueue, selectedWorkspaceId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      ++requestGenerationRef.current;
    };
  }, []);

  const handleDecision = async (item, decision) => {
    if (!selectedWorkspaceId || processingId) return;

    const decisionWorkspaceId = selectedWorkspaceId;
    const decisionGeneration = requestGenerationRef.current;
    setProcessingId(item.approvalRequestId);
    try {
      await decideApproval({
        workspaceId: decisionWorkspaceId,
        approvalRequestId: item.approvalRequestId,
        approvalStepId: item.activeStepId,
        decision,
      });

      if (!mountedRef.current || selectedWorkspaceRef.current !== decisionWorkspaceId) return;

      try {
        const refreshed = await loadQueue(decisionWorkspaceId);
        if (refreshed) {
          showToast(decision === 'APPROVED' ? 'Approval recorded.' : 'Rejection recorded.', 'success');
        }
      } catch {
        if (isCurrentRequest(decisionWorkspaceId, requestGenerationRef.current)) {
          showToast('Decision recorded, but the queue could not be refreshed.', 'error');
        }
      }
    } catch {
      if (isCurrentRequest(decisionWorkspaceId, decisionGeneration)) {
        showToast('Unable to record this decision. Please try again.', 'error');
      }
    } finally {
      if (mountedRef.current) setProcessingId(null);
    }
  };

  if (!selectedWorkspaceId) {
    return <div className="rounded-2xl border border-zinc-800 bg-[#13151b] p-6 text-sm text-zinc-400">No workspace selected</div>;
  }

  return (
    <div className="relative space-y-6 rounded-2xl border border-zinc-800 bg-[#13151b] p-6 shadow-xl">
      {toast.show && (
        <div className={`absolute right-4 top-4 z-50 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium shadow-2xl transition-all duration-300 animate-fade-in ${
          toast.type === 'error'
            ? 'border-red-500/30 bg-red-500/10 text-red-400'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle className="h-4 w-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-yellow-500/20 bg-yellow-500/10 text-yellow-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Pending Controller Reviews</h2>
            <p className="text-xs text-zinc-400">Approval requests requiring your review</p>
          </div>
        </div>
        <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 font-mono text-xs text-yellow-400">
          {queueItems.length} Items Pending
        </span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-zinc-500">Loading review queue...</div>
      ) : loadError ? (
        <div className="py-12 text-center text-sm text-zinc-500">Unable to load the review queue. Please try again.</div>
      ) : queueItems.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-500">No approval requests are currently available for your review.</div>
      ) : (
        <div className="space-y-4">
          {queueItems.map((item) => {
            const isProcessing = processingId === item.approvalRequestId;
            return (
              <div key={item.approvalRequestId} className="flex flex-col items-start justify-between gap-4 rounded-xl border border-zinc-800 bg-[#090a0f] p-4 sm:flex-row sm:items-center">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400">{item.actionType}</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-xs text-zinc-300">{item.status}</span>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-400">{item.activeStepStatus}</span>
                  </div>
                  <div className="text-sm text-zinc-200">
                    <span className="text-zinc-500">Target:</span> {item.targetType || 'Not specified'}{item.targetId ? ` · ${item.targetId}` : ''}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                    <span>Submitted: {item.submittedAt}</span>
                    {item.expiresAt && <span>Expires: {item.expiresAt}</span>}
                    <span>Step {item.activeStepOrder}: {item.activeStepName}</span>
                    <span>Approvals: {item.approvedDecisionCount} / {item.requiredApprovals}</span>
                    {item.independentApprovalRequired && <span>Independent review required</span>}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    disabled={Boolean(processingId)}
                    onClick={() => handleDecision(item, 'APPROVED')}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> {isProcessing ? 'Recording...' : 'Approve'}
                  </button>
                  <button
                    disabled={Boolean(processingId)}
                    onClick={() => handleDecision(item, 'REJECTED')}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
