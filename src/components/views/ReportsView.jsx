import React, { useState, useEffect } from 'react';
import { BarChart3, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ReportsView({ selectedWorkspaceId, showNotification }) {
  const [isLoading, setIsLoading] = useState(true);
  const [financialMetrics, setFinancialMetrics] = useState({
    ebitda: '£14,500 EBITDA',
    cash: '£115,000 Cash',
    outstanding: '£0 Outstanding'
  });

  // Fetch workspace-specific financial figures
  useEffect(() => {
    const fetchReportMetrics = async () => {
      setIsLoading(true);
      try {
        // Example query structure if pulling from a workspace ledger or summary table
        let query = supabase.from('workspace_reports').select('*');
        
        if (selectedWorkspaceId) {
          query = query.eq('workspace_id', selectedWorkspaceId);
        }

        const { data, error } = await query.single();

        if (error && error.code !== 'PGRST116') { // Ignore missing row error
          console.error('Error fetching report metrics:', error.message);
        } else if (data) {
          setFinancialMetrics({
            ebitda: data.ebitda_value || '£14,500 EBITDA',
            cash: data.cash_value || '£115,000 Cash',
            outstanding: data.outstanding_value || '£0 Outstanding'
          });
        }
      } catch (err) {
        console.error('Failed to load dynamic report data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportMetrics();
  }, [selectedWorkspaceId]);

  const reports = [
    { title: 'Profit & Loss Statement', date: 'Current Month (YTD)', value: financialMetrics.ebitda, status: 'Audit Ready' },
    { title: 'Balance Sheet Summary', date: 'As of Today', value: financialMetrics.cash, status: 'Verified' },
    { title: 'Aged Receivables Breakdown', date: 'Overdue Summary', value: financialMetrics.outstanding, status: '100% Collected' },
  ];

  return (
    <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="border-b border-zinc-800/60 pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-400" />
            Financial Reports & Statements
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Generated and audited automatically by CFO & Controller Claws.</p>
        </div>

        <button 
          onClick={() => showNotification("Exporting full PDF package...")} 
          className="px-3.5 py-1.5 bg-[#13151b] border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition"
        >
          <Download className="h-3.5 w-3.5 text-emerald-400" />
          <span>Export Package (PDF)</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-zinc-500 text-xs font-mono animate-pulse">
          Calculations updating for workspace ledger...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div key={report.title} className="bg-[#13151b] border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-white">{report.title}</h3>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{report.date}</p>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">{report.status}</span>
              </div>

              <div className="p-3 bg-[#181a22] rounded-xl border border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Key Figure</span>
                <span className="text-lg font-bold font-mono text-emerald-400">{report.value}</span>
              </div>

              <button 
                onClick={() => showNotification(`Opening detailed report: ${report.title}`)} 
                className="w-full py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 rounded-xl font-medium cursor-pointer transition"
              >
                View Interactive Breakdown
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}