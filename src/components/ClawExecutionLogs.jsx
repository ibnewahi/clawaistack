import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, ShieldCheck } from 'lucide-react';

export function ClawExecutionLogs() {
  const [logs, setLogs] = useState([]);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('claw_execution_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setLogs(data);
    }
  };

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel('logs_stream_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'claw_execution_logs' },
        (payload) => {
          setLogs((prev) => [payload.new, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-[#0f1117] border border-zinc-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Recent Claw Execution Logs</h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Live Sync Active
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 uppercase text-[10px] tracking-wider">
              <th className="pb-2">Claw ID</th>
              <th className="pb-2">Task</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Latency</th>
              <th className="pb-2 text-right">Accuracy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="py-2.5 font-semibold text-emerald-400">{log.claw_id}</td>
                <td className="py-2.5 text-zinc-200">{log.task_name || 'Manual Audit'}</td>
                <td className="py-2.5">
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="h-3 w-3" />
                    {log.status}
                  </span>
                </td>
                <td className="py-2.5 text-zinc-400">{log.execution_time_ms ? `${log.execution_time_ms}ms` : '—'}</td>
                <td className="py-2.5 text-right font-bold text-white">{log.accuracy_score}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}