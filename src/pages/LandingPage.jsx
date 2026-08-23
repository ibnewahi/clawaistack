import { useState } from 'react';
import LeadModal from '../components/LeadModal';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Sparkles,
  Mail,
  FileBarChart,
  ShieldCheck,
  Building2,
  ArrowRight,
  Check,
  Zap,
  Activity,
  CheckCircle2,
  Terminal,
  Calculator,
  Layers,
  TrendingUp,
  Clock,
  DollarSign
} from 'lucide-react';
import LandingFooter from '../components/landing/LandingFooter';

const miniChartData = [
  { month: 'Jan', cash: 140 },
  { month: 'Feb', cash: 132 },
  { month: 'Mar', cash: 125 },
  { month: 'Apr', cash: 121 },
  { month: 'May', cash: 118 },
  { month: 'Jun', cash: 115 },
];

const integrations = ['Odoo ERP', 'Zoho Books', 'QuickBooks Online', 'Xero', 'Stripe', 'Bank Feeds (Plaid)'];

const features = [
  {
    name: 'CFO Claw',
    description: 'Strategic cash forecasting, runway analysis, variance tracking, and real-time executive risk alerts.',
    icon: Sparkles,
    codeSnippet: 'EXECUTE: forecasting_engine --runway 18.4m --cash £115,000',
    highlight: true,
  },
  {
    name: 'AP Claw',
    description: 'Automated vendor bill ingestion, OCR line-item extraction, 3-way matching, and scheduled payouts.',
    icon: Building2,
    codeSnippet: '3-WAY MATCH: 100% Verified (PO #4829)',
    highlight: false,
  },
  {
    name: 'AR Collector Claw',
    description: 'Autonomous invoice status tracking, gentle follow-up sequences, and instant payment reconciliation.',
    icon: Mail,
    codeSnippet: 'AR RECOVERY: £4,850 (+3 Invoices cleared)',
    highlight: false,
  },
  {
    name: 'Bookkeeper Claw',
    description: 'Real-time transaction categorization, GST/HST audit tagging, and continuous bank reconciliation.',
    icon: FileBarChart,
    codeSnippet: 'RECONCILED: 142 Txns (0 Audit Errors)',
    highlight: false,
  },
  {
    name: 'Controller Claw',
    description: 'Continuous anomaly detection, unauthorized expense flags, and automated double-entry audit logs.',
    icon: ShieldCheck,
    codeSnippet: 'AUDIT LOG: Ledger Passed (0 Anomalies)',
    highlight: false,
  },
];

