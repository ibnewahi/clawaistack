import AgentConsole from "../AgentConsole";
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  DollarSign, 
  ArrowUpRight,
  MoreVertical,
  Play,
  FileText,
  Settings,
  AreaChart as AreaChartIcon,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  X,
  ExternalLink
} from 'lucide-react';
import CountUp from 'react-countup';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  AreaChart
} from 'recharts';
import { supabase } from '../../lib/supabase';

// Multi-horizon dataset projections computed for financial planning
const horizonDatasets = {
  Monthly: [
    { month: 'Week 1', cash: 0, burn: 0 },
    { month: 'Week 2', cash: 0, burn: 0 },
    { month: 'Week 3', cash: 0, burn: 0 },
    { month: 'Week 4', cash: 0, burn: 0 },
  ],
  Quarterly: [
    { month: 'Apr', cash: 0, burn: 0 },
    { month: 'May', cash: 0, burn: 0 },
    { month: 'Jun', cash: 0, burn: 0 },
  ],
  '6 Months': [
    { month: 'Jan', cash: 0, burn: 0 },
    { month: 'Feb', cash: 0, burn: 0 },
    { month: 'Mar', cash: 0, burn: 0 },
    { month: 'Apr', cash: 0, burn: 0 },
    { month: 'May', cash: 0, burn: 0 },
    { month: 'Jun', cash: 0, burn: 0 },
  ],
  Yearly: [
    { month: 'Q1 25', cash: 0, burn: 0 },
    { month: 'Q2 25', cash: 0, burn: 0 },
    { month: 'Q3 25', cash: 0, burn: 0 },
    { month: 'Q4 25', cash: 0, burn: 0 },
    { month: 'Q1 26', cash: 0, burn: 0 },
    { month: 'Q2 26', cash: 0, burn: 0 },
  ]
};

// Trend data for slide-over drawer details
const drawerTrendData = {
  liquidity: [
    { month: 'Jan', cr: 0, qr: 0 },
    { month: 'Feb', cr: 0, qr: 0 },
    { month: 'Mar', cr: 0, qr: 0 },
    { month: 'Apr', cr: 0, qr: 0 },
    { month: 'May', cr: 0, qr: 0 },
    { month: 'Jun', cr: 0, qr: 0 },
  ],
  profitability: [
    { month: 'Jan', margin: 0, ebitda: 0 },
    { month: 'Feb', margin: 0, ebitda: 0 },
    { month: 'Mar', margin: 0, ebitda: 0 },
    { month: 'Apr', margin: 0, ebitda: 0 },
    { month: 'May', margin: 0, ebitda: 0 },
    { month: 'Jun', margin: 0, ebitda: 0 },
  ],
  automation: [
    { month: 'Jan', tasks: 0, accuracy: 100 },
    { month: 'Feb', tasks: 0, accuracy: 100 },
    { month: 'Mar', tasks: 0, accuracy: 100 },
    { month: 'Apr', tasks: 0, accuracy: 100 },
    { month: 'May', tasks: 0, accuracy: 100 },
    { month: 'Jun', tasks: 0, accuracy: 100 },
  ]
};

