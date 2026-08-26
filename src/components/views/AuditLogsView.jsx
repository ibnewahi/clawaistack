import { useState, useEffect } from 'react';
import { ShieldCheck, Search, Terminal, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AuditLogsView({ selectedWorkspaceId }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch immutable logs from claw_execution_logs scoped by workspace
  useEffect(() => {
    const fetchAuditLogs = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('claw_execution_logs')
          .select('*')
          .order('created_at', { ascending: false });

        if (selectedWorkspaceId) {
          query = query.eq('workspace_id', selectedWorkspaceId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching audit logs:', error.message);
        } else if (data) {
          setLogs(data);
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuditLogs();

    // Subscribe to live inserts on claw_execution_logs
    const channel = supabase
      .channel('claw_execution_logs_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'claw_execution_logs' },
        (payload) => {
          // Only append if it matches the current workspace view (or if no workspace is filtered)
          if (!selectedWorkspaceId || payload.new.workspace_id === selectedWorkspaceId) {
            setLogs((prev) => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedWorkspaceId]);

  const filteredLogs = logs.filter((log) => {
    const matchesStatus = filterStatus === 'All' || log.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = 
      (log.claw_id && log.claw_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.task_name && log.task_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#13151b] border border-zinc-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Immutable Ledger Audit Trail</h1>
            <p className="text-xs text-zinc-400">Append-only verifiable double-entry logs for tax compliance and audits.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono bg-zinc-900 border border-zinc-800 text-emerald-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Cryptographically Locked
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#13151b] border border-zinc-800 p-4 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search claw or task name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#090a0f] border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['All', 'success', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition cursor-pointer whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-[#090a0f] border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#13151b] border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">Recorded Actions ({filteredLogs.length})</span>
          <span className="text-xs text-zinc-500">Append-Only Database Storage</span>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-zinc-500 text-xs font-mono animate-pulse">
            Loading immutable records...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs">
            No audit logs match your current filter or search criteria for this workspace.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60 overflow-x-auto">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-zinc-900/40 transition flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {log.status?.toLowerCase() === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    {log.status?.toLowerCase() === 'rejected' && <XCircle className="h-4 w-4 text-red-400" />}
                    {log.status?.toLowerCase() !== 'success' && log.status?.toLowerCase() !== 'rejected' && <Terminal className="h-4 w-4 text-cyan-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase">{log.claw_id}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-xs text-zinc-300">{log.task_name}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${
                        log.status?.toLowerCase() === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] font-mono text-zinc-500">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                  {log.accuracy_score && (
                    <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                      Score: {log.accuracy_score}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}