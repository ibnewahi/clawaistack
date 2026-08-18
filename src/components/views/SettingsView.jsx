import React from 'react';
import { Settings, Building2, Key } from 'lucide-react';

export default function SettingsView({ selectedCompany, setSelectedCompany, showNotification }) {
  return (
    <main className="flex-1 p-6 md:p-8 max-w-[1200px] w-full mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-zinc-800/60 pb-5">
        <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-emerald-400" />
          Workspace Settings & Security
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Manage workspace entities, API credentials, and notification thresholds.</p>
      </div>

      <div className="space-y-6">
        {/* Workspace Entity Info */}
        <div className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-400" />
            Active Entity Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-zinc-500 block mb-1">Company Workspace Name</label>
              <input 
                type="text" 
                value={selectedCompany} 
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full bg-[#181a22] border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-zinc-500 block mb-1">Functional Currency</label>
              <input 
                type="text" 
                value="GBP (£)" 
                disabled
                className="w-full bg-[#181a22] border border-zinc-800 rounded-xl px-3 py-2 text-zinc-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Security & API Keys */}
        <div className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="h-4 w-4 text-emerald-400" />
            API Keys & MCP Server Tokens
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#181a22] rounded-xl border border-zinc-800/80 text-xs">
              <div>
                <span className="font-semibold text-white block">Anthropic Claude API Key</span>
                <span className="text-zinc-500 font-mono text-[11px]">sk-ant-api03-••••••••••••wAA</span>
              </div>
              <button onClick={() => showNotification("API Key Copied to clipboard")} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg cursor-pointer">
                Copy
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#181a22] rounded-xl border border-zinc-800/80 text-xs">
              <div>
                <span className="font-semibold text-white block">PostgreSQL Database Connection</span>
                <span className="text-zinc-500 font-mono text-[11px]">postgresql://claw_admin:••••@db.clawaistack.com</span>
              </div>
              <button onClick={() => showNotification("Database Connection Verified")} className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg cursor-pointer">
                Test
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={() => showNotification("Workspace settings saved successfully")} 
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl shadow-lg transition cursor-pointer"
          >
            Save Workspace Changes
          </button>
        </div>
      </div>
    </main>
  );
}