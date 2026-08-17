import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Bot, Play, Pause, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DEFAULT_CLAWS = [
  {
    id: 'bookkeeper-claw',
    name: 'Bookkeeper Claw',
    role: 'Transaction Categorization & Reconciliation',
    status: 'Active',
    tasks_today: 0,
    last_run: '5 hrs ago',
  },
  {
    id: 'ar-collector-claw',
    name: 'AR Collector Claw',
    role: 'Automated Invoice Follow-ups & Collections',
    status: 'Active',
    tasks_today: 8,
    last_run: '1 hr ago',
  },
  {
    id: 'ap-claw',
    name: 'AP Claw',
    role: 'Vendor Bill Processing & 3-Way Matching',
    status: 'Active',
    tasks_today: 5,
    last_run: '30 mins ago',
  },
  {
    id: 'cfo-claw',
    name: 'CFO Claw',
    role: 'Financial Forecasting & Runway Insights',
    status: 'Active',
    tasks_today: 14,
    last_run: '12 mins ago',
  },
  {
    id: 'controller-claw',
    name: 'Controller Claw',
    role: 'Anomaly Detection, Compliance & Audit',
    status: 'Active',
    tasks_today: 3,
    last_run: 'Just now',
  },
];

export default function ClawsPage() {
  const [claws, setClaws] = useState(DEFAULT_CLAWS);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    async function fetchClaws() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('claws_config')
            .select('*')
            .eq('user_id', user.id);

          if (error) {
            console.error('Supabase fetch error:', error);
          }

          if (data && data.length > 0) {
            // Map database records directly, matching by name or falling back cleanly
            setClaws(
              data.map((item) => ({
                id: item.id,
                name: item.name,
                role: item.role,
                status: item.status || 'Active',
                tasks_today: item.tasks_today ?? 0,
                last_run: item.last_run || 'Just now',
              }))
            );
          }
        }
      } catch (err) {
        console.error('Error loading claw configurations:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchClaws();
  }, []);

  const toggleClawStatus = async (id, currentStatus) => {
    setUpdatingId(id);
    const newStatus = currentStatus === 'Active' ? 'Idle' : 'Active';

    // Optimistic UI update
    setClaws((prev) =>
      prev.map((claw) => (claw.id === id ? { ...claw, status: newStatus } : claw))
    );

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('claws_config')
          .update({ 
            status: newStatus, 
            last_run: 'Just now', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', id)
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error('Error updating claw state:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex h-screen bg-background text-zinc-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="flex items-center justify-between border-b border-surface-border px-8 py-4 bg-surface/50 backdrop-blur">
          <div>
            <h1 className="text-xl font-bold text-white">AI Claws Management</h1>
            <p className="text-xs text-zinc-400">Configure and monitor your autonomous financial agents</p>
          </div>
        </header>

        <main className="p-8 space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              Loading AI agent statuses...
            </div>
          ) : (
            claws.map((claw) => (
              <div
                key={claw.id}
                className="flex items-center justify-between rounded-xl border border-surface-border bg-surface p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{claw.name}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          claw.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : claw.status === 'Action Needed'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-zinc-700/30 text-zinc-400 border border-zinc-700/50'
                        }`}
                      >
                        {claw.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{claw.role}</p>

                    <div className="flex items-center gap-4 mt-3 text-[11px] text-zinc-500">
                      <span>Tasks today: <strong className="text-zinc-300">{claw.tasks_today}</strong></span>
                      <span>•</span>
                      <span>Last run: <strong className="text-zinc-300">{claw.last_run}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleClawStatus(claw.id, claw.status)}
                  disabled={updatingId === claw.id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    claw.status === 'Active'
                      ? 'border-surface-border bg-background text-zinc-300 hover:text-white hover:border-zinc-500'
                      : 'border-accent bg-accent text-background hover:bg-accent/90'
                  }`}
                >
                  {updatingId === claw.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : claw.status === 'Active' ? (
                    <>
                      <Pause className="h-3.5 w-3.5" /> Pause Agent
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" /> Activate Agent
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
}