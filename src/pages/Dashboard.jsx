import React, { useState, useEffect } from 'react';
import { Zap, Play, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import FileIngestion from '../components/FileIngestion';

// Sub-view imports
import OverviewView from '../components/views/OverviewView';
import ClawsView from '../components/views/ClawsView';
import IntegrationsView from '../components/views/IntegrationsView';
import ReportsView from '../components/views/ReportsView';
import SettingsView from '../components/views/SettingsView';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('ClawAI Stack Int Ltd');
  const [hideMetrics, setHideMetrics] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState(null);
  const [logFilter, setLogFilter] = useState('All');

  // Supabase Edge Function Execution State
  const [isExecutingClaw, setIsExecutingClaw] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  // Real-time Database Execution Logs State
  const [dbLogs, setDbLogs] = useState([]);
  const [isLogsLoading, setIsLogsLoading] = useState(true);

  const showNotification = (msg) => {
    setNotificationMessage(msg);
    setTimeout(() => {
      setNotificationMessage(null);
    }, 3500);
  };

  // Helper to format ISO dates into human-readable relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'Just now';
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Fetch logs from Supabase & subscribe to real-time inserts
  useEffect(() => {
    let channel;

    const fetchExecutionLogs = async () => {
      setIsLogsLoading(true);
      try {
        const { data, error } = await supabase
          .from('claw_execution_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error fetching execution logs:', error.message);
        } else if (data) {
          setDbLogs(data);
        }
      } catch (err) {
        console.error('Failed to load database logs:', err);
      } finally {
        setIsLogsLoading(false);
      }
    };

    fetchExecutionLogs();

    // Subscribe to live inserts on claw_execution_logs
    channel = supabase
      .channel('realtime_claw_execution_logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'claw_execution_logs' },
        (payload) => {
          setDbLogs((prev) => [payload.new, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleCompanyChange = (newCompany) => {
    setSelectedCompany(newCompany);
    showNotification(`Switched active entity to "${newCompany}"`);
  };

  const handleSyncLedger = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showNotification('Ledger synced successfully with banking & ERP feeds');
    }, 1200);
  };

  // Dynamic Handler to invoke Supabase Edge Function for any individual Agent
  const handleTriggerAgent = async (clawIdentifier, customPrompt = '') => {
    showNotification(`Triggering ${clawIdentifier} execution...`);
    setIsExecutingClaw(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const defaultPrompts = {
        'bookkeeper-claw': 'You are an expert Bookkeeper AI. Reconcile transaction logs, categorize GL entries, and flag unmatched items.',
        'ar-collector-claw': 'You are an AR Collection Manager. Analyze aging invoices, generate reminder workflows, and draft escalation notices.',
        'ap-claw': 'You are an AP Matching Agent. Perform 3-way matching on bills, check line items, and queue payouts for approval.',
        'cfo-claw': 'You are an Autonomous CFO. Calculate real-time cash runway, burn rates, EBITDA metrics, and liquidity projections.',
        'controller-claw': 'You are a Corporate Controller. Audit ledgers for duplicate payouts, tax anomalies, and compliance gaps.'
      };

      const resolvedKey = clawIdentifier.includes('-claw') ? clawIdentifier : `${clawIdentifier.toLowerCase()}-claw`;

      const { data, error } = await supabase.functions.invoke('execute-claw', {
        body: { 
          clawKey: resolvedKey, 
          version: '1.0', 
          systemPrompt: customPrompt || defaultPrompts[resolvedKey] || 'Execute autonomous finance audit task.', 
          rulesConfig: {}, 
          payload: { 
            triggerSource: 'Manual Agent UI Trigger', 
            company: selectedCompany,
            targetAudit: resolvedKey
          } 
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error) throw error;

      setExecutionResult(data);
      showNotification(`${resolvedKey} executed successfully!`);
    } catch (err) {
      console.error(`Execution error for ${clawIdentifier}:`, err);
      setExecutionResult({ error: err.message });
      showNotification(`Failed to run ${clawIdentifier}: ${err.message}`);
    } finally {
      setIsExecutingClaw(false);
    }
  };

  // Invoke Supabase Edge Function for manual override test banner
  const handleExecuteClawAI = () => {
    handleTriggerAgent(
      'controller-claw', 
      'You are an expert Corporate Controller and Autonomous CFO. Provide a precise JSON response detailing financial audit insights, compliance checks, and risk analysis.'
    );
  };

  const [clawsList, setClawsList] = useState([
    { id: 'bookkeeper', name: 'Bookkeeper Claw', key: 'bookkeeper-claw', desc: 'Auto-categorizes transactions, reconciles bank feeds & posts general ledger journal entries.', status: 'Active', tasksToday: 14, accuracy: '100%' },
    { id: 'ar', name: 'AR Collector Claw', key: 'ar-collector-claw', desc: 'Monitors unpaid invoices, sends automated email reminders, and manages escalation workflows.', status: 'Active', tasksToday: 6, accuracy: '100%' },
    { id: 'ap', name: 'AP Matcher Claw', key: 'ap-claw', desc: 'Extracts line items from vendor bills, runs 3-way matching, and queues payouts for CFO approval.', status: 'Active', tasksToday: 3, accuracy: '100%' },
    { id: 'cfo', name: 'CFO Forecast Claw', key: 'cfo-claw', desc: 'Computes real-time runway, cash flow projections, EBITDA metrics, and burn rate warnings.', status: 'Active', tasksToday: 2, accuracy: '100%' },
    { id: 'controller', name: 'Controller Audit Claw', key: 'controller-claw', desc: 'Scans ledger for duplicate payouts, unexpected tax anomalies, and compliance audit gaps.', status: 'Active', tasksToday: 8, accuracy: '100%' },
  ]);

  const toggleClawStatus = (id) => {
    setClawsList(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'Active' ? 'Paused' : 'Active';
        showNotification(`${c.name} status updated to ${nextStatus}`);
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  // Fallback mock dataset used if database table is empty
  const fallbackLogs = [
    { id: '1', claw_id: 'bookkeeper-claw', task_name: 'Bank Feed Reconciliation', status: 'Success', accuracy_score: 100, created_at: new Date().toISOString() },
    { id: '2', claw_id: 'ar-collector-claw', task_name: 'Automated Follow-up Email Sent', status: 'Success', accuracy_score: 100, created_at: new Date(Date.now() - 14 * 60000).toISOString() },
    { id: '3', claw_id: 'ap-claw', task_name: 'Vendor Bill 3-Way Match Verified', status: 'Success', accuracy_score: 100, created_at: new Date(Date.now() - 60 * 60000).toISOString() },
    { id: '4', claw_id: 'cfo-claw', task_name: 'Runway & Cash Flow Forecast Updated', status: 'Success', accuracy_score: 100, created_at: new Date(Date.now() - 180 * 60000).toISOString() },
    { id: '5', claw_id: 'controller-claw', task_name: 'Anomaly Detection Audit Completed', status: 'Success', accuracy_score: 100, created_at: new Date(Date.now() - 12 * 60000).toISOString() },
  ];

  // Map database entries to UI properties
  const activeLogSource = dbLogs.length > 0 ? dbLogs : fallbackLogs;

  const mappedLogs = activeLogSource.map((log) => ({
    id: log.id,
    type: log.task_name || 'Audit',
    claw: log.claw_id || 'controller-claw',
    desc: log.task_name || 'Execution Run',
    time: formatRelativeTime(log.created_at),
    accuracy: `${log.accuracy_score || 100}%`
  }));

  const filteredLogs = logFilter === 'All' 
    ? mappedLogs 
    : mappedLogs.filter(log => 
        log.type.toLowerCase().includes(logFilter.toLowerCase()) || 
        log.claw.toLowerCase().includes(logFilter.toLowerCase())
      );

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex font-sans selection:bg-emerald-500/30">
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        onSignOut={() => {
          showNotification('Signing out...');
          setTimeout(() => {
            window.location.href = '/';
          }, 800);
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        <Header 
          selectedCompany={selectedCompany}
          onCompanyChange={handleCompanyChange}
          hideMetrics={hideMetrics}
          onHideMetricsToggle={() => setHideMetrics(!hideMetrics)}
          onSync={handleSyncLedger}
          isSyncing={isSyncing}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {notificationMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#13151b] border border-emerald-500/40 text-emerald-400 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
            <Zap className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{notificationMessage}</span>
          </div>
        )}

        {/* Tab View Orchestrator */}
        {activeTab === 'Dashboard' && (
          <div className="flex-1 flex flex-col">
            {/* Edge Function Test Trigger Banner */}
            <div className="px-6 pt-6">
              <div className="bg-[#12141c] border border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
                    <Zap className="h-3.5 w-3.5" /> Supabase Edge Gateway
                  </div>
                  <h3 className="text-base font-semibold text-white">Execute-Claw Runtime Test</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Trigger live backend audit tasks via your serverless edge integration.</p>
                </div>
                <button
                  onClick={handleExecuteClawAI}
                  disabled={isExecutingClaw}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-zinc-950 font-semibold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  {isExecutingClaw ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Executing Pipeline...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-zinc-950" />
                      Test Execute-Claw
                    </>
                  )}
                </button>
              </div>

              {/* Execution Result Box */}
              {executionResult && (
                <div className="mt-4 bg-[#0d0e14] border border-zinc-800 rounded-2xl p-4 text-xs font-mono">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800 text-zinc-400">
                    <span>Response Payload</span>
                    <button 
                      onClick={() => setExecutionResult(null)} 
                      className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <pre className="text-emerald-400 whitespace-pre-wrap overflow-x-auto max-h-48">
                    {JSON.stringify(executionResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <OverviewView 
              selectedCompany={selectedCompany}
              hideMetrics={hideMetrics}
              handleTriggerAgent={handleTriggerAgent}
              clawsList={clawsList}
              toggleClawStatus={toggleClawStatus}
              logFilter={logFilter}
              setLogFilter={setLogFilter}
              filteredLogs={filteredLogs}
              isLoadingLogs={isLogsLoading}
            />
          </div>
        )}

        {activeTab === 'AI Claws' && (
          <ClawsView 
            selectedCompany={selectedCompany}
            clawsList={clawsList}
            toggleClawStatus={toggleClawStatus}
            handleTriggerAgent={handleTriggerAgent}
            showNotification={showNotification}
          />
        )}

        {activeTab === 'Integrations' && (
          <IntegrationsView showNotification={showNotification} />
        )}

        {activeTab === 'Reports' && (
          <ReportsView showNotification={showNotification} />
        )}

        {activeTab === 'Settings' && (
          <SettingsView 
            selectedCompany={selectedCompany} 
            setSelectedCompany={setSelectedCompany} 
            showNotification={showNotification} 
          />
        )}

      </div>

      <FileIngestion 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUploadSuccess={(file) => {
          showNotification(`Successfully ingested ${file.name} for AI claw processing!`);
        }}
      />

    </div>
  );
}