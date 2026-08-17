import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Bot, ArrowUpRight, TrendingUp, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [activeClawsCount, setActiveClawsCount] = useState(3);
  const [clawsList, setClawsList] = useState([]);
  const [workspace, setWorkspace] = useState({
    name: 'ClawAI Stack Int',
    currency: 'CAD ($)',
  });
  const [arMetrics, setArMetrics] = useState({
    total: 0,
    count: 0,
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;

        // 1. Fetch workspace settings (matches user_id or null)
        let settingsQuery = supabase.from('workspace_settings').select('*');
        if (userId) {
          settingsQuery = settingsQuery.or(`user_id.eq.${userId},user_id.is.null`);
        }
        const { data: settings } = await settingsQuery.maybeSingle();

        if (settings) {
          setWorkspace({
            name: settings.workspace_name || 'ClawAI Stack Int',
            currency: settings.currency || 'CAD ($)',
          });
        }

        // 2. Fetch claws config
        let clawsQuery = supabase.from('claws_config').select('*');
        if (userId) {
          clawsQuery = clawsQuery.or(`user_id.eq.${userId},user_id.is.null`);
        }
        const { data: claws } = await clawsQuery;

        if (claws) {
          setClawsList(claws);
          const activeCount = claws.filter((c) => c.status === 'Active').length;
          if (activeCount > 0) setActiveClawsCount(activeCount);
        }

        // 3. Fetch invoices
        let invoicesQuery = supabase.from('invoices').select('amount, status');
        if (userId) {
          invoicesQuery = invoicesQuery.or(`user_id.eq.${userId},user_id.is.null`);
        }
        const { data: overdueInvoices } = await invoicesQuery;

        if (overdueInvoices) {
          const filtered = overdueInvoices.filter(inv => inv.status?.toLowerCase() === 'overdue');
          const sum = filtered.reduce((acc, inv) => acc + Number(inv.amount), 0);
          setArMetrics({
            total: sum,
            count: filtered.length,
          });
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const getCurrencySymbol = (curr) => {
    if (curr.includes('GBP')) return '£';
    if (curr.includes('EUR')) return '€';
    if (curr.includes('CAD')) return 'CA$';
    return '$';
  };

  const currencySymbol = getCurrencySymbol(workspace.currency);

  return (
    <div className="flex h-screen bg-background text-zinc-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="flex items-center justify-between border-b border-surface-border px-8 py-4 bg-surface/50 backdrop-blur">
          <div>
            <h1 className="text-xl font-bold text-white">{workspace.name}</h1>
            <p className="text-xs text-zinc-400">Real-time overview of active AI Claws & financial intelligence</p>
          </div>
        </header>

        <main className="p-8 space-y-6">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              Loading workspace dashboard...
            </div>
          ) : (
            <>
              {/* Key Metric Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-surface-border bg-surface p-5">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Active AI Claws</span>
                    <Bot className="h-4 w-4 text-accent" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">{activeClawsCount} / 3</span>
                    <span className="text-xs text-emerald-400 flex items-center gap-0.5">
                      <ArrowUpRight className="h-3 w-3" /> Live
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-surface-border bg-surface p-5">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Cash Runway</span>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">8.4 Months</span>
                    <span className="text-xs text-emerald-400">+1.2 mo</span>
                  </div>
                </div>

                <div className="rounded-xl border border-surface-border bg-surface p-5">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Overdue AR Collected</span>
                    <span className="text-xs font-bold text-accent">{currencySymbol}</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">
                      {currencySymbol}{arMetrics.total.toLocaleString()}
                    </span>
                    <span className="text-xs text-emerald-400">{arMetrics.count} Invoices</span>
                  </div>
                </div>

                <div className="rounded-xl border border-surface-border bg-surface p-5">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Autonomous Tasks</span>
                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">22 Today</span>
                    <span className="text-xs text-zinc-400">100% Accuracy</span>
                  </div>
                </div>
              </div>

              {/* Active Agents Summary Section */}
              <div className="rounded-xl border border-surface-border bg-surface p-6">
                <h2 className="text-sm font-semibold text-white mb-4">Autonomous Claws Status Summary</h2>
                <div className="space-y-3">
                  {clawsList.map((claw) => (
                    <div key={claw.id} className="flex items-center justify-between py-2 border-b border-surface-border/50 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${claw.status === 'Active' ? 'bg-emerald-400' : 'bg-zinc-500'}`}></span>
                        <span className="font-medium text-white">{claw.name}</span>
                      </div>
                      <span className="text-zinc-400">{claw.role}</span>
                      <span className={claw.status === 'Active' ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
                        {claw.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}