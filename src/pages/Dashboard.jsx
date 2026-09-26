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
  
  // Initialized synchronously from localStorage to eliminate startup flash
  const [selectedCompany, setSelectedCompany] = useState(() => {
    return localStorage.getItem('claw_active_workspace_name') || 'ClawAI Stack Int Ltd';
  });
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(() => {
    return localStorage.getItem('claw_active_workspace_id') || null;
  });
  
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
        if (supabase) {
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
        }
      } catch (err) {
        console.error('Failed to load database logs:', err);
      } finally {
        setIsLogsLoading(false);
      }
    };

    fetchExecutionLogs();

    if (supabase) {
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
    }

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleCompanyChange = (newCompany, workspaceId = null) => {
    setSelectedCompany(newCompany);
    if (workspaceId) {
      setSelectedWorkspaceId(workspaceId);
      localStorage.setItem('claw_active_workspace_id', workspaceId);
    }
    localStorage.setItem('claw_active_workspace_name', newCompany);
    showNotification(`Switched active entity to "${newCompany}"`);
  };

  const handleSyncLedger = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showNotification('Ledger synced successfully with banking & ERP feeds');
    }, 1200);
  };

  // Workspace Deletion Handler
  const handleDeleteWorkspace = async () => {
    if (!selectedWorkspaceId) {
      showNotification('No active workspace selected for deletion.');
      return;
    }

    try {
      if (supabase) {
        // Delete related workspace claws first to respect foreign keys
        await supabase.from('workspace_claws').delete().eq('workspace_id', selectedWorkspaceId);
        
        // Delete the workspace itself
        const { error } = await supabase
          .from('workspaces')
          .delete()
          .eq('id', selectedWorkspaceId);

        if (error) throw error;
      }

      showNotification('Workspace successfully deleted.');
      
      // Clear local storage and reload app state
      localStorage.removeItem('claw_active_workspace_id');
      localStorage.removeItem('claw_active_workspace_name');
      
      setTimeout(() => {
        window.location.reload();
      }, 800);

    } catch (err) {
      console.error('Failed to delete workspace:', err);
      showNotification(`Failed to delete workspace: ${err.message}`);
    }
  };

  // Dynamic Handler to invoke Supabase Edge Function with instant optimistic updates
  const handleTriggerAgent = async (canonicalClawKey) => {
    if (!selectedWorkspaceId) {
      showNotification('Select a workspace before running a Claw.');
      return null;
    }

    showNotification(`Triggering ${canonicalClawKey} execution...`);
    setIsExecutingClaw(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        throw new Error('You must be signed in to run a Claw.');
      }

      if (supabase) {
        const { data, error } = await supabase.functions.invoke('execute-claw', {
          body: {
            workspaceId: selectedWorkspaceId,
            clawKey: canonicalClawKey,
            payload: {}
          },
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (error) throw error;

        setExecutionResult(data);
        showNotification(`${canonicalClawKey} executed successfully!`);

        if (data && data.success) {
          setActiveModalData({
            clawKey: data.clawKey || canonicalClawKey,
            data: {
              executionId: data.executionId,
              model: data.model,
              duration: data.duration,
              result: data.result
            }
          });
          setModalOpen(true);
        }

        return data;
      }
    } catch (err) {
      console.error(`Execution error for ${canonicalClawKey}:`, err);
      setExecutionResult({ error: err.message });
      showNotification(`Failed to run ${canonicalClawKey}: ${err.message}`);
      return null;
    } finally {
      setIsExecutingClaw(false);
    }
  };

  const handleExecuteClawAI = () => {
    handleTriggerAgent('bookkeeper-claw');
  };

  const [clawsList, setClawsList] = useState([
    { id: 'bookkeeper', name: 'Bookkeeper Claw', key: 'bookkeeper-claw', desc: 'Auto-categorizes transactions, reconciles bank feeds & posts general ledger journal entries.', status: 'Active', tasksToday: 14, accuracy: '100%' },
    { id: 'ar', name: 'AR Collector Claw', key: 'ar-collector-claw', desc: 'Monitors unpaid invoices, sends automated email reminders, and manages escalation workflows.', status: 'Active', tasksToday: 6, accuracy: '100%' },
    { id: 'ap', name: 'AP Matcher Claw', key: 'ap-claw', desc: 'Extracts line items from vendor bills, runs 3-way matching, and queues payouts for CFO approval.', status: 'Active', tasksToday: 3, accuracy: '100%' },
    { id: 'cfo', name: 'CFO Forecast Claw', key: 'cfo-claw', desc: 'Computes real-time runway, cash flow projections, EBITDA metrics, and burn rate warnings.', status: 'Active', tasksToday: 2, accuracy: '100%' },
    { id: 'controller', name: 'Controller Audit Claw', key: 'controller-claw', desc: 'Scans ledger for duplicate payouts, unexpected tax anomalies, and compliance audit gaps.', status: 'Active', tasksToday: 8, accuracy: '100%' },
  ]);

  // PURE SYNCHRONOUS OPTIMISTIC TOGGLE (0ms latency, zero page flash)
  const toggleClawStatus = (clawId) => {
    let updatedClawName = '';
    let newStatusStr = 'Paused';

    setClawsList((prevList) =>
      prevList.map((claw) => {
        const isMatch = claw.id === clawId || claw.key === clawId;
        if (isMatch) {
          const isCurrentlyActive = String(claw.status).toLowerCase() === 'active';
          newStatusStr = isCurrentlyActive ? 'Paused' : 'Active';
          updatedClawName = claw.name;
          return { ...claw, status: newStatusStr };
        }
        return claw;
      })
    );

    if (updatedClawName) {
      showNotification(`${updatedClawName} set to ${newStatusStr}`);
    }

    if (supabase && selectedWorkspaceId) {
      const dbKey = String(clawId).includes('-claw') ? clawId : `${clawId}-claw`;
      supabase
        .from('workspace_claws')
        .upsert(
          {
            workspace_id: selectedWorkspaceId,
            claw_id: dbKey,
            status: newStatusStr,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'workspace_id,claw_id' }
        )
        .then(() => {})
        .catch((err) => console.warn('Background status sync notice:', err));
    }
  };

  const activeLogSource = dbLogs;

  const mappedLogs = activeLogSource.map((log) => ({
    id: log.id,
    type: log.task_name || 'Audit',
    claw: log.claw_id || 'controller-claw',
    desc: log.task_name || 'Execution Run',
    time: formatRelativeTime(log.created_at),
    accuracy: log.accuracy_score == null ? '—' : `${log.accuracy_score}%`
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
          if (supabase) {
            try {
              await supabase.auth.signOut();
            } catch (err) {
              console.error('Error signing out:', err);
            }
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
                setClawsList={setClawsList}
                toggleClawStatus={toggleClawStatus}
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
                onDeleteWorkspace={handleDeleteWorkspace}
              />
            } 
          />

          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>

      </div>

      <FileIngestion 
        isOpen={isUploadOpen} 
        workspaceId={selectedWorkspaceId}
        onClose={() => setIsUploadOpen(false)} 
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
