import { useState } from 'react';
import LeadModal from '../components/LeadModal';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Mail,
  FileBarChart,
  ShieldCheck,
  ArrowRight,
  Check,
  Zap,
} from 'lucide-react';
import LandingFooter from '../components/landing/LandingFooter';

const features = [
  {
    name: 'CFO Claw',
    description: 'Strategic cash forecasting, runway analysis, and executive alerts.',
    icon: Sparkles,
  },
  {
    name: 'AR Collector Claw',
    description: 'Autonomous invoice tracking and friendly follow-ups.',
    icon: Mail,
  },
  {
    name: 'Bookkeeper Claw',
    description: 'Real-time categorization and bank reconciliation.',
    icon: FileBarChart,
  },
  {
    name: 'Controller Claw',
    description: 'Anomaly detection and audit logs.',
    icon: ShieldCheck,
  },
];

const plans = [
  {
    name: 'Starter',
    price: 29,
    description: 'Perfect for solo founders getting started with AI finance.',
    features: ['1 AI Claw', 'Basic reporting', 'Email insights', '7-day history'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Business',
    price: 99,
    description: 'For growing teams that need automated financial ops.',
    features: [
      '3 AI Claws',
      'Automated email actions',
      'API integrations',
      '90-day history',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'CFO Tier',
    price: 249,
    description: 'Enterprise-grade finance automation with full control.',
    features: [
      'All AI Claws',
      'Custom workflows',
      'Dedicated support',
      'Unlimited history',
      'SSO & audit exports',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function LandingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 font-sans selection:bg-emerald-500/30">
      
      {/* Navigation Header with Code-Based Logo */}
      <nav className="sticky top-0 z-50 bg-[#090a0f]/80 backdrop-blur-md border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
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
            <a href="#pricing" className="hover:text-emerald-400 transition">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to="/auth" 
              className="px-4 py-2 text-sm font-medium text-white hover:text-emerald-400 transition"
            >
              Sign In
            </Link>
            <Link 
              to="/auth" 
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#090a0f] bg-emerald-500 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
            >
              Get Started
            </Link>
          </div>

        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pb-24 pt-16 sm:pb-32 sm:pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400">
            <Zap className="h-3.5 w-3.5" />
            Autonomous finance ops — live 24/7
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your Autonomous{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
              AI Finance Team
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
            Deploy dedicated AI Claws for Cash-Flow Forecasting, Bookkeeping QA,
            and Automated AR Collections.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-[#090a0f] transition hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
            >
              Launch Your AI Claws
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setIsDemoModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-[#13151b] px-7 py-3.5 text-sm font-semibold text-white hover:bg-zinc-800 transition"
            >
              Book Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-zinc-800/80 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Core AI Claws
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Four specialists. One finance stack.
            </h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="group rounded-2xl border border-zinc-800 bg-[#13151b] p-6 transition hover:border-emerald-500/40 hover:bg-zinc-800/50"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-white">{feature.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-t border-zinc-800/80 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Pricing</p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Scale your finance team, not headcount</h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  plan.highlighted
                    ? 'border-emerald-500/50 bg-emerald-500/5 shadow-xl shadow-emerald-500/10'
                    : 'border-zinc-800 bg-[#13151b]'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#090a0f]">
                    Most Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">${plan.price}</span>
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
                  className={`mt-8 block rounded-xl py-3 text-center text-sm font-semibold transition ${
                    plan.highlighted
                      ? 'bg-emerald-500 text-[#090a0f] hover:bg-emerald-400'
                      : 'border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-emerald-500/40 hover:text-white'
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