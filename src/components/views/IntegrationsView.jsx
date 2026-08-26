import React, { useState, useEffect } from 'react';
import { Layers, X, Key, ShieldCheck, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function IntegrationsView({ selectedWorkspaceId, showNotification }) {
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [apiSecret, setApiSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [integrations, setIntegrations] = useState([
    { id: 'odoo', name: 'Odoo ERP & PostgreSQL', category: 'General Ledger', status: 'Disconnected', desc: 'Syncs chart of accounts, vendor bills, and posted journal entries directly.' },
    { id: 'zoho', name: 'Zoho Books & CRA Module', category: 'Accounting & Tax', status: 'Disconnected', desc: 'Pulls tax returns, sales receipts, and HST/GST adjustments automatically.' },
    { id: 'stripe', name: 'Stripe & Banking Feeds', category: 'Payment Gateways', status: 'Disconnected', desc: 'Live webhook streaming for instant payment reconciliation.' },
    { id: 'mcp', name: 'Anthropic Model Context Protocol (MCP)', category: 'AI Infrastructure', status: 'Disconnected', desc: 'Provides active MCP server context for autonomous claw agent pipelines.' },
    { id: 'whatsapp', name: 'WhatsApp & Email Gateway', category: 'Communication', status: 'Disconnected', desc: 'Dispatches automated AR follow-ups and collection updates to clients.' },
    { id: 'bitget', name: 'Bitget Exchange API', category: 'Crypto Treasury', status: 'Disconnected', desc: 'Syncs spot asset allocations and USDT balance reporting.' },
  ]);

  // Fetch integration states from Supabase on mount or workspace change
  useEffect(() => {
    const fetchIntegrations = async () => {
      setIsLoading(true);
      try {
        let query = supabase.from('integrations').select('*');
        
        if (selectedWorkspaceId) {
          query = query.eq('workspace_id', selectedWorkspaceId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching integrations:', error.message);
        } else {
          setIntegrations(prev => prev.map(item => {
            const found = data?.find(dbItem => dbItem.integration_key === item.id);
            return {
              ...item,
              status: found?.is_connected ? 'Connected' : 'Disconnected'
            };
          }));
        }
      } catch (err) {
        console.error('Failed to load integrations from DB:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIntegrations();
  }, [selectedWorkspaceId]);

  const handleOpenConfig = (item) => {
    setSelectedIntegration(item);
    setApiSecret('');
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const payload = {
        integration_key: selectedIntegration.id,
        name: selectedIntegration.name,
        category: selectedIntegration.category,
        is_connected: true,
        workspace_id: selectedWorkspaceId || null,
        config_data: { api_secret: apiSecret, updated_at: new Date().toISOString() },
        updated_at: new Date().toISOString()
      };

      // Upsert into Supabase integrations table (scoped by composite key or workspace if applicable)
      const { error } = await supabase
        .from('integrations')
        .upsert(payload, { onConflict: 'integration_key,workspace_id' });

      if (error) throw error;

      setIntegrations(prev => prev.map(item => {
        if (item.id === selectedIntegration.id) {
          return { ...item, status: 'Connected' };
        }
        return item;
      }));

      showNotification(`Successfully connected & saved ${selectedIntegration.name}!`);
      setSelectedIntegration(null);
    } catch (err) {
      console.error('Error saving integration configuration:', err);
      showNotification(`Failed to save configuration: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-zinc-800/60 pb-5">
        <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
          <Layers className="h-6 w-6 text-emerald-400" />
          Ledger & Data Integrations
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Connect ERPs, banks, and messaging channels to feed real-time financial context to Claw agents.
        </p>
      </div>

      {isLoading ? (
        <div className="text-xs text-zinc-500 py-12 text-center animate-pulse">Loading integration statuses from database...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((item) => (
            <div key={item.id} className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-5 flex justify-between items-start hover:border-zinc-700 transition">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase tracking-wider">{item.category}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    item.status === 'Connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">{item.name}</h3>
                <p className="text-xs text-zinc-400 leading-snug">{item.desc}</p>
              </div>

              <button 
                onClick={() => handleOpenConfig(item)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 rounded-lg cursor-pointer shrink-0 ml-4 transition flex items-center gap-1.5"
              >
                {item.status === 'Connected' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : null}
                Configure
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Configuration Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#13151b] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Configure {selectedIntegration.name}</h2>
                  <p className="text-xs text-zinc-400">Manage connection parameters & webhook keys</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedIntegration(null)}
                className="text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">API Key / Secret Token</label>
                <input 
                  type="password"
                  required
                  placeholder="sk_live_************************"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  className="w-full bg-[#090a0f] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono"
                />
                <p className="text-[11px] text-zinc-500">
                  Your credentials are securely saved to your Supabase integrations table for this workspace.
                </p>
              </div>

              <div className="bg-[#090a0f] border border-zinc-800 rounded-xl p-3 flex items-center gap-2 text-xs text-zinc-400">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Connection status will switch to Connected immediately upon saving.</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIntegration(null)}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-xl hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Saving to Database...' : 'Save & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}