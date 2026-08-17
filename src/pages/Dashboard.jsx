import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/MetricCard';
import AIClawCard from '../components/AIClawCard';
import InsightItem from '../components/InsightItem';
import EmailSlideOver from '../components/EmailSlideOver';
import { Bot, Search, Bell } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const sampleEmail = {
    recipient: 'billing@acmecorp.com',
    subject: 'Overdue Invoice #INV-2847 — ClawAI AR Collector',
    body: `Hi Acme Team,\n\nOur system flagged invoice #INV-2847 ($12,400) as 18 days past due.\n\nPlease confirm payment status or let us know if you need another copy of the invoice.\n\nBest regards,\nAccounts Receivable Team`,
  };

  const handleInsightAction = (actionType) => {
    if (actionType === 'review_email' || actionType === 'collection') {
      setIsEmailOpen(true);
    } else {
      alert(`Triggered action: ${actionType.toUpperCase()}\nPipeline simulation active.`);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="flex h-screen bg-background text-zinc-100 overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="flex items-center justify-between border-b border-surface-border px-8 py-4 bg-surface/50 backdrop-blur">
          <div>
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
            <p className="text-xs text-zinc-400">Welcome back — here's your financial overview</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-64 rounded-lg border border-surface-border bg-background px-9 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-accent"
              />
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-background text-zinc-400 hover:text-white">
              <Bell className="h-4 w-4" />
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-background hover:bg-accent/90"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Monthly Recurring Revenue" value="$24,850" changePercent="+14.2%" isPositive={true} />
            <MetricCard title="Active AI Agents" value="18" changePercent="+3" isPositive={true} />
            <MetricCard title="Total Leads Audited" value="1,420" changePercent="+28.5%" isPositive={true} />
            <MetricCard title="Average Margin" value="68.4%" changePercent="-1.2%" isPositive={false} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Active AI Claws</h2>
                <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  3 agents online
                </span>
              </div>
              <div className="space-y-3">
                <AIClawCard name="CFO Claw" description="Financial forecasting & strategic insights" status="active" tasksToday={14} icon={Bot} />
                <AIClawCard name="AR Collector Claw" description="Automated invoice follow-ups & collections" status="action-needed" tasksToday={8} icon={Bot} />
                <AIClawCard name="Bookkeeper Claw" description="Transaction categorization & reconciliation" status="idle" tasksToday={0} icon={Bot} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Insights Feed</h2>
                <button className="text-xs text-accent hover:underline font-medium">View all</button>
              </div>
              <div className="space-y-3">
                <InsightItem
                  type="collection"
                  title="Overdue invoice detected — Acme Corp"
                  description="Invoice #INV-2847 ($12,400) is 18 days past due. AI drafted a collection email ready for your review."
                  action_text="Review Email"
                  action_type="review_email"
                  time_ago="12 min ago"
                  onAction={handleInsightAction}
                />
                <InsightItem
                  type="forecast"
                  title="Cash runway extended by 2 weeks"
                  description="CFO Claw updated your 90-day forecast based on recent receivables acceleration."
                  action_text="View Forecast"
                  action_type="view_forecast"
                  time_ago="1 hr ago"
                  onAction={handleInsightAction}
                />
                <InsightItem
                  type="alert"
                  title="Gross margin dip flagged in Q3"
                  description="COGS increased 3.2% in the Services line. Bookkeeper Claw identified 4 uncategorized vendor charges."
                  action_text="Investigate"
                  action_type="investigate"
                  time_ago="3 hrs ago"
                  onAction={handleInsightAction}
                />
                <InsightItem
                  type="bank"
                  title="Bank reconciliation complete"
                  description="Bookkeeper Claw matched 847 transactions across 3 accounts with 99.7% accuracy."
                  action_text="View Report"
                  action_type="view_report"
                  time_ago="5 hrs ago"
                  onAction={handleInsightAction}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      <EmailSlideOver
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        emailData={sampleEmail}
        isSent={isSent}
        onApproveSend={() => {
          setIsSent(true);
          setTimeout(() => {
            setIsEmailOpen(false);
            setIsSent(false);
          }, 1500);
        }}
      />
    </div>
  );
}