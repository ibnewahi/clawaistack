import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/MetricCard';
import AIClawCard from '../components/AIClawCard';
import InsightItem from '../components/InsightItem';
import EmailSlideOver from '../components/EmailSlideOver';
import { Search, Bell } from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'claws', label: 'AI Claws', badge: '3', icon: 'Cpu' },
  { id: 'integrations', label: 'Integrations', icon: 'Layers' },
  { id: 'reports', label: 'Reports', icon: 'FileText' },
  { id: 'settings', label: 'Settings', icon: 'Settings' }
];

const collectionEmail = {
  subject: 'URGENT: Overdue Invoice #INV-2847 — Acme Corp',
  recipient: 'accounts@acmecorp.com',
  body: `Dear Acme Corp Accounts Team,

Our records indicate that Invoice #INV-2847 for $12,400.00 was due 18 days ago (July 30, 2026).

To avoid any disruption to your active ClawAI Stack automation services, please review the attached invoice and confirm your scheduled payment date.

If payment has already been processed, please reply with the payment reference details so we can update our records.

Thank you for your prompt attention to this matter.

Best regards,
ClawAI Stack Finance Team
On behalf of [Your Company Name]`
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState('dashboard');
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const [metrics, setMetrics] = useState([
    { id: '1', title: 'Monthly Recurring Revenue', value: '$24,850', change_percent: '+14.2%', is_positive: true },
    { id: '2', title: 'Active AI Agents', value: '18', change_percent: '+3', is_positive: true },
    { id: '3', title: 'Total Leads Audited', value: '1,420', change_percent: '+28.5%', is_positive: true },
    { id: '4', title: 'Average Margin', value: '68.4%', change_percent: '-1.2%', is_positive: false }
  ]);

  const [aiClaws, setAiClaws] = useState([
    { id: '1', name: 'CFO Claw', description: 'Financial forecasting & strategic insights', status: 'active', tasks_today: 14, icon_name: 'Sparkles' },
    { id: '2', name: 'AR Collector Claw', description: 'Automated invoice follow-ups & collections', status: 'action-needed', tasks_today: 8, icon_name: 'Mail' },
    { id: '3', name: 'Bookkeeper Claw', description: 'Transaction categorization & reconciliation', status: 'idle', tasks_today: 0, icon_name: 'FileBarChart' }
  ]);

  const [insights, setInsights] = useState([
    { id: '1', type: 'collection', title: 'Overdue invoice detected — Acme Corp', description: 'Invoice #INV-2847 ($12,400) is 18 days past due. AI drafted a collection email ready for your review.', action_text: 'Review Email', action_type: 'email', time_ago: '12 min ago' },
    { id: '2', type: 'forecast', title: 'Cash runway extended by 2 weeks', description: 'CFO Claw updated your 90-day forecast based on recent receivables acceleration.', action_text: 'View Forecast', action_type: 'forecast', time_ago: '1 hr ago' },
    { id: '3', type: 'alert', title: 'Gross margin dip flagged in Q3', description: 'COGS increased 3.2% in the Services line. Bookkeeper Claw identified 4 uncategorized vendor charges.', action_text: 'Investigate', action_type: 'audit', time_ago: '3 hrs ago' },
    { id: '4', type: 'reconciliation', title: 'Bank reconciliation complete', description: 'Bookkeeper Claw matched 847 transactions across 3 accounts with 99.7% accuracy.', action_text: 'View Report', action_type: 'report', time_ago: '5 hrs ago' }
  ]);

  useEffect(() => {
    fetchMetrics();
    fetchAiClaws();
    fetchInsights();
  }, []);

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('dashboard_metrics')
        .select('*')
        .order('order_index', { ascending: true });

      if (!error && data && data.length > 0) {
        setMetrics(data);
      }
    } catch (err) {
      console.error('Error loading metrics:', err);
    }
  };

  const fetchAiClaws = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_claws')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        setAiClaws(data);
      }
    } catch (err) {
      console.error('Error loading AI claws:', err);
    }
  };

  const fetchInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('insights_feed')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setInsights(data);
      }
    } catch (err) {
      console.error('Error loading insights:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    navigate('/auth');
  };

  const handleInsightAction = (actionType) => {
    if (actionType === 'email') {
      setEmailOpen(true);
    }
  };

  const handleApproveSend = () => {
    setEmailSent(true);
    setTimeout(() => setEmailOpen(false), 1500);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        navItems={navItems}
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-surface-border bg-background px-6">
          <div>
            <h1 className="text-lg font-semibold text-white">Dashboard</h1>
            <p className="text-xs text-zinc-500">
              Welcome back — here&apos;s your financial overview
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search..."
                className="h-9 w-56 rounded-lg border border-surface-border bg-surface pl-9 pr-4 text-sm text-zinc-300 placeholder-zinc-500 focus:border-accent focus:outline-none"
              />
            </div>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-400 hover:text-white">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
            </button>
            <button
              onClick={handleSignOut}
              className="h-9 px-3 text-xs font-medium text-zinc-300 rounded-lg border border-surface-border bg-surface hover:bg-zinc-800 transition-colors"
            >
              Sign Out
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-sm font-semibold text-accent">
              M
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard
                key={metric.id || metric.title}
                title={metric.title}
                value={metric.value}
                changePercent={metric.change_percent}
                isPositive={metric.is_positive}
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Active AI Claws</h2>
                <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  3 agents online
                </span>
              </div>
              <div className="space-y-3">
                {aiClaws.map((claw) => (
                  <AIClawCard
                    key={claw.id || claw.name}
                    name={claw.name}
                    description={claw.description}
                    status={claw.status}
                    tasksToday={claw.tasks_today}
                    iconName={claw.icon_name}
                  />
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Insights Feed</h2>
                <button className="text-xs text-accent hover:underline">View all</button>
              </div>
              <div className="space-y-3">
                {insights.map((item) => (
                  <InsightItem key={item.id || item.title} {...item} onAction={handleInsightAction} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      <EmailSlideOver
        isOpen={emailOpen}
        onClose={() => setEmailOpen(false)}
        emailData={collectionEmail}
        onApproveSend={handleApproveSend}
        isSent={emailSent}
      />
    </div>
  );
}