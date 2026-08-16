import {
  LayoutDashboard,
  Bot,
  Plug,
  FileBarChart,
  Settings,
  Bell,
  Search,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Mail,
  Clock,
  CircleDot,
} from 'lucide-react'
import { useState } from 'react'
import MetricCard from '../components/MetricCard'
import AIClawCard from '../components/AIClawCard'
import InsightItem from '../components/InsightItem'
import EmailSlideOver from '../components/EmailSlideOver'
import Sidebar from '../components/Sidebar'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'ai-claws', label: 'AI Claws', icon: Bot, path: '/dashboard' },
  { id: 'integrations', label: 'Integrations', icon: Plug, path: '/dashboard' },
  { id: 'reports', label: 'Reports', icon: FileBarChart, path: '/dashboard' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard' },
]

const metrics = [
  {
    title: 'Cash Balance',
    value: '$428,520',
    change: '+8.2%',
    trend: 'up',
    icon: TrendingUp,
  },
  {
    title: 'Monthly Revenue',
    value: '$1.24M',
    change: '+12.4%',
    trend: 'up',
    icon: TrendingUp,
  },
  {
    title: 'Gross Margin',
    value: '42.8%',
    change: '-1.7%',
    trend: 'down',
    alert: true,
    icon: AlertTriangle,
  },
  {
    title: 'Overdue AR',
    value: '$42,100',
    change: '12 invoices',
    trend: 'neutral',
    icon: Clock,
  },
]

const aiClaws = [
  {
    name: 'CFO Claw',
    description: 'Financial forecasting & strategic insights',
    status: 'active',
    tasksToday: 14,
    icon: Sparkles,
  },
  {
    name: 'AR Collector Claw',
    description: 'Automated invoice follow-ups & collections',
    status: 'action-needed',
    tasksToday: 8,
    icon: Mail,
  },
  {
    name: 'Bookkeeper Claw',
    description: 'Transaction categorization & reconciliation',
    status: 'idle',
    tasksToday: 0,
    icon: FileBarChart,
  },
]

const insights = [
  {
    id: 1,
    type: 'collection',
    title: 'Overdue invoice detected — Acme Corp',
    description:
      'Invoice #INV-2847 ($12,400) is 18 days past due. AI drafted a collection email ready for your review.',
    time: '12 min ago',
    priority: 'high',
    actionLabel: 'Review Email',
  },
  {
    id: 2,
    type: 'forecast',
    title: 'Cash runway extended by 2 weeks',
    description:
      'CFO Claw updated your 90-day forecast based on recent receivables acceleration.',
    time: '1 hr ago',
    priority: 'normal',
    actionLabel: 'View Forecast',
  },
  {
    id: 3,
    type: 'margin',
    title: 'Gross margin dip flagged in Q3',
    description:
      'COGS increased 3.2% in the Services line. Bookkeeper Claw identified 4 uncategorized vendor charges.',
    time: '3 hrs ago',
    priority: 'medium',
    actionLabel: 'Investigate',
  },
  {
    id: 4,
    type: 'reconciliation',
    title: 'Bank reconciliation complete',
    description:
      'Bookkeeper Claw matched 847 transactions across 3 accounts with 99.7% accuracy.',
    time: '5 hrs ago',
    priority: 'low',
    actionLabel: 'View Report',
  },
]

const collectionEmail = {
  to: 'accounts@acmecorp.com',
  subject: 'Payment Reminder — Invoice #INV-2847 ($12,400)',
  body: `Dear Acme Corp Accounts Team,

I hope this message finds you well. I'm reaching out regarding Invoice #INV-2847 for $12,400.00, which was due on July 28, 2026 and is now 18 days past due.

We value our partnership and understand that processing delays can happen. To help us keep your account in good standing, we'd appreciate payment at your earliest convenience.

Payment details:
• Invoice: #INV-2847
• Amount Due: $12,400.00
• Original Due Date: July 28, 2026

If payment has already been sent, please disregard this notice and share the remittance details so we can update our records.

Should you have any questions or need to discuss payment arrangements, please don't hesitate to reply to this email.

Thank you for your prompt attention to this matter.

Best regards,
ClawAI Stack Finance Team
On behalf of [Your Company Name]`,
}

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState('dashboard')
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleReviewEmail = () => {
    setEmailOpen(true)
    setEmailSent(false)
  }

  const handleApproveSend = () => {
    setEmailSent(true)
    setTimeout(() => setEmailOpen(false), 1500)
  }

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
                className="h-9 w-56 rounded-lg border border-surface-border bg-surface pl-9 pr-4 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-400 transition hover:border-accent/40 hover:text-accent">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-sm font-semibold text-accent">
              M
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            <section className="xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">
                  Active AI Claws
                </h2>
                <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <CircleDot className="h-3 w-3 text-accent" />
                  3 agents online
                </span>
              </div>
              <div className="space-y-3">
                {aiClaws.map((claw) => (
                  <AIClawCard key={claw.name} {...claw} />
                ))}
              </div>
            </section>

            <section className="xl:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">
                  Insights Feed
                </h2>
                <button className="text-xs font-medium text-accent transition hover:text-accent-hover">
                  View all
                </button>
              </div>
              <div className="rounded-xl border border-surface-border bg-surface">
                {insights.map((insight, index) => (
                  <InsightItem
                    key={insight.id}
                    {...insight}
                    isLast={index === insights.length - 1}
                    onAction={
                      insight.type === 'collection'
                        ? handleReviewEmail
                        : undefined
                    }
                  />
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>

      <EmailSlideOver
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        email={collectionEmail}
        onApprove={handleApproveSend}
        sent={emailSent}
      />
    </div>
  )
}
