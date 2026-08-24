import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AIClawCard from '../components/AIClawCard';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Claws mapped with your exact tier logic and explicit feature badges
const DEFAULT_CLAWS = [
  {
    id: 'bookkeeper-claw',
    name: 'Bookkeeper Claw',
    description: 'Transaction categorization and standard reconciliation workflows for solo operations.',
    features: ['Transaction Categorization', 'Standard Reconciliation', 'Basic Cash Alerts', '30-Day Ledger History'],
    status: 'active',
    tasksToday: 0,
    lastRun: '5 hrs ago',
    requiredTier: 'Starter', // Available on Starter, Business, and CFO Tier
  },
  {
    id: 'ar-collector-claw',
    name: 'AR Collector Claw',
    description: 'Automated invoice follow-ups and collections management for growing teams.',
    features: ['Automated Email Actions', 'Invoice Follow-up Triggers', 'Collections Pipeline Tracking'],
    status: 'active',
    tasksToday: 8,
    lastRun: '1 hr ago',
    requiredTier: 'Business', // Unlocked on Business and CFO Tier
  },
  {
    id: 'ap-claw',
    name: 'AP Claw',
    description: 'Vendor bill processing and 3-way matching synced with accounting integrations.',
    features: ['Vendor Bill Processing', '3-Way Matching', 'API & Accounting Sync'],
    status: 'active',
    tasksToday: 5,
    lastRun: '30 mins ago',
    requiredTier: 'Business', // Unlocked on Business and CFO Tier
  },
  {
    id: 'cfo-claw',
    name: 'CFO Claw',
    description: 'Advanced financial forecasting, runway insights, and multi-agent workflow triggers.',
    features: ['Financial Forecasting', 'Runway Insights', 'Custom Multi-Agent Workflows'],
    status: 'active',
    tasksToday: 14,
    lastRun: '12 mins ago',
    requiredTier: 'CFO Tier', // Exclusive to CFO Tier
  },
  {
    id: 'controller-claw',
    name: 'Controller Claw',
    description: 'Enterprise-grade anomaly detection, compliance checks, and audit-ready exports.',
    features: ['Anomaly Detection', 'Compliance Oversight', 'Audit-Ready Data Exports'],
    status: 'action-needed',
    tasksToday: 3,
    lastRun: 'Just now',
    requiredTier: 'CFO Tier', // Exclusive to CFO Tier
  },
];

export default function ClawsPage() {
  const [claws, setClaws] = useState(DEFAULT_CLAWS);
  const [userTier, setUserTier] = useState('Starter');
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch user's active subscription tier from user_profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('tier')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('Error fetching user tier:', profileError);
          } else if (profileData && profileData.tier) {
            setUserTier(profileData.tier);
          }

          // Fetch custom claw configurations if stored in DB
          const { data: clawData, error: clawError } = await supabase
            .from('claws_config')
            .select('*')
            .eq('user_id', user.id);

          if (!clawError && clawData && clawData.length > 0) {
            setClaws((prevClaws) =>
              prevClaws.map((defaultClaw) => {
                const found = clawData.find((c) => c.id === defaultClaw.id);
                if (found) {
                  return {
                    ...defaultClaw,
                    status: found.status?.toLowerCase() === 'active' ? 'active' : 'idle',
                    tasksToday: found.tasks_today ?? defaultClaw.tasksToday,
                    lastRun: found.last_run || defaultClaw.lastRun,
                  };
                }
                return defaultClaw;
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

    fetchUserData();
  }, []);

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
                  name={claw.name}
                  description={claw.description}
                  features={claw.features}
                  status={claw.status}
                  tasksToday={claw.tasksToday}
                  requiredTier={claw.requiredTier}
                  userTier={userTier}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}