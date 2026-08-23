import { useState, useEffect } from 'react';
import { Terminal, Activity, CheckCircle2, RefreshCw, Cpu, Filter } from 'lucide-react';

const allAgentLogs = [
  { id: 1, category: 'CFO Engine', agent: 'CFO Claw', action: 'Calculating 12-month cash runway projection...', status: 'complete', output: 'Runway: 18.4 Months (£115k reserve)' },
  { id: 2, category: 'AP / AR', agent: 'AP Claw', action: 'Ingesting invoice #PO-9402 via OCR...', status: 'complete', output: '3-Way Match Verified (100% accuracy)' },
  { id: 3, category: 'AP / AR', agent: 'AR Collector', action: 'Scanning unpaid ledgers for overdue balances...', status: 'active', output: 'Sent automated follow-up for £1,450' },
  { id: 4, category: 'Reconciliation', agent: 'Bookkeeper Claw', action: 'Running continuous bank feed reconciliation...', status: 'complete', output: '142 Txns Reconciled (0 Audit Errors)' },
  { id: 5, category: 'CFO Engine', agent: 'Controller Claw', action: 'Executing double-entry anomaly detection...', status: 'complete', output: 'Ledger Passed (0 Risk Flags)' },
];

const categories = ['All Logs', 'Reconciliation', 'AP / AR', 'CFO Engine'];

export default function AgentTerminal() {
  const [selectedFilter, setSelectedFilter] = useState('All Logs');
  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const [typedText, setTypedText] = useState('');

  const filteredLogs = selectedFilter === 'All Logs' 
    ? allAgentLogs 
    : allAgentLogs.filter(log => log.category === selectedFilter);

  // Cycle active logs
  useEffect(() => {
    setActiveLogIndex(0);
    const interval = setInterval(() => {
      setActiveLogIndex((prev) => (prev + 1) % (filteredLogs.length || 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedFilter]);

  // Typewriter effect for active log action
  useEffect(() => {
    const currentLog = filteredLogs[activeLogIndex];
    if (!currentLog) return;

    setTypedText('');
    let charIndex = 0;
    const textToType = currentLog.action;

    const typingInterval = setInterval(() => {
      if (charIndex < textToType.length) {
        setTypedText(textToType.substring(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 25);

    return () => clearInterval(typingInterval);
  }, [activeLogIndex, filteredLogs]);

  return (
    <section className="border-t border-zinc-800/80 px-6 py-20 bg-[#090a0f] z-10 relative">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Real-Time Engine
          </span>
          <h2 className="mt-3 text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Live AI Agent Execution Feed
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Watch how your autonomous agents process, reconcile, and audit financial data in real time.
          </p>

          {/* Filter Tabs */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-mono text-zinc-500 flex items-center gap-1 mr-2">
              <Filter className="h-3 w-3" /> Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                  selectedFilter === cat
                    ? 'bg-emerald-500 text-[#090a0f] font-bold shadow-lg shadow-emerald-500/20'
                    : 'bg-[#13151b] border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Window */}
        <div className="rounded-2xl border border-zinc-800 bg-[#13151b] shadow-2xl overflow-hidden">
          {/* Header Bar with Stats */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-zinc-800 px-4 py-3 bg-[#0c0e14] gap-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/80" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-emerald-400" /> clawai-terminal.log
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                <Cpu className="h-3 w-3 text-emerald-400" /> Latency: 12ms | Token Rate: 420 t/s
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                <Activity className="h-3 w-3 animate-pulse" /> LIVE STREAM
              </div>
            </div>
          </div>

          {/* Console Body */}
          <div className="p-6 font-mono text-xs space-y-3 bg-[#090a0f]/90 min-h-[280px] flex flex-col justify-center">
            {filteredLogs.map((log, index) => {
              const isActive = index === activeLogIndex;
              return (
                <div
                  key={log.id}
                  className={`flex items-start justify-between gap-4 p-3 rounded-lg transition-all duration-300 ${
                    isActive
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-white shadow-md'
                      : 'bg-zinc-900/40 border border-zinc-800/50 text-zinc-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {isActive ? (
                      <RefreshCw className="h-4 w-4 text-emerald-400 animate-spin shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500/60 shrink-0" />
                    )}
                    <div className="truncate">
                      <span className="text-emerald-400 font-bold mr-2">[{log.agent}]</span>
                      <span>{isActive ? typedText : log.action}</span>
                      {isActive && <span className="animate-pulse text-emerald-400 ml-0.5">_</span>}
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-400 hidden sm:inline shrink-0 font-sans font-medium">
                    {log.output}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}