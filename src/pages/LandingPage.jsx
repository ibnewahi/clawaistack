import { useState } from 'react'
import LeadModal from '../components/LeadModal'
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
} from 'lucide-react'
import LandingNavbar from '../components/landing/LandingNavbar'
import LandingFooter from '../components/landing/LandingFooter'

const features = [
  {
    name: 'CFO Claw',
    description:
      'Strategic cash forecasting, runway analysis, and executive alerts.',
    icon: Sparkles,
  },
  {
    name: 'AR Collector Claw',
    description:
      'Autonomous invoice tracking and friendly follow-ups.',
    icon: Mail,
  },
  {
    name: 'Bookkeeper Claw',
    description:
      'Real-time categorization and bank reconciliation.',
    icon: FileBarChart,
  },
  {
    name: 'Controller Claw',
    description:
      'Anomaly detection and audit logs.',
    icon: ShieldCheck,
  },
]

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
]

export default function LandingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false)
    const navigate = useNavigate();
  
    return (
      <div className="min-h-screen bg-background text-zinc-100">
        <LandingNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-16 sm:pb-32 sm:pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-accent/8 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent">
            <Zap className="h-3.5 w-3.5" />
            Autonomous finance ops — live 24/7
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your Autonomous{' '}
            <span className="bg-gradient-to-r from-accent to-emerald-300 bg-clip-text text-transparent">
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
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-background transition hover:bg-accent-hover"
            >
              Launch Your AI Claws
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
  type="button"
  onClick={() => setIsDemoModalOpen(true)}
  className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-7 py-3.5 text-sm font-semibold text-white hover:bg-zinc-800 transition"
>
  Book Demo
</button>
          </div>

          {/* Social proof strip */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-6 border-t border-surface-border pt-10">
            {[
              { value: '847+', label: 'Tasks automated daily' },
              { value: '99.7%', label: 'Reconciliation accuracy' },
              { value: '18 days', label: 'Avg. AR reduction' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-zinc-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-surface-border px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Core AI Claws
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Four specialists. One finance stack.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              Each Claw runs autonomously on your financial data — forecasting,
              collecting, reconciling, and auditing around the clock.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="group rounded-2xl border border-surface-border bg-surface p-6 transition hover:border-accent/30 hover:bg-surface-elevated/50"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:bg-accent/20">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-white">
                  {feature.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-surface-border px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Scale your finance team, not headcount
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              Start with one Claw and upgrade as your operations grow. No setup
              fees, cancel anytime.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  plan.highlighted
                    ? 'border-accent/50 bg-accent/5 shadow-lg shadow-accent/10'
                    : 'border-surface-border bg-surface'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-background">
                    Most Popular
                  </span>
                )}

                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-zinc-500">/mo</span>
                </div>
                <p className="mt-3 text-sm text-zinc-500">{plan.description}</p>

                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5 text-sm text-zinc-300"
                    >
                      <Check className="h-4 w-4 shrink-0 text-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/dashboard"
                  className={`mt-8 block rounded-xl py-3 text-center text-sm font-semibold transition ${
                    plan.highlighted
                      ? 'bg-accent text-background hover:bg-accent-hover'
                      : 'border border-surface-border bg-surface-elevated text-zinc-300 hover:border-accent/40 hover:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-surface-border px-6 py-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-accent/30 bg-accent/5 px-8 py-12 text-center">
          <Bot className="mx-auto h-10 w-10 text-accent" />
          <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
            Ready to deploy your AI finance team?
          </h2>
          <p className="mt-3 text-zinc-400">
            Go live in minutes. Your Claws start working the moment you connect
            your accounts.
          </p>
          <Link
            to="/auth"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-background transition hover:bg-accent-hover"
          >
            Launch Your AI Claws
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
      <LandingFooter />
      <LeadModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
      />
    </div>
  )
}
