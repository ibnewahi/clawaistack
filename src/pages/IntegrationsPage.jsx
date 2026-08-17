import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Sliders, CheckCircle2, AlertCircle, RefreshCw, Plug } from 'lucide-react';

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([
    {
      id: 'odoo',
      name: 'Odoo ERP',
      category: 'Accounting & Ledgers',
      status: 'Connected',
      lastSync: '5 mins ago',
      details: 'Syncing Chart of Accounts, Invoices, and General Ledger',
    },
    {
      id: 'zoho-books',
      name: 'Zoho Books',
      category: 'Accounting Software',
      status: 'Connected',
      lastSync: '12 mins ago',
      details: 'Tax compliance, GST/HST tracking, and bank feeds',
    },
    {
      id: 'xero',
      name: 'Xero Accounting',
      category: 'Cloud Accounting',
      status: 'Connected',
      lastSync: '22 mins ago',
      details: 'Real-time bank reconciliation, invoice sync, and cash flow ledgering',
    },
    {
      id: 'stripe',
      name: 'Stripe',
      category: 'Payment Gateway',
      status: 'Connected',
      lastSync: '1 hr ago',
      details: 'Automated subscription receivables & payouts',
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks Online',
      category: 'Accounting Software',
      status: 'Disconnected',
      lastSync: 'Never',
      details: 'Connect QBO for automated transaction matching',
    },
  ]);

  const toggleConnection = (id) => {
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const isConnected = item.status === 'Connected';
          return {
            ...item,
            status: isConnected ? 'Disconnected' : 'Connected',
            lastSync: isConnected ? 'Never' : 'Just now',
          };
        }
        return item;
      })
    );
  };

  return (
    <div className="flex h-screen bg-background text-zinc-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="flex items-center justify-between border-b border-surface-border px-8 py-4 bg-surface/50 backdrop-blur">
          <div>
            <h1 className="text-xl font-bold text-white">Integrations Hub</h1>
            <p className="text-xs text-zinc-400">Manage connections to your accounting platforms, ERPs, and banking APIs</p>
          </div>
        </header>

        <main className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {integrations.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-surface-border bg-surface p-6 space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <Plug className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                        <span className="text-[11px] text-zinc-500">{item.category}</span>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        item.status === 'Connected'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-700/30 text-zinc-400 border border-zinc-700/50'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="mt-4 text-xs text-zinc-400 leading-relaxed">{item.details}</p>
                </div>

                <div className="flex items-center justify-between border-t border-surface-border pt-4 text-xs">
                  <span className="text-zinc-500 text-[11px]">Last sync: {item.lastSync}</span>
                  <button
                    onClick={() => toggleConnection(item.id)}
                    className="rounded-lg border border-surface-border bg-background px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
                  >
                    {item.status === 'Connected' ? 'Disconnect' : 'Connect API'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}