import React from 'react';
import { Layers } from 'lucide-react';

export default function IntegrationsView({ showNotification }) {
  const integrations = [
    { name: 'Odoo ERP & PostgreSQL', category: 'General Ledger', status: 'Connected', desc: 'Syncs chart of accounts, vendor bills, and posted journal entries directly.' },
    { name: 'Zoho Books & CRA Module', category: 'Accounting & Tax', status: 'Connected', desc: 'Pulls tax returns, sales receipts, and HST/GST adjustments automatically.' },
    { name: 'Stripe & Banking Feeds', category: 'Payment Gateways', status: 'Connected', desc: 'Live webhook streaming for instant payment reconciliation.' },
    { name: 'Anthropic Model Context Protocol (MCP)', category: 'AI Infrastructure', status: 'Connected', desc: 'Provides active MCP server context for autonomous claw agent pipelines.' },
    { name: 'WhatsApp & Email Gateway', category: 'Communication', status: 'Connected', desc: 'Dispatches automated AR follow-ups and collection updates to clients.' },
    { name: 'Bitget Exchange API', category: 'Crypto Treasury', status: 'Disconnected', desc: 'Syncs spot asset allocations and USDT balance reporting.' },
  ];

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((item) => (
          <div key={item.name} className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-5 flex justify-between items-start hover:border-zinc-700 transition">
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
              onClick={() => showNotification(`Configuring settings for ${item.name}`)}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 rounded-lg cursor-pointer shrink-0 ml-4"
            >
              Configure
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}