import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AIClawCard from '../components/AIClawCard';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DEFAULT_CLAWS = [
  {
    id: 'bookkeeper-claw',
    name: 'Bookkeeper Claw',
    description: 'Transaction categorization and standard reconciliation workflows for solo operations.',
    features: ['Transaction Categorization', 'Standard Reconciliation', 'Basic Cash Alerts', '30-Day Ledger History'],
    status: 'paused',
    tasksToday: 0,
    lastRun: '5 hrs ago',
    requiredTier: 'Starter',
  },
  {
    id: 'ar-collector-claw',
    name: 'AR Collector Claw',
    description: 'Automated invoice follow-ups and collections management for growing teams.',
    features: ['Automated Email Actions', 'Invoice Follow-up Triggers', 'Collections Pipeline Tracking'],
    status: 'paused',
    tasksToday: 8,
    lastRun: '1 hr ago',
    requiredTier: 'Business',
  },
  {
    id: 'ap-claw',
    name: 'AP Claw',
    description: 'Vendor bill processing and 3-way matching synced with accounting integrations.',
    features: ['Vendor Bill Processing', '3-Way Matching', 'API & Accounting Sync'],
    status: 'paused',
    tasksToday: 5,
    lastRun: '30 mins ago',
    requiredTier: 'Business',
  },
  {
    id: 'cfo-claw',
    name: 'CFO Claw',
    description: 'Advanced financial forecasting, runway insights, and multi-agent workflow triggers.',
    features: ['Financial Forecasting', 'Runway Insights', 'Custom Multi-Agent Workflows'],
    status: 'paused',
    tasksToday: 14,
    lastRun: '12 mins ago',
    requiredTier: 'CFO Tier',
  },
  {
    id: 'controller-claw',
    name: 'Controller Claw',
    description: 'Enterprise-grade anomaly detection, compliance checks, and audit-ready exports.',
    features: ['Anomaly Detection', 'Compliance Oversight', 'Audit-Ready Data Exports'],
    status: 'paused',
    tasksToday: 3,
    lastRun: 'Just now',
    requiredTier: 'CFO Tier',
  },
];

export default function ClawsPage({ currentWorkspaceId }) {
  const [claws, setClaws] = useState(DEFAULT_CLAWS);
  const [userTier, setUserTier] = useState('Starter');
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [resolvedWorkspaceId, setResolvedWorkspaceId] = useState(null);

  useEffect(() => {
    async function fetchUserDataAndClaws() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch User Tier
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (profileData && profileData.tier) {
            setUserTier(profileData.tier);
          }
        } catch (pErr) {
          console.warn('Profiles lookup fallback:', pErr);
        }

        // 2. Resolve Workspace ID (props -> localStorage -> Supabase default)
        let activeWsId = currentWorkspaceId || localStorage.getItem('claw_active_workspace_id');

        if (!activeWsId) {
          const { data: wsData } = await supabase
            .from('workspaces')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();

          if (wsData?.id) {
            activeWsId = wsData.id;
            localStorage.setItem('claw_active_workspace_id', wsData.id);
          }
        }

        setResolvedWorkspaceId(activeWsId);

        // 3. Fetch Claws status if workspace ID exists
        if (activeWsId) {
          const { data: dbClaws, error } = await supabase
            .from('workspace_claws')
            .select('*')
            .eq('workspace_id', activeWsId);

          if (!error && dbClaws && dbClaws.length > 0) {
            setClaws(
              DEFAULT_CLAWS.map((defaultClaw) => {
                const found = dbClaws.find((c) => c.claw_id === defaultClaw.id);
                return found
                  ? {
                      ...defaultClaw,
                      status: found.status?.toLowerCase() === 'active' ? 'active' : 'paused',
                      tasksToday: found.tasks_today ?? defaultClaw.tasksToday,
                    }
                  : defaultClaw;
              })
            );
          }
        }
      } catch (err) {
        console.error('Error loading claws and profile data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserDataAndClaws();
  }, [currentWorkspaceId]);

  const handleToggleClawStatus = async (clawId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    const activeWsId = resolvedWorkspaceId || currentWorkspaceId || localStorage.getItem('claw_active_workspace_id');

    // Optimistic UI update
    setClaws((prevClaws) =>
      prevClaws.map((c) => (c.id === clawId ? { ...c, status: nextStatus } : c))
    );

    if (activeWsId) {
      const { error } = await supabase
        .from('workspace_claws')
        .upsert(
          {
            workspace_id: activeWsId,
            claw_id: clawId,
            status: nextStatus,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'workspace_id,claw_id' }
        );

      if (error) {
        console.error('Failed to update workspace claw status in Supabase:', error);
        setClaws((prevClaws) =>
          prevClaws.map((c) => (c.id === clawId ? { ...c, status: currentStatus } : c))
        );
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#090a0f] text-zinc-100 overflow-hidden font-sans">
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        onSignOut={() => {
          supabase.auth.signOut();
          localStorage.removeItem('clawai_auth');
          window.location.href = '/auth';
        }} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="flex items-center justify-between border-b border-zinc-800/80 px-8 py-5 bg-[#13151b]/50 backdrop-blur">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Claws Management</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Configure, execute, and monitor your autonomous financial agents</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Workspace Tier:</span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              {userTier}
            </span>
          </div>
        </header>

        <main className="p-8 max-w-5xl w-full mx-auto space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-xs text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
              Loading agent permissions and statuses...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {claws.map((claw) => (
                <AIClawCard
                  key={claw.id}
                  id={claw.id}
                  name={claw.name}
                  description={claw.description}
                  features={claw.features}
                  status={claw.status}
                  tasksToday={claw.tasksToday}
                  requiredTier={claw.requiredTier}
                  userTier={userTier}
                  onToggleStatus={() => handleToggleClawStatus(claw.id, claw.status)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}