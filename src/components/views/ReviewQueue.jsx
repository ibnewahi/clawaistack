import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ShieldAlert, PlusCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logAuditEntry } from '../../lib/auditLogger';

export default function ReviewQueue() {
  const [queueItems, setQueueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Helper to show a clean toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Fetch pending items from Supabase on mount
  useEffect(() => {
    fetchReviewQueue();
  }, []);

  const fetchReviewQueue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('action_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        const saved = localStorage.getItem('claw_review_queue');
        if (saved) {
          try { setQueueItems(JSON.parse(saved)); } catch (e) { /* fallback */ }
        } else {
          setQueueItems([
            {
              id: '1',
              agent_name: 'Bookkeeper Claw',
              action_type: 'Categorize Expense',
              payload: { vendor: 'AWS Cloud Hosting', amount: '$450.00', category: 'Software Infrastructure' },
              confidence_score: 0.88,
              created_at: new Date().toISOString()
            }
          ]);
        }
      } else {
        setQueueItems(data);
      }
    } catch (err) {
      console.error('Error fetching review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (item, decision) => {
    setProcessingId(item.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();

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
        showToast(`Failed to record audit log: ${result.error}`, 'error');
        return;
      }

      const { error: updateError } = await supabase
        .from('action_queue')
        .update({ status: decision })
        .eq('id', item.id);

      if (updateError) {
        console.warn('Could not update queue row in DB:', updateError.message);
      }

      setQueueItems(prev => prev.filter(q => q.id !== item.id));
      localStorage.setItem('claw_review_queue', JSON.stringify(queueItems.filter(q => q.id !== item.id)));
      
      showToast(`Action successfully ${decision} and recorded to audit trail!`, 'success');

    } catch (err) {
      console.error('Unexpected error:', err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleTestLog = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('action_queue')
        .insert([
          {
            agent_name: 'Test Claw',
            action_type: 'Manual Low-Confidence Test',
            payload: { vendor: 'Test Vendor Inc.', amount: '$250.00', category: 'Testing' },
            confidence_score: 0.84,
            status: 'pending',
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      showToast('Test pending item added to Review Queue!', 'success');
      fetchReviewQueue();
    } catch (err) {
      showToast(`Error adding test item: ${err.message}`, 'error');
    }
  };

  return (
    <div className="relative rounded-2xl border border-zinc-800 bg-[#13151b] p-6 shadow-xl space-y-6">
      
      {/* Toast Notification Banner */}
      {toast.show && (
        <div className={`absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-medium shadow-2xl transition-all duration-300 animate-fade-in ${
          toast.type === 'error' 
            ? 'bg-red-500/10 border-red-500/30 text-red-400' 
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle className="h-4 w-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

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
            <PlusCircle className="h-3.5 w-3.5" /> Sim. Low-Confidence Item
          </button>
          <span className="text-xs font-mono bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded-full border border-yellow-500/20">
            {queueItems.length} Items Pending
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500 text-sm">Loading review queue...</div>
      ) : queueItems.length === 0 ? (
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
                    Confidence: {Math.round((item.confidence_score || 0.85) * 100)}%
                  </span>
                </div>
                <div className="mt-2 text-sm text-zinc-200 font-mono">
                  {item.payload?.vendor || 'Transaction'} — <span className="text-emerald-400">{item.payload?.amount || '$0.00'}</span> ({item.payload?.category || item.payload?.po_match || 'Review Required'})
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