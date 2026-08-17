import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Settings, Shield, User, Bell, Database, Save } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    workspaceName: 'ClawAI Stack HQ',
    adminEmail: 'misbah312@gmail.com',
    currency: 'USD ($)',
    timezone: 'UTC-5 (EST)',
    emailNotifications: true,
    webhookAlerts: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex h-screen bg-background text-zinc-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="flex items-center justify-between border-b border-surface-border px-8 py-4 bg-surface/50 backdrop-blur">
          <div>
            <h1 className="text-xl font-bold text-white">Workspace Settings</h1>
            <p className="text-xs text-zinc-400">Configure workspace preferences, notification hooks, and security controls</p>
          </div>
        </header>

        <main className="p-8 max-w-4xl space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* General Profile Section */}
            <div className="rounded-xl border border-surface-border bg-surface p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-surface-border pb-3">
                <User className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold text-white">General Information</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Workspace Name</label>
                  <input
                    type="text"
                    value={form.workspaceName}
                    onChange={(e) => setForm({ ...form, workspaceName: e.target.value })}
                    className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Admin Email</label>
                  <input
                    type="email"
                    value={form.adminEmail}
                    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                    className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Reporting Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-accent"
                  >
                    <option>USD ($)</option>
                    <option>CAD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Timezone</label>
                  <input
                    type="text"
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                    className="w-full rounded-lg border border-surface-border bg-background px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* Notifications & AI Preferences */}
            <div className="rounded-xl border border-surface-border bg-surface p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-surface-border pb-3">
                <Bell className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold text-white">Alert Preferences</h2>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                  <span>Send daily AI Claw activity summaries via email</span>
                  <input
                    type="checkbox"
                    checked={form.emailNotifications}
                    onChange={(e) => setForm({ ...form, emailNotifications: e.target.checked })}
                    className="rounded border-surface-border text-accent focus:ring-accent h-4 w-4"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                  <span>Trigger real-time webhooks for overdue AR flags</span>
                  <input
                    type="checkbox"
                    checked={form.webhookAlerts}
                    onChange={(e) => setForm({ ...form, webhookAlerts: e.target.checked })}
                    className="rounded border-surface-border text-accent focus:ring-accent h-4 w-4"
                  />
                </label>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-background hover:bg-accent/90 transition-colors"
              >
                <Save className="h-4 w-4" /> Save Settings
              </button>
              {saved && <span className="text-xs text-emerald-400 font-medium">Settings saved successfully!</span>}
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}