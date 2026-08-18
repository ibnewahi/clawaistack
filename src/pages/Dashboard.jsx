import React, { useState } from 'react';
import { Zap, FileText } from 'lucide-react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

// Sub-view imports
import OverviewView from '../components/views/OverviewView';
import ClawsView from '../components/views/ClawsView';
import IntegrationsView from '../components/views/IntegrationsView';
import ReportsView from '../components/views/ReportsView';
import SettingsView from '../components/views/SettingsView';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('ClawAI Stack Int Ltd');
  const [hideMetrics, setHideMetrics] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState(null);
  const [logFilter, setLogFilter] = useState('All');

  const showNotification = (msg) => {
    setNotificationMessage(msg);
    setTimeout(() => {
      setNotificationMessage(null);
    }, 3500);
  };

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

  const handleTriggerAgent = (agentName) => {
    showNotification(`Triggered ${agentName} agent execution manual run`);
  };

  const [clawsList, setClawsList] = useState([
    { id: 'bookkeeper', name: 'Bookkeeper Claw', key: 'bookkeeper-claw', desc: 'Auto-categorizes transactions, reconciles bank feeds & posts general ledger journal entries.', status: 'Active', tasksToday: 14, accuracy: '100%' },
    { id: 'ar', name: 'AR Collector Claw', key: 'ar-collector-claw', desc: 'Monitors unpaid invoices, sends automated email reminders, and manages escalation workflows.', status: 'Active', tasksToday: 6, accuracy: '100%' },
    { id: 'ap', name: 'AP Matcher Claw', key: 'ap-claw', desc: 'Extracts line items from vendor bills, runs 3-way matching, and queues payouts for CFO approval.', status: 'Active', tasksToday: 3, accuracy: '100%' },
    { id: 'cfo', name: 'CFO Forecast Claw', key: 'cfo-claw', desc: 'Computes real-time runway, cash flow projections, EBITDA metrics, and burn rate warnings.', status: 'Active', tasksToday: 2, accuracy: '100%' },
    { id: 'controller', name: 'Controller Audit Claw', desc: 'Scans ledger for duplicate payouts, unexpected tax anomalies, and compliance audit gaps.', status: 'Active', key: 'controller-claw', tasksToday: 8, accuracy: '100%' },
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

  const logsData = [
    { id: 1, type: 'Reconciliation', claw: 'bookkeeper-claw', desc: 'Bank Feed Reconciliation', time: 'Just now', accuracy: '100%' },
    { id: 2, type: 'AR Follow-up', claw: 'ar-collector-claw', desc: 'Automated Follow-up Email Sent', time: '14m ago', accuracy: '100%' },
    { id: 3, type: '3-Way Match', claw: 'ap-claw', desc: 'Vendor Bill 3-Way Match Verified', time: '1h ago', accuracy: '100%' },
    { id: 4, type: 'Forecasts', claw: 'cfo-claw', desc: 'Runway & Cash Flow Forecast Updated', time: '3h ago', accuracy: '100%' },
    { id: 5, type: 'Audit', claw: 'controller-claw', desc: 'Anomaly Detection Audit Completed', time: '12m ago', accuracy: '100%' },
  ];

  const filteredLogs = logFilter === 'All' 
    ? logsData 
    : logsData.filter(log => log.type.toLowerCase() === logFilter.toLowerCase());

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex font-sans selection:bg-emerald-500/30">
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
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
          <OverviewView 
            selectedCompany={selectedCompany}
            hideMetrics={hideMetrics}
            handleTriggerAgent={handleTriggerAgent}
            clawsList={clawsList}
            toggleClawStatus={toggleClawStatus}
            logFilter={logFilter}
            setLogFilter={setLogFilter}
            filteredLogs={filteredLogs}
          />
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

      {isUploadOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13151b] border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Upload Document to {selectedCompany}
              </h3>
              <button onClick={() => setIsUploadOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">✕</button>
            </div>
            <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center space-y-2 hover:border-emerald-500/50 transition cursor-pointer">
              <FileText className="h-8 w-8 text-emerald-400 mx-auto" />
              <p className="text-xs text-zinc-300 font-medium">Drag and drop receipts, bank statements or vendor bills</p>
              <p className="text-[10px] text-zinc-500">Supports PDF, CSV, PNG, JPG up to 25MB</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setIsUploadOpen(false)} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer">
                Cancel
              </button>
              <button onClick={() => { setIsUploadOpen(false); showNotification('File uploaded and queued for processing'); }} className="px-4 py-1.5 bg-emerald-500 text-black font-semibold text-xs rounded-lg cursor-pointer">
                Upload & Process
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}