const plans = [
  {
    name: 'Starter',
    price: 49,
    description: 'Perfect for solo founders getting started with AI finance.',
    features: ['2 AI Claws', 'Standard reconciliation', 'Basic cash alerts', '30-day history'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Business',
    price: 149,
    description: 'For growing teams that need automated financial ops.',
    features: [
      'All 5 AI Claws',
      'Automated email actions',
      'API & Accounting integrations',
      '90-day history',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'CFO Tier',
    price: 399,
    description: 'Enterprise-grade finance automation with full control.',
    features: [
      'Unlimited AI Claws',
      'Custom multi-agent workflows',
      'Dedicated support',
      'Unlimited history',
      'SSO & audit-ready exports',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function LandingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [invoiceVolume, setInvoiceVolume] = useState(150);
  const navigate = useNavigate();

  // Calculations for interactive ROI calculator
  const hoursSaved = Math.round(invoiceVolume * 0.25);
  const costSavings = Math.round(hoursSaved * 45);

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      
      {/* Background Lighting Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-gradient-to-b from-emerald-500/15 via-emerald-500/5 to-transparent blur-3xl rounded-full opacity-70" />
        <div className="absolute top-[45%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/5 blur-3xl rounded-full" />
      </div>

      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-[#090a0f]/85 backdrop-blur-xl border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Zap className="h-5 w-5 fill-emerald-400/20" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold text-white tracking-tight">
                ClawAI <span className="text-emerald-400">Stack</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase">
                Finance AI
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
            <a href="#features" className="hover:text-emerald-400 transition">Features</a>
            <a href="#roi-calculator" className="hover:text-emerald-400 transition">ROI Calculator</a>
            <a href="#pricing" className="hover:text-emerald-400 transition">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to="/auth" 
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-emerald-400 transition"
            >
              Sign In
            </Link>
            <Link 
              to="/auth" 
              className="px-4 py-2 rounded-xl text-sm font-semibold text-[#090a0f] bg-emerald-500 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
            >
              Get Started
            </Link>
          </div>

        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-16 pb-16 sm:pt-24 sm:pb-24 max-w-7xl mx-auto">
        <div className="relative text-center max-w-4xl mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400 shadow-inner"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Autonomous finance ops — live 24/7
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-tight"
          >
            Your Autonomous{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-500 bg-clip-text text-transparent">
              AI Finance Team
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl"
          >
            Deploy dedicated AI Claws for Cash-Flow Forecasting, Vendor Bills, Bookkeeping QA,
            and Automated AR Collections.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-bold text-[#090a0f] transition hover:bg-emerald-400 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-emerald-500/25 cursor-pointer"
            >
              Launch Your AI Claws
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-[#13151b] px-7 py-3.5 text-sm font-semibold text-white hover:bg-zinc-800/80 transition cursor-pointer"
            >
              Book Demo
            </button>
          </motion.div>
        </div>

        {/* Floating Perspective Hero Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 relative mx-auto max-w-5xl [perspective:1000px]"
        >
          <div className="relative rounded-2xl border border-zinc-800/80 bg-[#13151b]/95 p-4 sm:p-6 shadow-2xl backdrop-blur-xl group hover:border-emerald-500/40 transition duration-500 transform hover:rotate-x-1">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none rounded-2xl" />
            
            {/* Console Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs font-mono text-zinc-500">ClawAI Stack Console v2.4</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                <Activity className="h-3.5 w-3.5" /> 5 Active Agents Live
              </div>
            </div>

            {/* Dashboard Mockup Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Stat Cards */}
              <div className="flex flex-col gap-3">
                <div className="p-4 rounded-xl bg-[#090a0f] border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Liquid Cash Reserves</span>
                  <div className="text-2xl font-mono font-bold text-white mt-1">£115,000</div>
                  <span className="text-[11px] font-mono text-emerald-400 mt-1 block">Runway: 18.4 Months</span>
                </div>
                <div className="p-4 rounded-xl bg-[#090a0f] border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Overdue AR Collected</span>
                  <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">£4,850</div>
                  <span className="text-[11px] font-mono text-zinc-400 mt-1 block">+3 Invoices Recovered</span>
                </div>
              </div>

              {/* Embedded Mini Chart Preview */}
              <div className="lg:col-span-2 p-4 rounded-xl bg-[#090a0f] border border-zinc-800/80 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-zinc-300">Cash Reserves vs Outflow Trajectory</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">6 Month Forecast</span>
                </div>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={miniChartData}>
                      <defs>
                        <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#52525b" fontSize={10} tickLine={false} />
                      <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#13151b', borderColor: '#27272a', borderRadius: '8px', fontSize: '12px' }} 
                      />
                      <Area type="monotone" dataKey="cash" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#emeraldGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Live Floating Execution Badge overlay */}
            <motion.div 
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="hidden sm:flex absolute -bottom-4 right-6 p-3 rounded-xl bg-[#090a0f]/95 border border-emerald-500/40 shadow-2xl items-center gap-3 backdrop-blur-md"
            >
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">AR Collector Claw Active</span>
                <span className="text-[10px] text-zinc-400 font-mono">Reconciled Invoice #1094 (£1,450)</span>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </section>

      {/* Ticker Strip */}
      <section className="border-y border-zinc-800/60 bg-[#0c0e14] py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2 shrink-0">
            <Layers className="h-4 w-4 text-emerald-400" /> Native 1-Click Sync
          </span>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-zinc-400">
            {integrations.map((item) => (
              <span key={item} className="hover:text-emerald-400 transition cursor-default">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid Section */}
      <section id="features" className="relative z-10 px-6 py-24 bg-[#090a0f]/50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Core AI Claws
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-5xl tracking-tight">
              Five specialists. One finance stack.
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className={`group relative rounded-2xl border border-zinc-800/80 bg-[#13151b] p-6 transition-all duration-300 hover:border-emerald-500/50 hover:bg-[#181a22] flex flex-col justify-between ${
                  feature.highlight ? 'md:col-span-2 border-emerald-500/30 bg-gradient-to-br from-[#13151b] via-[#13151b] to-emerald-950/20' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition duration-300">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Autonomous Agent
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-white group-hover:text-emerald-400 transition">{feature.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feature.description}</p>
                </div>

                <div className="mt-6 pt-3 border-t border-zinc-800/60 flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-[#090a0f] p-3 rounded-lg border border-zinc-800">
                  <Terminal className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">{feature.codeSnippet}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive ROI Calculator */}
      <section id="roi-calculator" className="border-t border-zinc-800/80 px-6 py-24 bg-[#0c0e14]">
        <div className="mx-auto max-w-4xl rounded-2xl border border-zinc-800 bg-[#13151b] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="text-center max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mb-3">
              <Calculator className="h-3.5 w-3.5" /> ROI Calculator
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Calculate your monthly time & cost savings</h2>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Slider Control */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-zinc-300">Monthly Transactions / Invoices</span>
                <span className="font-mono text-emerald-400 font-bold text-base">{invoiceVolume} / mo</span>
              </div>
              <input 
                type="range" 
                min="20" 
                max="500" 
                step="10" 
                value={invoiceVolume} 
                onChange={(e) => setInvoiceVolume(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>20 txns</span>
                <span>250 txns</span>
                <span>500 txns</span>
              </div>
            </div>

            {/* Savings Output Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#090a0f] border border-zinc-800 text-center">
                <Clock className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Time Saved</span>
                <span className="text-2xl font-bold text-white font-mono">{hoursSaved} hrs</span>
                <span className="text-[10px] text-zinc-500 block">per month</span>
              </div>
              <div className="p-4 rounded-xl bg-[#090a0f] border border-zinc-800 text-center">
                <DollarSign className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Est. Cost Saved</span>
                <span className="text-2xl font-bold text-emerald-400 font-mono">${costSavings}</span>
                <span className="text-[10px] text-zinc-500 block">per month</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 border-t border-zinc-800/80 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Pricing</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-5xl tracking-tight">Scale your finance team, not headcount</h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-8 transition duration-300 ${
                  plan.highlighted
                    ? 'border-emerald-500/60 bg-gradient-to-b from-emerald-500/10 via-[#13151b] to-[#13151b] shadow-2xl shadow-emerald-500/10'
                    : 'border-zinc-800 bg-[#13151b] hover:border-zinc-700'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#090a0f] shadow-md">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                  <span className="text-sm text-zinc-400">/mo</span>
                </div>
                <p className="mt-3 text-sm text-zinc-400">{plan.description}</p>

                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-zinc-300">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/auth"
                  className={`mt-8 block rounded-xl py-3.5 text-center text-sm font-bold transition cursor-pointer ${
                    plan.highlighted
                      ? 'bg-emerald-500 text-[#090a0f] hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
                      : 'border border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-emerald-500/40 hover:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
      <LeadModal isOpen={isDemoModalOpen} onClose={() => setIsDemoModalOpen(false)} />
    </div>
  );
}