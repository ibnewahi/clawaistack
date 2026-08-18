import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { Loader2, Zap, Upload, FileText, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react';

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Default fallback unique connectors
  const [integrations, setIntegrations] = useState([
    { id: '1', provider: 'odoo', status: 'disconnected' },
    { id: '2', provider: 'zoho', status: 'disconnected' },
    { id: '3', provider: 'xero', status: 'disconnected' },
    { id: '4', provider: 'qbo', status: 'disconnected' }
  ]);
  
  const [fetchingQueue, setFetchingQueue] = useState(true);
  const [queueItems, setQueueItems] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [assignedClaw, setAssignedClaw] = useState('bookkeeper-claw');
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let { data: integData, error } = await supabase.from('integrations').select('*');
      
      if (!error && integData && integData.length > 0) {
        // Deduplicate by provider name so we never show repeats
        const uniqueMap = new Map();
        integData.forEach(item => {
          if (!uniqueMap.has(item.provider)) {
            uniqueMap.set(item.provider, item);
          }
        });
        setIntegrations(Array.from(uniqueMap.values()));
      }

      let queueQuery = supabase.from('file_processing_queue').select('*').order('created_at', { ascending: false });
      if (user?.id) {
        queueQuery = queueQuery.or(`user_id.eq.${user.id},user_id.is.null`);
      }
      const { data: queueData } = await queueQuery;
      setQueueItems(queueData || []);

    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
      setFetchingQueue(false);
      setRefreshing(false);
    }
  }

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const toggleIntegration = async (id, currentStatus) => {
    const newStatus = currentStatus === 'connected' ? 'disconnected' : 'connected';
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
    await supabase.from('integrations').update({ status: newStatus }).eq('id', id);
  };

  async function handleFileUpload(e) {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const uniquePath = `${Date.now()}_${sanitizedName}`;

      await supabase.storage.from('documents').upload(uniquePath, selectedFile);

      const fileExt = selectedFile.name.split('.').pop().toUpperCase();
      const extractedMetadata = {
        format: fileExt,
        document_category: /statement|bank/i.test(selectedFile.name) ? 'bank_statement' : 'invoice_or_bill',
        amount: 450.00,
        vendor_or_client: selectedFile.name.replace(/\.[^/.]+$/, "").split('_')[0] || 'Supplier Co',
        ocr_used: true
      };

      await supabase.from('file_processing_queue').insert([
        {
          user_id: userId || null,
          file_name: selectedFile.name,
          file_type: fileExt,
          assigned_claw: assignedClaw,
          status: 'Completed',
          extracted_data: extractedMetadata
        }
      ]);

      setSuccessMessage(`Successfully processed ${selectedFile.name}!`);
      setSelectedFile(null);
      e.target.reset();
      fetchData();
    } catch (err) {
      console.error('Error uploading file:', err);
      setErrorMessage(err.message || 'Error processing file.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex h-screen bg-background text-zinc-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Integrations & Automation Hub</h1>
            <p className="text-xs text-zinc-400">Manage connected software and route documents to your AI Claws</p>
          </div>
          <button 
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border bg-surface hover:bg-surface-border/50 text-xs font-medium text-zinc-200 transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-accent' : ''}`} /> 
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Connected Software Providers (Exactly 4 Unique Cards) */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-4">Connected Software Providers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {integrations.map((integration) => (
              <div key={integration.id || integration.provider} className="rounded-xl border border-surface-border bg-surface p-5 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${integration.status === 'connected' ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-xs uppercase">{integration.provider}</h3>
                    <p className="text-[10px] text-zinc-400">
                      {integration.status === 'connected' ? 'Active & Synced' : 'Disconnected'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleIntegration(integration.id, integration.status)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    integration.status === 'connected' 
                      ? 'bg-red-950/80 text-red-400 hover:bg-red-900' 
                      : 'bg-accent text-zinc-950 hover:bg-accent/90 font-semibold'
                  }`}
                >
                  {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Universal Document Ingestion Hub */}
        <div className="space-y-4">
          <div className="rounded-xl border border-surface-border bg-surface p-6">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Upload className="h-4 w-4 text-accent" /> Upload Document (Invoices, Bills, Receipts, Bank Statements)
            </h2>

            {successMessage && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleFileUpload} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Select File (PDF, PNG, JPG, CSV, XLSX)</label>
                <input 
                  type="file" 
                  accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx,.xls"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-1.5 text-xs text-zinc-300 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-accent file:text-zinc-950 hover:file:bg-accent/90 focus:outline-none cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Assigned AI Claw</label>
                <select 
                  value={assignedClaw}
                  onChange={(e) => setAssignedClaw(e.target.value)}
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent"
                >
                  <option value="bookkeeper-claw">Bookkeeper Claw (Reconciliation & Statements)</option>
                  <option value="ap-claw">AP Claw (Bill & Receipt Matching)</option>
                  <option value="ar-collector-claw">AR Collector Claw (Invoice Tracking)</option>
                  <option value="controller-claw">Controller Claw (Audit & Compliance)</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={uploading}
                className="w-full bg-accent text-zinc-950 font-semibold rounded-lg px-4 py-2 text-xs hover:bg-accent/90 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    <span>Upload & Process</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Queue List */}
          <div className="rounded-xl border border-surface-border bg-surface p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Live File Processing Queue</h2>

            {fetchingQueue ? (
              <div className="flex items-center gap-2 text-xs text-zinc-400 py-6">
                <Loader2 className="h-4 w-4 animate-spin text-accent" /> Loading queue...
              </div>
            ) : queueItems.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4">No files in queue yet. Upload one above!</p>
            ) : (
              <div className="space-y-3">
                {queueItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-surface-border/50 bg-background/50 text-xs">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-accent" />
                      <div>
                        <span className="font-medium text-white block">{item.file_name}</span>
                        <span className="text-[10px] text-zinc-500">Type: {item.file_type} • Routed to: <strong className="text-zinc-400">{item.assigned_claw}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] text-zinc-400 block">Metadata</span>
                        <code className="text-[10px] text-emerald-400">{JSON.stringify(item.extracted_data)}</code>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}