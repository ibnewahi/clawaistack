import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Play, Pause, Plus, Lock, ChevronRight, Sparkles } from 'lucide-react';
import { compileClawPayload, executeClawFunction } from "../../lib/sopEngine";
import { runAgentAutonomousTask } from "../../lib/agentDispatcher";
import { supabase } from "../../lib/supabase";

const TIER_LEVELS = {
  free: 0,
  starter: 1,
  business: 2,
  cfo: 3,
  Enterprise: 3,
};

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
  const [workspaceTier, setWorkspaceTier] = useState('cfo'); 
  const [isTierLoading, setIsTierLoading] = useState(true);
  
  // Local status map to guarantee immediate UI toggle responsiveness
  const [localStatuses, setLocalStatuses] = useState({});

  // Active workspace ID with fallback to localStorage
  const activeWsId = selectedWorkspaceId || localStorage.getItem('claw_active_workspace_id');

  useEffect(() => {
    async function fetchLiveTier() {
      try {
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase
              .from('profiles')
              .select('full_name, role, tier')
              .eq('id', user.id)
              .single();
            
            if (data && data.tier) {
              setWorkspaceTier(data.tier);
            }
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

  // --- WORKSPACE SYNC LOGIC ---
  useEffect(() => {
    if (!activeWsId || activeWsId === 'undefined' || activeWsId === 'null') {
      return;
    }

    async function fetchWorkspaceClaws() {
      try {
        if (supabase) {
          const { data, error } = await supabase
            .from('workspace_claws')
            .select('claw_id, status')
            .eq('workspace_id', activeWsId);

          if (!error && data && data.length > 0) {
            const initialMap = {};
            data.forEach(item => {
              if (item.claw_id && item.status) {
                initialMap[item.claw_id] = item.status.toLowerCase() === 'active' ? 'Active' : 'Paused';
              }
            });
            setLocalStatuses(prev => ({ ...prev, ...initialMap }));

            setClawsList(prevClaws => 
              prevClaws.map(claw => {
                const matched = data.find(item => 
                  item.claw_id === claw.id || 
                  item.claw_id === claw.key || 
                  item.claw_id?.toLowerCase() === claw.key?.toLowerCase()
                );
                if (matched && matched.status) {
                  const normalizedStatus = matched.status.toLowerCase() === 'active' ? 'Active' : 'Paused';
                  return { ...claw, status: normalizedStatus };
                }
                return claw;
              })
            );
          }
        }
      } catch (err) {
        console.error('Error fetching workspace specific claws:', err);
      }
    }

    fetchWorkspaceClaws();
  }, [activeWsId, setClawsList]);

  // Real-time Workspace Subscription
  useEffect(() => {
    if (!activeWsId || activeWsId === 'undefined' || activeWsId === 'null' || !supabase) return;

    const channel = supabase
      .channel(`realtime_workspace_claws_${activeWsId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_claws',
          filter: `workspace_id=eq.${activeWsId}`,
        },
        (payload) => {
          const updatedRow = payload.new;
          if (updatedRow && updatedRow.claw_id) {
            const normalizedStatus = updatedRow.status.toLowerCase() === 'active' ? 'Active' : 'Paused';
            setLocalStatuses(prev => ({ ...prev, [updatedRow.claw_id]: normalizedStatus }));
            setClawsList((prev) =>
              prev.map((claw) => {
                const keyMatch = 
                  claw.id === updatedRow.claw_id || 
                  claw.key === updatedRow.claw_id || 
                  claw.key?.toLowerCase() === updatedRow.claw_id?.toLowerCase();
                return keyMatch ? { ...claw, status: normalizedStatus } : claw;
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeWsId, setClawsList]);
  // ----------------------------

  const userTierLevel = TIER_LEVELS[workspaceTier] || 0;

  const handleUpgradeAction = (requiredTier, clawName) => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else if (showNotification) {
      showNotification(`Upgrade to ${requiredTier.toUpperCase()} Plan to unlock ${clawName}`);
    }
  };

  // Immediate Local State Toggle & Supabase Persistence Handler
  const handlePersistentToggle = async (clawId, clawKey, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const targetClaw = clawsList.find(c => c.id === clawId || c.key === clawKey || c.key === clawId);
    if (!targetClaw) return;

    const resolvedId = targetClaw.key || clawId;
    const currentStatus = localStatuses[resolvedId] || (String(targetClaw.status).toLowerCase() === 'active' ? 'Active' : 'Paused');
    const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';

    // 1. Immediately update local override map for instant re-render
    setLocalStatuses(prev => ({ ...prev, [resolvedId]: newStatus, [clawId]: newStatus }));

    // 2. Also update parent list state if needed
    setClawsList(prev => 
      prev.map(c => (c.id === resolvedId || c.key === resolvedId || c.key === clawKey) ? { ...c, status: newStatus } : c)
    );

    if (toggleClawStatus) {
      toggleClawStatus(clawId);
    }

    // 3. Save to Supabase database in the background
    try {
      if (supabase && activeWsId) {
        const { error } = await supabase
          .from('workspace_claws')
          .upsert({
            workspace_id: activeWsId,
            claw_id: resolvedId,
            status: newStatus.toLowerCase(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'workspace_id, claw_id' });

        if (error) {
          console.error('Failed to persist claw status to Supabase:', error.message);
          if (showNotification) showNotification(`Error saving state: ${error.message}`);
        } else {
          if (showNotification) showNotification(`${targetClaw.name} is now ${newStatus}`);
        }
      }
    } catch (err) {
      console.error('Error in persistent toggle:', err);
    }
  };

  const handleRunOverride = async (clawKey, clawName) => {
    try {
      if (showNotification) {
        showNotification(`Fetching active integrations & compiling SOP for ${clawName}...`);
      }

      let integrationContext = {};
      if (supabase) {
        const { data: activeIntegrations, error: intError } = await supabase
          .from('integrations')
          .select('integration_key, config_data, is_connected')
          .eq('is_connected', true);

        if (intError) {
          console.warn('Could not fetch live integrations:', intError.message);
        } else if (activeIntegrations) {
          activeIntegrations.forEach(item => {
            integrationContext[item.integration_key] = item.config_data;
          });
        }
      }

      if (showNotification) {
        showNotification(`Compiling SOP & invoking ${clawName} with live integration context...`);
      }

      const payload = await compileClawPayload(clawKey, {
        triggerSource: 'Manual Dashboard Override',
        company: selectedCompany,
        timestamp: new Date().toISOString(),
        integrations: integrationContext
      });

      const result = await executeClawFunction(payload);

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
              type="button"
              onClick={() => handleUpgradeAction('cfo', 'higher tier Claws')}
              className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Upgrade Tier & Billing</span>
            </button>
          )}

          <button 
            type="button"
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
          
          const resolvedId = claw.key || clawId;
          const currentStatus = localStatuses[resolvedId] || localStatuses[clawId] || claw.status || 'Paused';
          const isActive = String(currentStatus).toLowerCase() === 'active';

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

                  {isLocked ? (
                    <div className="px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 select-none">
                      <Lock className="h-3 w-3" />
                      <span>{requiredTier.toUpperCase()} Tier</span>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={(e) => handlePersistentToggle(claw.id, claw.key, e)}
                      className={`relative z-10 pointer-events-auto px-3 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 cursor-pointer select-none transition ${
                        isActive 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {isActive ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3 fill-current" />}
                      <span>{isActive ? 'Active' : 'Paused'}</span>
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

                {isLocked ? (
                  <button 
                    type="button"
                    onClick={() => handleUpgradeAction(requiredTier, claw.name)}
                    className="w-full py-2 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Upgrade to {requiredTier.toUpperCase()} to Unlock</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button 
                    type="button"
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