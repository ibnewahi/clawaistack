import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Bot, ArrowUpRight, TrendingUp, CheckCircle2, Loader2, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeClawsCount, setActiveClawsCount] = useState(0);
  const [totalClawsCount, setTotalClawsCount] = useState(0);
  const [clawsList, setClawsList] = useState([]);
  const [workspace, setWorkspace] = useState({
    name: 'ClawAI Stack Int',
    currency: 'CAD ($)',
  });
  const [arMetrics, setArMetrics] = useState({
    total: 0,
    count: 0,
  });
  const [financialMetrics, setFinancialMetrics] = useState({
    cashBalance: 0,
    netBurn: 0,
    currentRatio: 0,
    quickRatio: 0,
    ebitda: 0,
    grossMargin: 0,
  });
  const [executionLogs, setExecutionLogs] = useState([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Safe user check: verify session first without breaking navigation if pending
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          // If session is truly missing, gracefully redirect or let auth handle it
          setLoading(false);
          return;
        }

        const userId = session.user?.id;

        // 1. Fetch workspace settings
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
          setActiveClawsCount(activeCount);
          setTotalClawsCount(claws.length);
        }

        // 3. Fetch overdue invoices (AR Metrics)
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

        // 4. Fetch Cash Flow metrics
        let cashQuery = supabase.from('cash_flow_records').select('*').order('created_at', { ascending: false }).limit(1);
        if (userId) cashQuery = cashQuery.or(`user_id.eq.${userId},user_id.is.null`);
        const { data: cashData } = await cashQuery;
        if (cashData && cashData.length > 0) {
          setFinancialMetrics(prev => ({
            ...prev,
            cashBalance: cashData[0].cash_balance || 0,
            netBurn: cashData[0].net_burn || 0,
          }));
        }

        // 5. Fetch Working Capital metrics
        let wcQuery = supabase.from('working_capital_metrics').select('*').order('created_at', { ascending: false }).limit(1);
        if (userId) wcQuery = wcQuery.or(`user_id.eq.${userId},user_id.is.null`);
        const { data: wcData } = await wcQuery;
        if (wcData && wcData.length > 0) {
          setFinancialMetrics(prev => ({
            ...prev,
            currentRatio: wcData[0].current_ratio || 0,
            quickRatio: wcData[0].quick_ratio || 0,
          }));
        }

        // 6. Fetch Profitability metrics
        let profQuery = supabase.from('profitability_metrics').select('*').order('created_at', { ascending: false }).limit(1);
        if (userId) profQuery = profQuery.or(`user_id.eq.${userId},user_id.is.null`);
        const { data: profData } = await profQuery;
        if (profData && profData.length > 0) {
          setFinancialMetrics(prev => ({
            ...prev,
            ebitda: profData[0].ebitda || 0,
            grossMargin: profData[0].gross_margin_pct || 0,
          }));
        }

        // 7. Fetch Claw Execution Logs
        let logsQuery = supabase.from('claw_execution_logs').select('*').order('created_at', { ascending: false }).limit(5);
        if (userId) logsQuery = logsQuery.or(`user_id.eq.${userId},user_id.is.null`);
        const { data: logsData } = await logsQuery;
        if (logsData) {
          setExecutionLogs(logsData);
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
    if (!curr) return '$';
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
                    <span className="text-2xl font-bold text-white">
                      {activeClawsCount} / {totalClawsCount || 5}
                    </span>
                    <span className="text-xs text-emerald-400 flex items-center gap-0.5">
                      <ArrowUpRight className="h-3 w-3" /> Live
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-surface-border bg-surface p-5">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Cash Balance & Net Burn</span>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">
                      {currencySymbol}{financialMetrics.cashBalance.toLocaleString()}
                    </span>
                    <span className="text-xs text-rose-400">
                      {currencySymbol}{financialMetrics.netBurn.toLocaleString()} net
                    </span>
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
                    <span>Liquidity & EBITDA</span>
                    <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-white">
                      {financialMetrics.currentRatio}x CR
                    </span>
                    <span className="text-xs text-emerald-400">
                      EBITDA: {currencySymbol}{financialMetrics.ebitda.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Secondary Advanced Metrics Grid */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-surface-border bg-surface p-5">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Liquidity Ratios</h3>
                  <div className="flex justify-between items-center py-2 border-b border-surface-border/50 text-xs">
                    <span className="text-zinc-300">Current Ratio</span>
                    <span className="font-bold text-white">{financialMetrics.currentRatio}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 text-xs">
                    <span className="text-zinc-300">Quick Ratio (Acid-Test)</span>
                    <span className="font-bold text-white">{financialMetrics.quickRatio}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-surface-border bg-surface p-5">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Profitability Health</h3>
                  <div className="flex justify-between items-center py-2 border-b border-surface-border/50 text-xs">
                    <span className="text-zinc-300">Gross Margin %</span>
                    <span className="font-bold text-emerald-400">{financialMetrics.grossMargin}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 text-xs">
                    <span className="text-zinc-300">Monthly EBITDA</span>
                    <span className="font-bold text-white">{currencySymbol}{financialMetrics.ebitda.toLocaleString()}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-surface-border bg-surface p-5">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Autonomous Task Health</h3>
                  <div className="flex justify-between items-center py-2 border-b border-surface-border/50 text-xs">
                    <span className="text-zinc-300">Tasks Today</span>
                    <span className="font-bold text-white">22 Executed</span>
                  </div>
                  <div className="flex justify-between items-center py-2 text-xs">
                    <span className="text-zinc-300">System Accuracy</span>
                    <span className="font-bold text-emerald-400">100%</span>
                  </div>
                </div>
              </div>

              {/* Active Agents Summary Section */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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

                <div className="rounded-xl border border-surface-border bg-surface p-6">
                  <h2 className="text-sm font-semibold text-white mb-4">Recent Claw Execution Logs</h2>
                  <div className="space-y-3">
                    {executionLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between py-2 border-b border-surface-border/50 text-xs">
                        <div className="flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 text-accent" />
                          <span className="font-medium text-white">{log.claw_id}</span>
                        </div>
                        <span className="text-zinc-400 truncate max-w-[150px]">{log.task_name}</span>
                        <span className="text-emerald-400 font-semibold">{log.accuracy_score}% Accuracy</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}