import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';
import { Loader2, Zap } from 'lucide-react';

export default function IntegrationsPage() {
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState([]);

  useEffect(() => {
    async function fetchIntegrations() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log("Logged-in user:", user?.id);

        // Fetch all integrations first to debug what exists in the table
        const { data, error } = await supabase
          .from('integrations')
          .select('*');

        console.log("Supabase integrations response:", { data, error });

        setIntegrations(data || []);
      } catch (err) {
        console.error("Error fetching integrations:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchIntegrations();
  }, []);

  const toggleIntegration = async (id, currentStatus) => {
    const newStatus = currentStatus === 'connected' ? 'disconnected' : 'connected';
    await supabase.from('integrations').update({ status: newStatus }).eq('id', id);
    setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
  };

  return (
    <div className="flex h-screen bg-background text-zinc-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-8">
        <h1 className="text-xl font-bold text-white mb-6">Integrations</h1>
        
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
            Loading integrations...
          </div>
        ) : integrations.length === 0 ? (
          <p className="text-xs text-zinc-400">No integrations found in the database table.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((integration) => (
              <div key={integration.id} className="rounded-xl border border-surface-border bg-surface p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${integration.status === 'connected' ? 'bg-emerald-950 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{integration.provider?.toUpperCase()}</h3>
                    <p className="text-xs text-zinc-400">
                      {integration.status === 'connected' ? 'Active & Synced' : 'Disconnected'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleIntegration(integration.id, integration.status)}
                  className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${integration.status === 'connected' ? 'bg-red-950 text-red-400' : 'bg-accent text-background'}`}
                >
                  {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}