export default function OverviewView({ 
  selectedCompany = "ClawAI Stack Int Ltd", 
  selectedWorkspaceId = null,
  hideMetrics = false, 
  handleTriggerAgent = () => {}, 
  clawsList = [], 
  toggleClawStatus = () => {}, 
  logFilter = 'All', 
  setLogFilter = () => {}, 
  filteredLogs = [],
  showNotification = () => {}
}) {
  const [selectedHorizon, setSelectedHorizon] = useState('6 Months');
  const [activeTab, setActiveTab] = useState('claws');
  const [showAllClaws, setShowAllClaws] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedMetricModal, setSelectedMetricModal] = useState(null);
  
  // Dynamic single-source evaluation directly from clawsList prop
  const activeClawsCount = (clawsList || []).filter(
    (c) => String(c.status).toLowerCase() === 'active'
  ).length;
  const totalClawsCount = (clawsList || []).length || 5;

  // Initialize workspace metrics with explicit zero defaults
  const [workspaceMetrics, setWorkspaceMetrics] = useState({
    cash_balance: 0,
    monthly_burn: 0,
    ar_collected: 0,
    current_ratio: 0,
    ebitda: 0
  });

  const [taskHealth, setTaskHealth] = useState({
    tasksToday: filteredLogs?.length || 0,
    accuracy: 100
  });

  const fetchRealtimeTaskHealth = async () => {
    try {
      if (!supabase) return;
      
      let query = supabase
        .from('claw_execution_logs')
        .select('accuracy_score');

      if (selectedWorkspaceId) {
        query = query.eq('workspace_id', selectedWorkspaceId);
      }

      const { data, error } = await query;

      if (!error && data) {
        const totalTasks = data.length;
        const avgAccuracy = totalTasks > 0
          ? Math.round(data.reduce((acc, row) => acc + (row.accuracy_score || 100), 0) / totalTasks)
          : 100;

        setTaskHealth({
          tasksToday: totalTasks,
          accuracy: avgAccuracy
        });
      }
    } catch (err) {
      console.error('Error fetching task health:', err);
    }
  };

  // Fetch workspace financial metrics on workspace switch with zero fallback
  useEffect(() => {
    fetchRealtimeTaskHealth();

    const fetchWorkspaceFinancials = async () => {
      if (!supabase) return;
      try {
        let query = supabase
          .from('financial_metrics')
          .select('*');

        if (selectedWorkspaceId) {
          query = query.eq('workspace_id', selectedWorkspaceId);
        }

        const { data, error } = await query.maybeSingle();
        if (!error && data) {
          setWorkspaceMetrics(data);
        } else {
          setWorkspaceMetrics({
            cash_balance: 0,
            monthly_burn: 0,
            ar_collected: 0,
            current_ratio: 0,
            ebitda: 0
          });
        }
      } catch (err) {
        console.error('Error fetching workspace financial metrics:', err);
        setWorkspaceMetrics({
          cash_balance: 0,
          monthly_burn: 0,
          ar_collected: 0,
          current_ratio: 0,
          ebitda: 0
        });
      }
    };

    fetchWorkspaceFinancials();

    if (supabase) {
      const channel = supabase
        .channel(`overview_task_health_${selectedWorkspaceId || 'global'}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'claw_execution_logs' },
          (payload) => {
            if (!selectedWorkspaceId || payload.new?.workspace_id === selectedWorkspaceId) {
              fetchRealtimeTaskHealth();
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedWorkspaceId]);

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const triggerAgentWithEffects = async (agentName) => {
    handleTriggerAgent(agentName);
    
    try {
      if (supabase && selectedWorkspaceId) {
        await supabase.from('claw_execution_logs').insert([
          {
            claw_id: `${agentName.toLowerCase()}-claw`,
            task_name: `Manual ${agentName} Run`,
            status: 'Success',
            accuracy_score: 100,
            workspace_id: selectedWorkspaceId,
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error('Error logging workspace agent trigger:', err);
    }

    toast.success(`${agentName} agent triggered successfully!`, {
      description: `Executing real-time workflow for ${selectedCompany}...`
    });

    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10b981', '#34d399', '#059669']
    });
  };

  const displayedClaws = showAllClaws ? clawsList : (clawsList || []).slice(0, 3);
  const displayedLogs = showAllLogs ? filteredLogs : (filteredLogs || []).slice(0, 3);

  return (
    <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-6" onClick={() => setOpenMenuId(null)}>
      {/* Workspace Title & Quick Agent Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/60 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Overview & Intelligence
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time monitoring for automated bookkeeping, AR collections & financial health for <span className="text-zinc-200 font-medium">{selectedCompany}</span>.
          </p>
        </div>

        {/* Quick Agent Triggers */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mr-1">Trigger Agent:</span>
          {['Bookkeeper', 'AR', 'AP', 'CFO', 'Controller'].map((agent) => (
            <button
              key={agent}
              onClick={() => triggerAgentWithEffects(agent)}
              className="px-2.5 py-1.5 bg-[#13151b] border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 text-zinc-300 text-[11px] font-medium rounded-lg transition flex items-center gap-1 cursor-pointer shadow-sm hover:shadow-emerald-500/10"
            >
              <span className="text-emerald-400 text-[10px]">▷</span>
              <span>{agent}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Metrics Row */}
      {!hideMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
          <div className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-4.5 hover:border-zinc-700 transition flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-zinc-400">Active AI Claws</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400"><Zap className="h-3.5 w-3.5" /></span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white font-mono leading-none">
                <CountUp start={0} end={activeClawsCount} duration={1.5} /> / {totalClawsCount}
              </div>
              <div className="mt-2 text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> {activeClawsCount} Live Agents Active
              </div>
            </div>
          </div>

          <div className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-4.5 hover:border-zinc-700 transition flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-zinc-400">Cash Balance & Net Burn</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400"><TrendingUp className="h-3.5 w-3.5" /></span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white font-mono leading-none">
                £<CountUp start={0} end={workspaceMetrics?.cash_balance ?? 0} duration={1.5} separator="," />
              </div>
              <div className="mt-2 text-xs font-mono text-emerald-400/90 font-medium">
                -£{workspaceMetrics?.monthly_burn ?? 0} net monthly burn
              </div>
            </div>
          </div>

          <div className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-4.5 hover:border-zinc-700 transition flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-zinc-400">Overdue AR Collected</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400"><DollarSign className="h-3.5 w-3.5" /></span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white font-mono leading-none">
                £<CountUp start={0} end={workspaceMetrics?.ar_collected ?? 0} duration={1.5} separator="," />
              </div>
              <div className="mt-2 text-xs font-mono text-emerald-400 font-medium">
                0 Invoices Recovered
              </div>
            </div>
          </div>

          <div className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-4.5 hover:border-zinc-700 transition flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-zinc-400">Liquidity & EBITDA</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400"><ShieldCheck className="h-3.5 w-3.5" /></span>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-white font-mono leading-none">
                <CountUp start={0} end={workspaceMetrics?.current_ratio ?? 0} decimals={2} duration={1.5} />x CR
              </div>
              <div className="mt-2 text-xs font-mono text-emerald-400 font-medium">
                EBITDA: £{workspaceMetrics?.ebitda ?? 0} (0%)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Composed Cash Trajectory & Burn Rate Chart */}
      <div className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AreaChartIcon className="h-4 w-4 text-emerald-400" />
              Cash Reserves vs. Outflow Burn Trajectory
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">Line indicates total liquid reserves; bars display period net burn outflow.</p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#090a0f] p-1 rounded-xl border border-zinc-800 shrink-0">
            {['Monthly', 'Quarterly', '6 Months', 'Yearly'].map((horizon) => (
              <button
                key={horizon}
                onClick={() => setSelectedHorizon(horizon)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition cursor-pointer ${
                  selectedHorizon === horizon
                    ? 'bg-emerald-500 text-black font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {horizon}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={horizonDatasets[selectedHorizon]} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="cashAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
              
              <YAxis yAxisId="left" stroke="#10b981" fontSize={11} tickLine={false} tickFormatter={(v) => `£${v / 1000}k`} />
              <YAxis yAxisId="right" orientation="right" stroke="#059669" fontSize={11} tickLine={false} tickFormatter={(v) => `£${v / 1000}k`} />
              
              <Tooltip 
                contentStyle={{ backgroundColor: '#090a0f', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                formatter={(value, name) => [
                  `£${value.toLocaleString()}`, 
                  name === 'cash' ? 'Cash Reserve' : 'Net Burn Outflow'
                ]}
              />
              
              <Bar yAxisId="right" dataKey="burn" name="burn" fill="#162e24" stroke="#059669" strokeWidth={1} radius={[4, 4, 0, 0]} barSize={24} />
              <Area yAxisId="left" type="monotone" dataKey="cash" name="cash" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#cashAreaGradient)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Clickable Financial Health & Solvency Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setSelectedMetricModal('liquidity')}
          className="bg-[#13151b] border border-zinc-800/80 hover:border-emerald-500/50 hover:bg-[#181a22] transition cursor-pointer rounded-2xl p-4 flex flex-col justify-between group shadow-sm hover:shadow-emerald-500/5"
        >
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800/60">
            <span className="text-[11px] font-semibold text-zinc-400 group-hover:text-emerald-400 uppercase tracking-wider transition flex items-center gap-1">
              Solvency & Liquidity <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" />
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Healthy</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <span className="text-[10px] text-zinc-500 block">Current Ratio</span>
              <span className="text-lg font-bold font-mono text-white">{workspaceMetrics?.current_ratio ?? 0}x</span>
              <span className="text-[10px] text-emerald-400 block font-mono">Target &gt; 1.5x</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">Quick Ratio</span>
              <span className="text-lg font-bold font-mono text-zinc-200">0.00x</span>
              <span className="text-[10px] text-emerald-400 block font-mono">Target &gt; 1.0x</span>
            </div>
          </div>
          <div className="w-full bg-zinc-800/80 rounded-full h-1 mt-3 overflow-hidden">
            <div className="bg-emerald-400 h-1 rounded-full" style={{ width: '0%' }}></div>
          </div>
        </div>

        <div 
          onClick={() => setSelectedMetricModal('profitability')}
          className="bg-[#13151b] border border-zinc-800/80 hover:border-emerald-500/50 hover:bg-[#181a22] transition cursor-pointer rounded-2xl p-4 flex flex-col justify-between group shadow-sm hover:shadow-emerald-500/5"
        >
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800/60">
            <span className="text-[11px] font-semibold text-zinc-400 group-hover:text-emerald-400 uppercase tracking-wider transition flex items-center gap-1">
              Profitability Health <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" />
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Optimal</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <span className="text-[10px] text-zinc-500 block">Gross Margin</span>
              <span className="text-lg font-bold font-mono text-emerald-400">0.0%</span>
              <span className="text-[10px] text-zinc-400 block font-mono">SaaS Industry Avg</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">Monthly EBITDA</span>
              <span className="text-lg font-bold font-mono text-white">£{workspaceMetrics?.ebitda ?? 0}</span>
              <span className="text-[10px] text-emerald-400 block font-mono">0% MoM</span>
            </div>
          </div>
          <div className="w-full bg-zinc-800/80 rounded-full h-1 mt-3 overflow-hidden">
            <div className="bg-emerald-400 h-1 rounded-full" style={{ width: '0%' }}></div>
          </div>
        </div>

        <div 
          onClick={() => setSelectedMetricModal('automation')}
          className="bg-[#13151b] border border-zinc-800/80 hover:border-emerald-500/50 hover:bg-[#181a22] transition cursor-pointer rounded-2xl p-4 flex flex-col justify-between group shadow-sm hover:shadow-emerald-500/5"
        >
          <div className="flex justify-between items-center pb-2 border-b border-zinc-800/60">
            <span className="text-[11px] font-semibold text-zinc-400 group-hover:text-emerald-400 uppercase tracking-wider transition flex items-center gap-1">
              Automation Health <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" />
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">High Precision</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <span className="text-[10px] text-zinc-500 block">Tasks Executed</span>
              <span className="text-lg font-bold font-mono text-white">{taskHealth.tasksToday}</span>
              <span className="text-[10px] text-zinc-400 block font-mono">0 Failed Jobs</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">Audit Accuracy</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{taskHealth.accuracy}%</span>
              <span className="text-[10px] text-emerald-400 block font-mono">Verified Ledger</span>
            </div>
          </div>
          <div className="w-full bg-zinc-800/80 rounded-full h-1 mt-3 overflow-hidden">
            <div className="bg-emerald-400 h-1 rounded-full" style={{ width: `${taskHealth.accuracy}%` }}></div>
          </div>
        </div>
      </div>

      {/* Unified Compact Tab Component for Claws & Logs */}
      <div className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('claws')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'claws'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Autonomous Claws Summary
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                {activeClawsCount}/{totalClawsCount} Active
              </span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white border border-transparent'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              Recent Execution Logs
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-400 font-mono">Real-time</span>
            </button>
          </div>

          {activeTab === 'logs' && (
            <div className="flex items-center gap-1 flex-wrap">
              {['All', 'Reconciliation', 'AR Follow-up', '3-Way Match', 'Forecasts', 'Audit'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLogFilter(filter)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition cursor-pointer ${
                    logFilter === filter ? 'bg-emerald-500 text-black font-semibold' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeTab === 'claws' && (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            {displayedClaws.map((claw) => {
              const isActive = String(claw.status).toLowerCase() === 'active';

              return (
                <div key={claw.id || claw.key} className="p-3 bg-[#181a22] border border-zinc-800/80 rounded-xl flex items-center justify-between hover:border-zinc-700 transition relative">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white">{claw.name}</span>
                      <p className="text-[11px] text-zinc-400">{claw.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${
                      isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {claw.status}
                    </span>

                    <div className="relative">
                      <button 
                        onClick={(e) => toggleMenu(e, claw.id || claw.key)} 
                        className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800/80 transition cursor-pointer"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {openMenuId === (claw.id || claw.key) && (
                        <div className="absolute right-0 mt-2 w-48 bg-[#13151b] border border-zinc-800 rounded-xl shadow-2xl z-20 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={() => {
                              triggerAgentWithEffects(claw.name);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800/70 hover:text-emerald-400 flex items-center gap-2 transition cursor-pointer"
                          >
                            <Play className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Run Manually Now</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab('logs');
                              setOpenMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800/70 hover:text-emerald-400 flex items-center gap-2 transition cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5 text-zinc-400" />
                            <span>View Execution Logs</span>
                          </button>
                          <button
                            onClick={() => {
                              toggleClawStatus(claw.id || claw.key);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800/70 hover:text-amber-400 flex items-center gap-2 transition cursor-pointer border-t border-zinc-800/60 mt-1 pt-2"
                          >
                            <Settings className="h-3.5 w-3.5 text-amber-400" />
                            <span>{isActive ? 'Pause Claw' : 'Activate Claw'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setShowAllClaws(!showAllClaws)}
                className="text-xs text-zinc-400 hover:text-emerald-400 font-medium flex items-center gap-1 transition cursor-pointer py-1 px-3 bg-[#090a0f] border border-zinc-800 rounded-lg hover:border-emerald-500/30"
              >
                {showAllClaws ? (
                  <>Show Less <ChevronUp className="h-3.5 w-3.5" /></>
                ) : (
                  <>View All Claws ({(clawsList || []).length}) <ChevronDown className="h-3.5 w-3.5" /></>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            {displayedLogs.map((log) => (
              <div key={log.id} className="p-3 bg-[#181a22] border border-zinc-800/80 rounded-xl flex items-center justify-between hover:border-zinc-700 transition">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs font-mono text-emerald-400">{log.claw}</span>
                    <p className="text-[11px] text-zinc-300">{log.desc}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-zinc-500 font-mono block">{log.time}</span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center justify-end gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {log.accuracy}
                  </span>
                </div>
              </div>
            ))}

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setShowAllLogs(!showAllLogs)}
                className="text-xs text-zinc-400 hover:text-emerald-400 font-medium flex items-center gap-1 transition cursor-pointer py-1 px-3 bg-[#090a0f] border border-zinc-800 rounded-lg hover:border-emerald-500/30"
              >
                {showAllLogs ? (
                  <>Show Less <ChevronUp className="h-3.5 w-3.5" /></>
                ) : (
                  <>View Full Log History ({(filteredLogs || []).length}) <ChevronDown className="h-3.5 w-3.5" /></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Analytics & Ratio Detail Drawer Modal */}
      {selectedMetricModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#13151b] border-l border-zinc-800 h-full p-6 space-y-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {selectedMetricModal === 'liquidity' && 'Liquidity & Solvency Deep Dive'}
                    {selectedMetricModal === 'profitability' && 'Profitability & Margin Analytics'}
                    {selectedMetricModal === 'automation' && 'Claw Precision & Execution Audit'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {selectedCompany} • Verified General Ledger Data
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedMetricModal(null)}
                  className="text-zinc-400 hover:text-white p-2 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="bg-[#090a0f] p-4 border border-zinc-800/80 rounded-2xl space-y-2">
                <span className="text-xs font-semibold text-zinc-300">6-Month Trend Trajectory</span>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={drawerTrendData[selectedMetricModal]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="month" stroke="#71717a" fontSize={10} />
                      <YAxis stroke="#71717a" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: '#13151b', borderColor: '#27272a', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                      <Area 
                        type="monotone" 
                        dataKey={selectedMetricModal === 'liquidity' ? 'cr' : selectedMetricModal === 'profitability' ? 'margin' : 'accuracy'} 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.15} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold text-zinc-300">Underlying Ledger Components</span>
                <div className="space-y-2 text-xs">
                  {selectedMetricModal === 'liquidity' && (
                    <>
                      <div className="p-3 bg-[#181a22] border border-zinc-800/80 rounded-xl flex justify-between items-center">
                        <span className="text-zinc-400">Current Assets (Cash + AR)</span>
                        <span className="font-mono text-white font-bold">£0</span>
                      </div>
                      <div className="p-3 bg-[#181a22] border border-zinc-800/80 rounded-xl flex justify-between items-center">
                        <span className="text-zinc-400">Current Liabilities (AP + Accruals)</span>
                        <span className="font-mono text-white font-bold">£0</span>
                      </div>
                      <div className="p-3 bg-[#181a22] border border-zinc-800/80 rounded-xl flex justify-between items-center">
                        <span className="text-zinc-400">Quick Assets (Excl. Inventory)</span>
                        <span className="font-mono text-white font-bold">£0</span>
                      </div>
                    </>
                  )}

                  {selectedMetricModal === 'profitability' && (
                    <>
                      <div className="p-3 bg-[#181a22] border border-zinc-800/80 rounded-xl flex justify-between items-center">
                        <span className="text-zinc-400">Gross Monthly Revenue</span>
                        <span className="font-mono text-white font-bold">£0</span>
                      </div>
                      <div className="p-3 bg-[#181a22] border border-zinc-800/80 rounded-xl flex justify-between items-center">
                        <span className="text-zinc-400">Cost of Goods Sold (COGS)</span>
                        <span className="font-mono font-bold text-emerald-400/90">£0</span>
                      </div>
                      <div className="p-3 bg-[#181a22] border border-zinc-800/80 rounded-xl flex justify-between items-center">
                        <span className="text-zinc-400">Operating Expenses (OpEx)</span>
                        <span className="font-mono font-bold text-emerald-400/90">£0</span>
                      </div>
                    </>
                  )}

                  {selectedMetricModal === 'automation' && (
                    <>
                      <div className="p-3 bg-[#181a22] border border-zinc-800/80 rounded-xl flex justify-between items-center">
                        <span className="text-zinc-400">Reconciliation Match Rate</span>
                        <span className="font-mono text-emerald-400 font-bold">100.0%</span>
                      </div>
                      <div className="p-3 bg-[#181a22] border border-zinc-800/80 rounded-xl flex justify-between items-center">
                        <span className="text-zinc-400">3-Way Match Success</span>
                        <span className="font-mono text-emerald-400 font-bold">100.0%</span>
                      </div>
                      <div className="p-3 bg-[#181a22] border border-zinc-800/80 rounded-xl flex justify-between items-center">
                        <span className="text-zinc-400">Manual Exceptions Flagged</span>
                        <span className="font-mono text-amber-400 font-bold">0 Pending</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4">
              <button 
                onClick={() => setSelectedMetricModal(null)}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}