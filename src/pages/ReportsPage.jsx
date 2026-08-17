import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { FileText, Download, TrendingUp, DollarSign, Clock, Filter } from 'lucide-react';

export default function ReportsPage() {
  const [reports] = useState([
    {
      id: 'ar-aging',
      title: 'Accounts Receivable Aging Analysis',
      category: 'Receivables',
      generatedBy: 'AR Collector Claw',
      date: 'Aug 17, 2026',
      status: 'Ready',
      summary: 'Breakdown of outstanding invoices across 30, 60, and 90+ day buckets.',
    },
    {
      id: 'cash-runway',
      title: '90-Day Cash Flow Forecast',
      category: 'Treasury & Liquidity',
      generatedBy: 'CFO Claw',
      date: 'Aug 16, 2026',
      status: 'Ready',
      summary: 'Predictive cash runway models based on recurring revenue and projected expenses.',
    },
    {
      id: 'margin-variance',
      title: 'Gross Margin Variance Report',
      category: 'Profitability',
      generatedBy: 'Bookkeeper Claw',
      date: 'Aug 14, 2026',
      status: 'Ready',
      summary: 'Variance audit identifying COGS fluctuations across primary revenue streams.',
    },
    {
      id: 'tax-reconciliation',
      title: 'Sales Tax & VAT Liability Summary',
      category: 'Tax Compliance',
      generatedBy: 'Bookkeeper Claw',
      date: 'Aug 10, 2026',
      status: 'Ready',
      summary: 'Reconciled GST/HST and sales tax collected across Odoo & Zoho Books.',
    },
  ]);

  return (
    <div className="flex h-screen bg-background text-zinc-100 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="flex items-center justify-between border-b border-surface-border px-8 py-4 bg-surface/50 backdrop-blur">
          <div>
            <h1 className="text-xl font-bold text-white">Reports & Financial Analytics</h1>
            <p className="text-xs text-zinc-400">Access AI-generated financial audits, cash forecasts, and ledgers</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-background hover:bg-accent/90">
            <Download className="h-4 w-4" /> Export All Data
          </button>
        </header>

        <main className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex flex-col justify-between rounded-xl border border-surface-border bg-surface p-6 space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{report.title}</h3>
                        <span className="text-[11px] text-zinc-500">{report.category}</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                      {report.status}
                    </span>
                  </div>

                  <p className="mt-4 text-xs text-zinc-400 leading-relaxed">{report.summary}</p>
                </div>

                <div className="flex items-center justify-between border-t border-surface-border pt-4 text-xs text-zinc-500">
                  <div className="flex items-center gap-2 text-[11px]">
                    <Clock className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{report.date} • {report.generatedBy}</span>
                  </div>
                  <button className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-background px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors">
                    <Download className="h-3.5 w-3.5" /> PDF
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