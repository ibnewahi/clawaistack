import React, { useState, useEffect } from 'react';
import { Save, Bot, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function SopManager({ clawKey = 'PayClaw', showNotification }) {
  const [sopData, setSopData] = useState(null);
  const [promptText, setPromptText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPrompt() {
      if (!supabase) return;
      const { data } = await supabase
        .from('sop_prompts')
        .select('*')
        .eq('claw_key', clawKey)
        .single();
      
      if (data) {
        setSopData(data);
        setPromptText(data.system_prompt);
      }
    }
    loadPrompt();
  }, [clawKey]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('sop_prompts')
        .update({ system_prompt: promptText, updated_at: new Date().toISOString() })
        .eq('claw_key', clawKey);

      if (error) throw error;
      if (showNotification) showNotification(`Updated SOP Ruleset for ${clawKey}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#13151b] border border-zinc-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">SOP Rule Editor ({clawKey})</h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">{sopData?.version || 'v1.0.0'}</span>
      </div>

      <textarea
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        rows={6}
        className="w-full bg-[#181a22] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 font-mono focus:outline-none focus:border-emerald-500/50"
      />

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{saving ? 'Saving...' : 'Save SOP Rules'}</span>
        </button>
      </div>
    </div>
  );
}