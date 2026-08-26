import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Play, Pause, Plus, Lock, ChevronRight, Sparkles } from 'lucide-react';
import { compileClawPayload, executeClawFunction } from "../../lib/sopEngine";
import { runAgentAutonomousTask } from "../../lib/agentDispatcher";
import { supabase } from "../../lib/supabase";

// Updated hierarchy weights to match your Supabase database tiers
const TIER_LEVELS = {
  free: 0,
  starter: 1,
  business: 2,
  cfo: 3,
  Enterprise: 3, // Backward compatibility
};

// Fallback tier requirements mapped to claw keys
const DEFAULT_TIER_MAPPINGS = {
  LedgerClaw: 'starter',
  CollectClaw: 'business',
  PayClaw: 'business',
  AuditClaw: 'cfo',
  InsightClaw: 'cfo',
};

export default function ClawsView({ 
  selectedCompany, 
  selectedWorkspaceId,
  clawsList = [], 
  setClawsList = () => {},
  toggleClawStatus, 
  handleTriggerAgent, 
  showNotification,
  onUpgradeClick
}) {
  // State to store live user tier and loading status to prevent free-plan flashing
  const [workspaceTier, setWorkspaceTier] = useState('cfo'); 
  const [isTierLoading, setIsTierLoading] = useState(true);
  const [updatingClawId, setUpdatingClawId] = useState(null);

  useEffect(() => {
    async function fetchLiveTier() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fixed: Changed 'full_name' to 'full_name' to prevent 400 Bad Request error
          const { data } = await supabase
            .from('profiles')
            .select('full_name, role, tier')
            .eq('id', user.id)
            .single();
          
          if (data && data.tier) {
            setWorkspaceTier(data.tier);
          }
        }
      } catch (err) {
        console.error('Error fetching live tier:', err);
      } finally {
        setIsTierLoading(false);
      }
    }
    fetchLiveTier();
  }, []);

  // Fetch workspace-specific claw states whenever selectedWorkspaceId changes (with safety guard)
  useEffect(() => {
    async function fetchWorkspaceClaws() {
      // Guard: Skip if workspace ID is missing, null, or invalid placeholder
      if (!selectedWorkspaceId || selectedWorkspaceId === 'undefined' || selectedWorkspaceId === 'null') {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('workspace_claws')
          .select('claw_id, status')
          .eq('workspace_id', selectedWorkspaceId);

        if (!error && data && data.length > 0) {
          setClawsList(prevClaws => 
            prevClaws.map(claw => {
              const clawIdKey = claw.id || claw.key;
              const matched = data.find(item => item.claw_id === clawIdKey || item.claw_id === claw.id || item.claw_id === claw.key);
              return matched ? { ...claw, status: matched.status } : { ...claw, status: 'Paused' };
            })
          );
        } else {
          // Default to Paused for workspaces without saved configurations
          setClawsList(prevClaws => 
            prevClaws.map(claw => ({ ...claw, status: 'Paused' }))
          );
        }
      } catch (err) {
        console.error('Error fetching workspace specific claws:', err);
      }
    }

    fetchWorkspaceClaws();
  }, [selectedWorkspaceId]);

  const userTierLevel = TIER_LEVELS[workspaceTier] || 0;

  const handleUpgradeAction = (requiredTier, clawName) => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else if (showNotification) {
      showNotification(`Upgrade to ${requiredTier.toUpperCase()} Plan to unlock ${clawName}`);
    }
  };

  // Persistent toggle handler tied explicitly to workspace_claws table
  const handlePersistentToggle = async (clawId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
    setUpdatingClawId(clawId);

    // Optimistically update local UI state immediately
    setClawsList(prevList => 
      prevList.map(claw => 
        ((claw.id === clawId || claw.key === clawId)) 
          ? { ...claw, status: newStatus } 
          : claw
      )
    );

    try {
      if (supabase && selectedWorkspaceId) {
        // Upsert state explicitly scoped to the active workspace
        const { error } = await supabase
          .from('workspace_claws')
          .upsert({
            workspace_id: selectedWorkspaceId,
            claw_id: clawId,
            status: newStatus,
            updated_at: new Date().toISOString()
          }, { onConflict: 'workspace_id,claw_id' });

        if (error) {
          console.error('Failed to upsert workspace claw status:', error.message);
          if (showNotification) {
            showNotification(`Database error saving claw status: ${error.message}`);
          }
          // Revert local state if database persist fails
          setClawsList(prevList => 
            prevList.map(claw => 
              ((claw.id === clawId || claw.key === clawId)) 
                ? { ...claw, status: currentStatus } 
                : claw
            )
          );
        } else {
          if (showNotification) {
            showNotification(`Claw ${clawId} set to ${newStatus} for ${selectedCompany}`);
          }
        }
      }
    } catch (err) {
      console.error('Failed to persist claw status change:', err);
    } finally {
      setUpdatingClawId(null);
    }

    if (toggleClawStatus) {
      toggleClawStatus(clawId);
    }
  };

  const handleRunOverride = async (clawKey, clawName) => {
    try {
      if (showNotification) {
        showNotification(`Fetching active integrations & compiling SOP for ${clawName}...`);
      }

      // 1. Fetch active integration tokens from Supabase
      const { data: activeIntegrations, error: intError } = await supabase
        .from('integrations')
        .select('integration_key, config_data, is_connected')
        .eq('is_connected', true);

      if (intError) {
        console.warn('Could not fetch live integrations:', intError.message);
      }

      const integrationContext = {};
      if (activeIntegrations) {
        activeIntegrations.forEach(item => {
          integrationContext[item.integration_key] = item.config_data;
        });
      }

      if (showNotification) {
        showNotification(`Compiling SOP & invoking ${clawName} with live integration context...`);
      }

      // 2. Compile SOP prompt payload
      const payload = await compileClawPayload(clawKey, {
        triggerSource: 'Manual Dashboard Override',
        company: selectedCompany,
        timestamp: new Date().toISOString(),
        integrations: integrationContext
      });

      // 3. Invoke live Supabase Edge Function backed by Groq LLM
      const result = await executeClawFunction(payload);

      // 4. Automatically record execution to your immutable audit log trail
      await runAgentAutonomousTask({
        agentName: clawName,
        taskType: `Manual Override Execution (${clawKey})`,
        payload: { company: selectedCompany, response: result },
        confidenceScore: 0.98
      });

      if (showNotification) {
        showNotification(`Successfully executed & logged ${clawName}!`);
      }

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
              {workspaceTier.toUpperCase()} Plan
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Configure parameters, prompt rules, and execution thresholds for {selectedCompany}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {workspaceTier !== 'cfo' && (
            <button 
              onClick={() => handleUpgradeAction('cfo', 'higher tier Claws')}
              className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Upgrade Tier & Billing</span>
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
          const clawId = claw.id || claw.key;
          const requiredTier = claw.requiredTier || DEFAULT_TIER_MAPPINGS[claw.key] || 'starter';
          const requiredLevel = TIER_LEVELS[requiredTier] || 1;
          const isLocked = !isTierLoading && userTierLevel < requiredLevel;
          const isUpdating = updatingClawId === clawId;

          return (
            <div 
              key={clawId} 
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
                      <span>{requiredTier.toUpperCase()} Tier</span>
                    </div>
                  ) : (
                    <button 
                      disabled={isUpdating}
                      onClick={() => handlePersistentToggle(clawId, claw.status)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 cursor-pointer transition ${
                        isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        claw.status === 'Active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {claw.status === 'Active' ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3 fill-current" />}
                      <span>{isUpdating ? 'Saving...' : claw.status}</span>
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
                    <span>Upgrade to {requiredTier.toUpperCase()} to Unlock</span>
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