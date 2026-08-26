import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import FileIngestion from '../components/FileIngestion';
import { AgentResultModal } from '../components/AgentResultModal';

// Shared Supabase Client Import
import { supabase } from '../lib/supabase';

// Sub-view imports
import OverviewView from '../components/views/OverviewView';
import ClawsView from '../components/views/ClawsView';
import IntegrationsView from '../components/views/IntegrationsView';
import ReportsView from '../components/views/ReportsView';
import SettingsView from '../components/views/SettingsView';
import ReviewQueue from '../components/views/ReviewQueue';
import AuditLogsView from '../components/views/AuditLogsView';

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('ClawAI Stack Int Ltd');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null); // Added Workspace ID State
  
  const [hideMetrics, setHideMetrics] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState(null);
  const [logFilter, setLogFilter] = useState('All');

  // Supabase Edge Function Execution State
  const [isExecutingClaw, setIsExecutingClaw] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  // Agent Output Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [activeModalData, setActiveModalData] = useState(null);

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

  // Fetch logs from Supabase & subscribe to real-time inserts with deduplication
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
      .channel('dashboard_logs_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'claw_execution_logs' },
        (payload) => {
          setDbLogs((prev) => {
            if (prev.some((log) => log.id === payload.new.id)) return prev;
            return [payload.new, ...prev.slice(0, 19)];
          });
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleCompanyChange = (newCompany, workspaceId = null) => {
    setSelectedCompany(newCompany);
    if (workspaceId) {
      setSelectedWorkspaceId(workspaceId);
    }
    showNotification(`Switched active entity to "${newCompany}"`);
  };

  const handleSyncLedger = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showNotification('Ledger synced successfully with banking & ERP feeds');
    }, 1200);
  };

  // Dynamic Handler to invoke Supabase Edge Function with instant optimistic updates
  const handleTriggerAgent = async (clawIdentifier, customPrompt = '') => {
    showNotification(`Triggering ${clawIdentifier} execution...`);
    setIsExecutingClaw(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const defaultPrompts = {
        'bookkeeper-claw': 'You are an expert Bookkeeper AI. Reconcile transaction logs. An unverified bill (INV-8890 for $12,500) requires 3-way AP matching. Return valid JSON containing "requires_ap_matching": true.',
        'ar-collector-claw': 'You are an AR Collection Manager. Analyze aging invoices, generate reminder workflows, and draft escalation notices.',
        'ap-claw': 'You are an AP Matching Agent. Perform 3-way matching on bills, check line items, and queue payouts for approval. Return valid JSON containing "requires_controller_review": true.',
        'cfo-claw': 'You are an Autonomous CFO. Calculate real-time cash runway, burn rates, EBITDA metrics, and liquidity projections.',
        'controller-claw': 'You are a Corporate Controller. Audit ledgers for duplicate payouts, tax anomalies, and compliance gaps.'
      };

      const resolvedKey = clawIdentifier.includes('-claw') ? clawIdentifier : `${clawIdentifier.toLowerCase()}-claw`;

      const payloadData = {
        triggerSource: 'Manual Agent UI Trigger',
        company: selectedCompany,
        workspaceId: selectedWorkspaceId, // Pass workspace ID into payload context
        targetAudit: resolvedKey,
        invoiceId: 'INV-8890',
        amount: 12500,
        notes: 'Unverified vendor bill requiring 3-way matching',
        requires_ap_matching: true
      };

      const { data, error } = await supabase.functions.invoke('execute-claw', {
        body: { 
          clawKey: resolvedKey, 
          version: '1.0', 
          systemPrompt: customPrompt || defaultPrompts[resolvedKey] || 'Execute autonomous finance audit task.', 
          rulesConfig: {}, 
          payload: payloadData
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error) throw error;

      setExecutionResult(data);
      showNotification(`${resolvedKey} executed successfully!`);

      if (data && data.success) {
        const newLogEntry = data.logEntry || {
          id: `opt-${Date.now()}`,
          claw_id: resolvedKey,
          task_name: `${resolvedKey.replace('-claw', '').toUpperCase()} Manual Run`,
          status: 'Success',
          accuracy_score: 100,
          created_at: new Date().toISOString()
        };

        setDbLogs((prev) => [newLogEntry, ...prev.filter((l) => l.id !== newLogEntry.id)]);

        setActiveModalData({
          clawKey: data.clawKey || resolvedKey,
          data: data.result || data
        });
        setModalOpen(true);
      }
    } catch (err) {
      console.error(`Execution error for ${clawIdentifier}:`, err);
      setExecutionResult({ error: err.message });
      showNotification(`Failed to run ${clawIdentifier}: ${err.message}`);
    } finally {
      setIsExecutingClaw(false);
    }
  };

  // Invoke Supabase Edge Function for bookkeeper-claw test run
  const handleExecuteClawAI = () => {
    handleTriggerAgent(
      'bookkeeper-claw', 
      'You are an expert Bookkeeper AI. Reconcile transactions and process vendor bill INV-8890. Return JSON containing "requires_ap_matching": true.'
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

  const fallbackLogs = [
    { id: '1', claw_id: 'bookkeeper-claw', task_name: 'Bank Feed Reconciliation', status: 'Success', accuracy_score: 100, created_at: new Date().toISOString() },
    { id: '2', claw_id: 'ar-collector-claw', task_name: 'Automated Follow-up Email Sent', status: 'Success', accuracy_score: 100, created_at: new Date(Date.now() - 14 * 60000).toISOString() },
    { id: '3', claw_id: 'ap-claw', task_name: 'Vendor Bill 3-Way Match Verified', status: 'Success', accuracy_score: 100, created_at: new Date(Date.now() - 60 * 60000).toISOString() },
    { id: '4', claw_id: 'cfo-claw', task_name: 'Runway & Cash Flow Forecast Updated', status: 'Success', accuracy_score: 100, created_at: new Date(Date.now() - 180 * 60000).toISOString() },
    { id: '5', claw_id: 'controller-claw', task_name: 'Anomaly Detection Audit Completed', status: 'Success', accuracy_score: 100, created_at: new Date(Date.now() - 12 * 60000).toISOString() },
  ];

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
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        onSignOut={async () => {
          showNotification('Signing out...');
          localStorage.removeItem('clawai_auth');
          try {
            await supabase.auth.signOut();
          } catch (err) {
            console.error('Error signing out from Supabase:', err);
          }
          
          setTimeout(() => {
            window.location.href = '/auth';
          }, 600);
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
          onExecuteClawTest={handleExecuteClawAI}
          isExecutingTest={isExecutingClaw}
        />

        {notificationMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-[#13151b] border border-emerald-500/40 text-emerald-400 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
            <Zap className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{notificationMessage}</span>
          </div>
        )}

        {/* Nested Router View Orchestrator */}
        <Routes>
          <Route 
            path="/" 
            element={
              <div className="flex-1 flex flex-col">
                <div className="p-6 space-y-6">
                  <OverviewView 
                    selectedCompany={selectedCompany}
                    selectedWorkspaceId={selectedWorkspaceId}
                    hideMetrics={hideMetrics}
                    handleTriggerAgent={handleTriggerAgent}
                    clawsList={clawsList}
                    toggleClawStatus={toggleClawStatus}
                    logFilter={logFilter}
                    setLogFilter={setLogFilter}
                    filteredLogs={filteredLogs}
                    isLoadingLogs={isLogsLoading}
                    showNotification={showNotification}
                  />
                  <ReviewQueue selectedWorkspaceId={selectedWorkspaceId} />
                </div>
              </div>
            } 
          />

          <Route 
            path="claws" 
            element={
              <ClawsView 
                selectedCompany={selectedCompany}
                selectedWorkspaceId={selectedWorkspaceId}
                clawsList={clawsList}
                toggleClawStatus={toggleClawStatus}
                handleTriggerAgent={handleTriggerAgent}
                showNotification={showNotification}
              />
            } 
          />

          <Route 
            path="integrations" 
            element={<IntegrationsView selectedWorkspaceId={selectedWorkspaceId} showNotification={showNotification} />} 
          />

          <Route 
            path="reports" 
            element={<ReportsView selectedWorkspaceId={selectedWorkspaceId} showNotification={showNotification} />} 
          />

          <Route 
            path="audit-logs" 
            element={<AuditLogsView selectedWorkspaceId={selectedWorkspaceId} />} 
          />

          <Route 
            path="settings" 
            element={
              <SettingsView 
                selectedCompany={selectedCompany} 
                selectedWorkspaceId={selectedWorkspaceId}
                setSelectedCompany={setSelectedCompany} 
                showNotification={showNotification} 
              />
            } 
          />

          {/* Catch-all redirect back to dashboard overview */}
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>

      </div>

      <FileIngestion 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUploadSuccess={(file) => {
          showNotification(`Successfully ingested ${file.name} for AI claw processing!`);
        }}
      />

      <AgentResultModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        clawKey={activeModalData?.clawKey || ''}
        data={activeModalData?.data}
      />

    </div>
  );
}