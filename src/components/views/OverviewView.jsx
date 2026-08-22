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
  Settings
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function OverviewView({ 
  selectedCompany, 
  hideMetrics, 
  handleTriggerAgent, 
  clawsList, 
  toggleClawStatus, 
  logFilter, 
  setLogFilter, 
  filteredLogs,
  showNotification 
}) {
  // State to track which claw's 3-dot dropdown menu is open
  const [openMenuId, setOpenMenuId] = useState(null);

  // Dynamic state for Autonomous Task Health KPI
  const [taskHealth, setTaskHealth] = useState({
    tasksToday: filteredLogs.length || 0,
    accuracy: '100%'
  });

  // Fetch real-time total execution count & average accuracy score from Supabase
  const fetchRealtimeTaskHealth = async () => {
    try {
      const { data, error } = await supabase
        .from('claw_execution_logs')
        .select('accuracy_score');

      if (!error && data) {
        const totalTasks = data.length;
        const avgAccuracy = totalTasks > 0
          ? (data.reduce((acc, row) => acc + (row.accuracy_score || 100), 0) / totalTasks).toFixed(0)
          : 100;

        setTaskHealth({
          tasksToday: totalTasks,
          accuracy: `${avgAccuracy}%`
        });
      }
    } catch (err) {
      console.error('Error fetching task health:', err);
    }
  };

  useEffect(() => {
    fetchRealtimeTaskHealth();

    // Subscribe to live inserts on claw_execution_logs table
    const channel = supabase
      .channel('overview_task_health_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'claw_execution_logs' },
        () => {
          fetchRealtimeTaskHealth();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-6" onClick={() => setOpenMenuId(null)}>
      {/* Workspace Title & Quick Agent Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-5">
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
              onClick={() => handleTriggerAgent(agent)}
              className="px-2.5 py-1 bg-[#13151b] border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 text-zinc-300 text-[11px] font-medium rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <span className="text-emerald-400 text-[10px]">▷</span>
              <span>{agent}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Collapsible Key KPI Metrics */}
      {!hideMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
          <div className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-4">
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-zinc-400">Active AI Claws</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400"><Zap className="h-3.5 w-3.5" /></span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">5 / 5</span>
              <span className="text-[10px] font-medium text-emerald-400 flex items-center"><ArrowUpRight className="h-3 w-3" /> Live</span>
            </div>
          </div>

          <div className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-4">
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-zinc-400">Cash Balance & Net Burn</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400"><TrendingUp className="h-3.5 w-3.5" /></span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">£115,000</span>
              <span className="text-xs font-mono text-rose-400">-£13,000 net</span>
            </div>
          </div>

          <div className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-4">
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-zinc-400">Overdue AR Collected</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400"><DollarSign className="h-3.5 w-3.5" /></span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">£0</span>
              <span className="text-xs font-mono text-zinc-500">0 Invoices</span>
            </div>
          </div>

          <div className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-4">
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-zinc-400">Liquidity & EBITDA</span>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400"><ShieldCheck className="h-3.5 w-3.5" /></span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">2.42x CR</span>
              <span className="text-xs font-mono text-emerald-400">EBITDA: £14,500</span>
            </div>
          </div>
        </div>
      )}

      {/* Financial Health Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-4">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Liquidity Ratios</span>
          <div className="text-xs text-zinc-300 mt-1 flex gap-4">
            <span>Current Ratio: <strong className="text-white font-mono">2.42</strong></span>
            <span>Quick Ratio: <strong className="text-white font-mono">2.17</strong></span>
          </div>
        </div>

        <div className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-4">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Profitability Health</span>
          <div className="text-xs text-zinc-300 mt-1 flex gap-4">
            <span>Gross Margin: <strong className="text-emerald-400 font-mono">75%</strong></span>
            <span>Monthly EBITDA: <strong className="text-white font-mono">£14,500</strong></span>
          </div>
        </div>

        <div className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-4">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Autonomous Task Health</span>
          <div className="text-xs text-zinc-300 mt-1 flex gap-4">
            <span>Tasks Today: <strong className="text-white font-mono">{taskHealth.tasksToday} Executed</strong></span>
            <span>Accuracy: <strong className="text-emerald-400 font-mono">{taskHealth.accuracy}</strong></span>
          </div>
        </div>
      </div>

      {/* Grid: Claws Status Summary & Execution Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Autonomous Claws Status Summary
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  5/5 Active
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">Toggle autonomous execution rules and manual overrides.</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {clawsList.map((claw) => (
              <div key={claw.id} className="p-3 bg-[#181a22] border border-zinc-800/80 rounded-xl flex items-center justify-between hover:border-zinc-700 transition relative">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{claw.name}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">{claw.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${
                    claw.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {claw.status}
                  </span>
                  
                  {/* 3-Dot Menu Button & Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={(e) => toggleMenu(e, claw.id)} 
                      className="text-zinc-500 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800/80 transition cursor-pointer"
                      title="Options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {openMenuId === claw.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-[#13151b] border border-zinc-800 rounded-xl shadow-2xl z-20 py-1.5 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          onClick={() => {
                            handleTriggerAgent(claw.name);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800/70 hover:text-emerald-400 flex items-center gap-2 transition cursor-pointer"
                        >
                          <Play className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Run Manually Now</span>
                        </button>
                        <button
                          onClick={() => {
                            if (showNotification) showNotification(`Opening execution logs for ${claw.name}`);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800/70 hover:text-emerald-400 flex items-center gap-2 transition cursor-pointer"
                        >
                          <FileText className="h-3.5 w-3.5 text-zinc-400" />
                          <span>View Execution Logs</span>
                        </button>
                        <button
                          onClick={() => {
                            toggleClawStatus(claw.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800/70 hover:text-amber-400 flex items-center gap-2 transition cursor-pointer border-t border-zinc-800/60 mt-1 pt-2"
                        >
                          <Settings className="h-3.5 w-3.5 text-amber-400" />
                          <span>{claw.status === 'Active' ? 'Pause Claw' : 'Activate Claw'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Recent Claw Execution Logs
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">⚡ Real-time</span>
            </h3>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {['All', 'Reconciliation', 'AR Follow-up', '3-Way Match', 'Forecasts', 'Audit'].map((filter) => (
              <button
                key={filter}
                onClick={() => setLogFilter(filter)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                  logFilter === filter ? 'bg-emerald-500 text-black font-semibold' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-3 bg-[#181a22] border border-zinc-800/80 rounded-xl flex items-center justify-between hover:border-zinc-700 transition">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-xs font-mono text-emerald-400">{log.claw}</span>
                    <p className="text-[11px] text-zinc-300">{log.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 font-mono block">{log.time}</span>
                  <span className="text-[10px] font-mono text-emerald-400">{log.accuracy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}