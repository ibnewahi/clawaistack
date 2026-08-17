import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Bot, Play, Pause, RefreshCw, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function ClawsPage() {
  const [claws, setClaws] = useState([
    {
      id: 'cfo-claw',
      name: 'CFO Claw',
      role: 'Financial Forecasting & Runway Insights',
      status: 'Active',
      tasksToday: 14,
      accuracy: '99.4%',
      lastRun: '12 mins ago',
    },
    {
      id: 'ar-collector',
      name: 'AR Collector Claw',
      role: 'Automated Invoice Follow-ups & Collections',
      status: 'Action Needed',
      tasksToday: 8,
      accuracy: '98.1%',
      lastRun: '1 hr ago',
    },
    {
      id: 'bookkeeper',
      name: 'Bookkeeper Claw',
      role: 'Transaction Categorization & Reconciliation',
      status: 'Idle',
      tasksToday: 0,
      accuracy: '99.7%',
      lastRun: '5 hrs ago',
    },
  ]);

  const toggleStatus = (id) => {
    setClaws((prev) =>
      prev.map((claw) => {
        if (claw.id === id) {
          const nextStatus = claw.status === 'Active' ? 'Paused' : 'Active';
          return { ...claw, status: nextStatus };
        }
        return claw;
      })
    );
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

        <main className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {claws.map((claw) => (
              <div
                key={claw.id}
                className="flex items-center justify-between rounded-xl border border-surface-border bg-surface p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Bot className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-white">{claw.name}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
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
                    <p className="mt-1 text-xs text-zinc-400">{claw.role}</p>

                    <div className="mt-4 flex items-center gap-6 text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-accent" />
                        <span>Tasks today: <strong className="text-white">{claw.tasksToday}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-zinc-500" />
                        <span>Last run: <strong className="text-white">{claw.lastRun}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleStatus(claw.id)}
                    className="flex items-center gap-2 rounded-lg border border-surface-border bg-background px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-500"
                  >
                    {claw.status === 'Active' ? (
                      <>
                        <Pause className="h-3.5 w-3.5 text-amber-400" /> Pause Agent
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 text-emerald-400" /> Activate Agent
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}