import React from 'react';
import { Cpu, Zap, Play, Pause, Plus, Lock, ChevronRight, Sparkles } from 'lucide-react';
import { compileClawPayload, executeClawFunction } from "../../lib/sopEngine";
import { runAgentAutonomousTask } from "../../lib/agentDispatcher";

const TIER_LEVELS = {
  Starter: 1,
  Growth: 2,
  Enterprise: 3,
};

// Fallback tier requirements mapped to claw keys if not explicitly provided in claw object
const DEFAULT_TIER_MAPPINGS = {
  LedgerClaw: 'Starter',
  CollectClaw: 'Growth',
  PayClaw: 'Growth',
  AuditClaw: 'Enterprise',
  InsightClaw: 'Enterprise',
};

export default function ClawsView({ 
  selectedCompany, 
  clawsList = [], 
  toggleClawStatus, 
  handleTriggerAgent, 
  showNotification,
  currentWorkspaceTier = 'Starter',
  onUpgradeClick
}) {
  const userTierLevel = TIER_LEVELS[currentWorkspaceTier] || 1;

  const handleUpgradeAction = (requiredTier, clawName) => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else if (showNotification) {
      showNotification(`Upgrade to ${requiredTier} Plan to unlock ${clawName}`);
    }
  };

  const handleRunOverride = async (clawKey, clawName) => {
    try {
      if (showNotification) {
        showNotification(`Compiling SOP & invoking ${clawName}...`);
      }

      // 1. Compile SOP prompt and system rules payload
      const payload = await compileClawPayload(clawKey, {
        triggerSource: 'Manual Dashboard Override',
        company: selectedCompany,
        timestamp: new Date().toISOString()
      });

      console.log(`[SOP Engine Payload Compiled - ${clawKey}]:`, payload);

      // 2. Invoke live Supabase Edge Function backed by Groq LLM
      const result = await executeClawFunction(payload);
      console.log(`[Edge Function Response - ${clawKey}]:`, result);

      // 3. Automatically record execution to your immutable audit log trail
      await runAgentAutonomousTask({
        agentName: clawName,
        taskType: `Manual Override Execution (${clawKey})`,
        payload: { company: selectedCompany, response: result },
        confidenceScore: 0.98
      });

      if (showNotification) {
        showNotification(`Successfully executed & logged ${clawName}!`);
      }

      // 4. Notify parent workspace or callback handler if defined
      if (handleTriggerAgent) {
        handleTriggerAgent(clawName, result);
      }
    } catch (err) {
      console.error(`Execution failed for ${clawKey}:`, err);
      if (showNotification) {
        showNotification(`Failed to execute ${clawName}: ${err.message || 'Unknown error'}`);
      }
    }
  };

  return (
    <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="border-b border-zinc-800/60 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
              <Cpu className="h-6 w-6 text-emerald-400" />
              Autonomous AI Claws Center
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {currentWorkspaceTier} Plan
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Configure parameters, prompt rules, and execution thresholds for {selectedCompany}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {currentWorkspaceTier !== 'Enterprise' && (
            <button 
              onClick={() => handleUpgradeAction('Enterprise', 'higher tier Claws')}
              className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Upgrade Tier</span>
            </button>
          )}

          <button 
            onClick={() => showNotification && showNotification("New custom Claw builder triggered")} 
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Claw</span>
          </button>
        </div>
      </div>

      {/* Claws Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clawsList.map((claw) => {
          const requiredTier = claw.requiredTier || DEFAULT_TIER_MAPPINGS[claw.key] || 'Starter';
          const requiredLevel = TIER_LEVELS[requiredTier] || 1;
          const isLocked = userTierLevel < requiredLevel;

          return (
            <div 
              key={claw.id || claw.key} 
              className={`bg-[#13151b] border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all duration-200 ${
                isLocked 
                  ? 'border-zinc-800/60 opacity-80 bg-[#13151b]/60' 
                  : 'border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl border ${
                    isLocked 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-500' 
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    <Zap className="h-5 w-5" />
                  </div>

                  {/* Status Toggle OR Gatekeeping Lock Tag */}
                  {isLocked ? (
                    <div className="px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                      <Lock className="h-3 w-3" />
                      <span>{requiredTier} Tier</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => toggleClawStatus && toggleClawStatus(claw.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 cursor-pointer ${
                        claw.status === 'Active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {claw.status === 'Active' ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3 fill-current" />}
                      <span>{claw.status}</span>
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">{claw.name}</h3>
                  </div>
                  <p className="text-[10px] font-mono text-emerald-400/80">{claw.key}</p>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{claw.desc || claw.description}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Tasks Executed Today:</span>
                  <span className="font-mono text-white font-semibold">{isLocked ? '—' : claw.tasksToday}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Accuracy Score:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{isLocked ? '—' : claw.accuracy}</span>
                </div>

                {/* Execution Override OR Upgrade Lock Trigger */}
                {isLocked ? (
                  <button 
                    onClick={() => handleUpgradeAction(requiredTier, claw.name)}
                    className="w-full py-2 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Upgrade to {requiredTier} to Unlock</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button 
                    onClick={() => handleRunOverride(claw.key, claw.name)}
                    className="w-full py-2 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 text-zinc-200 hover:text-emerald-400 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Run Execution Manual Override</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}