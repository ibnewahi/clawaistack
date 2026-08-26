import React, { useState, useEffect } from 'react';
import { Settings, Shield, User, Bell, Database, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function SettingsView({ selectedCompany, selectedWorkspaceId, setSelectedCompany, showNotification }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    workspaceName: selectedCompany || 'ClawAI Stack HQ',
    adminEmail: 'misbah312@gmail.com',
    currency: 'USD ($)',
    timezone: 'UTC-5 (EST)',
    emailNotifications: true,
    webhookAlerts: true,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          let query = supabase
            .from('workspace_settings')
            .select('*')
            .eq('user_id', user.id);

          if (selectedWorkspaceId) {
            query = query.eq('workspace_id', selectedWorkspaceId);
          }

          const { data, error } = await query.single();

          if (data) {
            setForm({
              workspaceName: data.workspace_name || selectedCompany || 'ClawAI Stack HQ',
              adminEmail: data.admin_email || user.email,
              currency: data.currency || 'USD ($)',
              timezone: data.timezone || 'UTC-5 (EST)',
              emailNotifications: data.email_notifications ?? true,
              webhookAlerts: data.webhook_alerts ?? true,
            });
          } else {
            setForm((prev) => ({ 
              ...prev, 
              adminEmail: user.email,
              workspaceName: selectedCompany || 'ClawAI Stack HQ'
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [selectedWorkspaceId, selectedCompany]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const payload = {
          user_id: user.id,
          workspace_id: selectedWorkspaceId || null,
          workspace_name: form.workspaceName,
          admin_email: form.adminEmail,
          currency: form.currency,
          timezone: form.timezone,
          email_notifications: form.emailNotifications,
          webhook_alerts: form.webhookAlerts,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('workspace_settings')
          .upsert(payload, { onConflict: selectedWorkspaceId ? 'workspace_id' : 'user_id' });

        if (error) throw error;

        if (form.workspaceName !== selectedCompany && setSelectedCompany) {
          setSelectedCompany(form.workspaceName);
        }

        setSaved(true);
        if (showNotification) {
          showNotification('Workspace settings saved successfully!');
        }
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      if (showNotification) {
        showNotification(`Failed to save settings: ${err.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-zinc-800/60 pb-5">
        <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-emerald-400" />
          Workspace Settings
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Configure workspace preferences, notification hooks, and security controls.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono py-12">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          Loading workspace configuration...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* General Profile Section */}
          <div className="rounded-2xl border border-zinc-800 bg-[#13151b] p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <User className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">General Information</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Workspace Name</label>
                <input
                  type="text"
                  value={form.workspaceName}
                  onChange={(e) => setForm({ ...form, workspaceName: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-[#090a0f] px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Admin Email</label>
                <input
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-[#090a0f] px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Reporting Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full rounded-lg border border-zinc-800 bg-[#090a0f] px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
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
                  className="w-full rounded-lg border border-zinc-800 bg-[#090a0f] px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          </div>

          {/* Notifications & AI Preferences */}
          <div className="rounded-2xl border border-zinc-800 bg-[#13151b] p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Bell className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Alert Preferences</h2>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                <span>Send daily AI Claw activity summaries via email</span>
                <input
                  type="checkbox"
                  checked={form.emailNotifications}
                  onChange={(e) => setForm({ ...form, emailNotifications: e.target.checked })}
                  className="rounded border-zinc-800 bg-[#090a0f] text-emerald-500 focus:ring-emerald-500/30 h-4 w-4 cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                <span>Trigger real-time webhooks for overdue AR flags</span>
                <input
                  type="checkbox"
                  checked={form.webhookAlerts}
                  onChange={(e) => setForm({ ...form, webhookAlerts: e.target.checked })}
                  className="rounded border-zinc-800 bg-[#090a0f] text-emerald-500 focus:ring-emerald-500/30 h-4 w-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 text-xs font-semibold text-zinc-950 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Settings
            </button>
            {saved && <span className="text-xs text-emerald-400 font-mono font-medium">Settings saved to Supabase!</span>}
          </div>
        </form>
      )}
    </main>
  );
}