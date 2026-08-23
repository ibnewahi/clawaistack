import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ShieldAlert, PlusCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logAuditEntry } from '../../lib/auditLogger';

export default function ReviewQueue() {
  const [queueItems, setQueueItems] = useState(() => {
    const saved = localStorage.getItem('claw_review_queue');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [
      {
        id: '1',
        agent_name: 'Bookkeeper Claw',
        action_type: 'Categorize Expense',
        payload: { vendor: 'AWS Cloud Hosting', amount: '$450.00', category: 'Software Infrastructure' },
        confidence_score: 0.88,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        agent_name: 'AP Claw',
        action_type: '3-Way Match Invoice #9402',
        payload: { vendor: 'Stripe Processing', amount: '$1,250.00', po_match: 'Partial' },
        confidence_score: 0.82,
        created_at: new Date().toISOString()
      }
    ];
  });

  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    localStorage.setItem('claw_review_queue', JSON.stringify(queueItems));
  }, [queueItems]);

  const handleAction = async (item, decision) => {
    setProcessingId(item.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Use our updated dual-table logger utility
      const result = await logAuditEntry({
        userId: user ? user.id : null,
        agentName: item.agent_name,
        actionType: item.action_type,
        status: decision,
        previousState: null,
        newState: item.payload,
        confidenceScore: item.confidence_score
      });

      if (!result.success) {
        alert(`Failed to record audit log: ${result.error}`);
        return;
      }

      // Success - remove from queue permanently
      setQueueItems(prev => prev.filter(q => q.id !== item.id));
      alert('Audit log recorded successfully to both tables!');

    } catch (err) {
      console.error('Unexpected error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleTestLog = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const result = await logAuditEntry({
        userId: user ? user.id : null,
        agentName: 'Test Claw',
        actionType: 'Manual Test Execution',
        status: 'approved',
        previousState: null,
        newState: { message: 'Testing dual-table audit log insertion', amount: '$500.00' },
        confidence_score: 0.95
      });

      if (result.success) {
        alert('Test audit log successfully recorded to both tables!');
        window.location.reload(); // Refresh to see it in audit logs view
      } else {
        alert(`Failed to record: ${result.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#13151b] p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Pending Controller Reviews</h2>
            <p className="text-xs text-zinc-400">AI actions requiring human-in-the-loop verification</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTestLog}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" /> Trigger Test Audit Log
          </button>
          <span className="text-xs font-mono bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded-full border border-yellow-500/20">
            {queueItems.length} Items Pending
          </span>
        </div>
      </div>

      {queueItems.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 text-sm">
          All AI actions have been successfully reviewed and logged!
        </div>
      ) : (
        <div className="space-y-4">
          {queueItems.map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-[#090a0f] border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400">{item.agent_name}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-xs text-zinc-300">{item.action_type}</span>
                  <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                    Confidence: {Math.round(item.confidence_score * 100)}%
                  </span>
                </div>
                <div className="mt-2 text-sm text-zinc-200 font-mono">
                  {item.payload.vendor || 'Transaction'} — <span className="text-emerald-400">{item.payload.amount || '$0.00'}</span> ({item.payload.category || item.payload.po_match || 'Verified'})
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  disabled={processingId === item.id}
                  onClick={() => handleAction(item, 'approved')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  disabled={processingId === item.id}
                  onClick={() => handleAction(item, 'rejected')}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}