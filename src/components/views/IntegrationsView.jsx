import React, { useCallback, useEffect, useState } from 'react';
import { Layers, X, Key, ShieldCheck, CheckCircle } from 'lucide-react';
import {
  configureIntegrationCredential,
  disconnectIntegrationCredential,
  listIntegrations,
} from '../../lib/integrationApi';

const integrationDescriptions = {
  odoo: 'Securely configure a credential for this workspace. Provider connectivity and sync are not yet verified.',
  zoho: 'Securely configure a credential for this organization. Provider connectivity and sync are not yet verified.',
  stripe: 'Securely configure a credential for this workspace. Provider connectivity and sync are not yet verified.',
  mcp: 'Securely configure a credential for this workspace. Provider connectivity and sync are not yet verified.',
  whatsapp: 'Securely configure a credential for this workspace. Provider connectivity and sync are not yet verified.',
  bitget: 'Securely configure a credential for this workspace. Provider connectivity and sync are not yet verified.',
};

const statusForConnectionState = (connectionState) => {
  if (connectionState === 'credential_configured_unverified') return 'Credential configured';
  if (connectionState === 'configuration_conflict') return 'Configuration conflict';
  return 'Not configured';
};

const hasConfiguredCredential = (connectionState) =>
  connectionState === 'credential_configured_unverified';

export default function IntegrationsView({ selectedWorkspaceId, showNotification }) {
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [apiSecret, setApiSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [integrations, setIntegrations] = useState([]);

  const closeConfiguration = () => {
    setApiSecret('');
    setSelectedIntegration(null);
  };

  const loadIntegrations = useCallback(async () => {
    if (!selectedWorkspaceId) {
      setIntegrations([]);
      setLoadError(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(false);
    try {
      const data = await listIntegrations(selectedWorkspaceId);
      const serverIntegrations = Array.isArray(data.integrations) ? data.integrations : [];
      setIntegrations(serverIntegrations.map((integration) => ({
        id: integration.integrationKey,
        name: integration.displayName,
        category: integration.category,
        connectionState: integration.connectionState,
        desc: integrationDescriptions[integration.integrationKey] || 'Provider connectivity and sync are not yet verified.',
      })));
    } catch {
      setIntegrations([]);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWorkspaceId]);

  useEffect(() => {
    closeConfiguration();
    loadIntegrations();
  }, [loadIntegrations]);

  const handleOpenConfig = (item) => {
    if (!selectedWorkspaceId) return;
    setApiSecret('');
    setSelectedIntegration(item);
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!selectedIntegration || !selectedWorkspaceId || isSaving) return;

    setIsSaving(true);
    try {
      await configureIntegrationCredential({
        workspaceId: selectedWorkspaceId,
        integrationKey: selectedIntegration.id,
        secret: apiSecret,
      });
      setIntegrations((current) => current.map((item) => (
        item.id === selectedIntegration.id
          ? { ...item, connectionState: 'credential_configured_unverified' }
          : item
      )));
      showNotification('Credential configured. Provider connectivity is not yet verified.');
      closeConfiguration();
    } catch {
      showNotification('Unable to save credential. Please try again.');
    } finally {
      setApiSecret('');
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedIntegration || !selectedWorkspaceId || isDisconnecting) return;

    setIsDisconnecting(true);
    try {
      await disconnectIntegrationCredential({
        workspaceId: selectedWorkspaceId,
        integrationKey: selectedIntegration.id,
      });
      setIntegrations((current) => current.map((item) => (
        item.id === selectedIntegration.id
          ? { ...item, connectionState: 'not_configured' }
          : item
      )));
      showNotification('Credential removed.');
      closeConfiguration();
    } catch {
      showNotification('Unable to remove credential. Please try again.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (!selectedWorkspaceId) {
    return (
      <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-6 animate-in fade-in duration-200">
        <div className="border-b border-zinc-800/60 pb-5">
          <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
            <Layers className="h-6 w-6 text-emerald-400" />
            Ledger & Data Integrations
          </h1>
        </div>
        <div className="text-xs text-zinc-500 py-12 text-center">Select a workspace to manage integration credentials.</div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-zinc-800/60 pb-5">
        <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
          <Layers className="h-6 w-6 text-emerald-400" />
          Ledger & Data Integrations
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configure credentials for future providers. Credential configuration does not verify provider connectivity or sync.
        </p>
      </div>

      {isLoading ? (
        <div className="text-xs text-zinc-500 py-12 text-center animate-pulse">Loading integration settings...</div>
      ) : loadError ? (
        <div className="text-xs text-zinc-500 py-12 text-center">Unable to load integration settings. Please try again.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((item) => {
            const configured = hasConfiguredCredential(item.connectionState);
            return (
              <div key={item.id} className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-5 flex justify-between items-start hover:border-zinc-700 transition">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase tracking-wider">{item.category}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      configured ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {statusForConnectionState(item.connectionState)}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{item.name}</h3>
                  <p className="text-xs text-zinc-400 leading-snug">{item.desc}</p>
                  {configured && <p className="text-[11px] text-zinc-500">Not yet verified</p>}
                </div>

                <button
                  onClick={() => handleOpenConfig(item)}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 rounded-lg cursor-pointer shrink-0 ml-4 transition flex items-center gap-1.5"
                >
                  {configured ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : null}
                  Configure
                </button>
              </div>
            );
          })}
        </div>
      )}

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
                  <p className="text-xs text-zinc-400">Securely manage a provider credential</p>
                </div>
              </div>
              <button
                onClick={closeConfiguration}
                disabled={isSaving || isDisconnecting}
                className="text-zinc-400 hover:text-white transition cursor-pointer disabled:opacity-50"
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
                  placeholder="Enter a credential"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  autoComplete="off"
                  className="w-full bg-[#090a0f] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono"
                />
                <p className="text-[11px] text-zinc-500">
                  Submitted credentials are stored server-side and are never displayed here.
                </p>
              </div>

              <div className="bg-[#090a0f] border border-zinc-800 rounded-xl p-3 flex items-center gap-2 text-xs text-zinc-400">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Saving a credential does not verify provider connectivity or enable sync.</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                {hasConfiguredCredential(selectedIntegration.connectionState) && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={isSaving || isDisconnecting}
                    className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-xl hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
                  >
                    {isDisconnecting ? 'Removing...' : 'Remove credential'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeConfiguration}
                  disabled={isSaving || isDisconnecting}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-xl hover:bg-zinc-800 transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isDisconnecting}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Saving credential...' : 'Save credential'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
