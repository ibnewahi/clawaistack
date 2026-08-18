import React from 'react';
import { Cpu, Zap, Play, Pause, Plus } from 'lucide-react';

export default function ClawsView({ 
  selectedCompany, 
  clawsList, 
  toggleClawStatus, 
  handleTriggerAgent, 
  showNotification 
}) {
  return (
    <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-zinc-800/60 pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
            <Cpu className="h-6 w-6 text-emerald-400" />
            Autonomous AI Claws Center
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Configure parameters, prompt rules, and execution thresholds for {selectedCompany}.
          </p>
        </div>
        <button 
          onClick={() => showNotification("New custom Claw builder triggered")} 
          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Claw</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clawsList.map((claw) => (
          <div key={claw.id} className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-zinc-700 transition">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Zap className="h-5 w-5" />
                </div>
                <button 
                  onClick={() => toggleClawStatus(claw.id)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 cursor-pointer ${
                    claw.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {claw.status === 'Active' ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3 fill-current" />}
                  <span>{claw.status}</span>
                </button>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">{claw.name}</h3>
                <p className="text-[10px] font-mono text-emerald-400/80">{claw.key}</p>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{claw.desc}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800/80 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Tasks Executed Today:</span>
                <span className="font-mono text-white font-semibold">{claw.tasksToday}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Accuracy Score:</span>
                <span className="font-mono text-emerald-400 font-semibold">{claw.accuracy}</span>
              </div>

              <button 
                onClick={() => handleTriggerAgent(claw.name)}
                className="w-full py-2 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 text-zinc-200 hover:text-emerald-400 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Run Execution Manual Override</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}