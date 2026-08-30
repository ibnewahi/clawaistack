import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 font-sans px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 mb-8 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Legal Governance</span>
            <h1 className="text-3xl font-bold text-white mt-1">Terms of Service</h1>
          </div>
        </div>

        <p className="text-xs text-zinc-400 font-mono mb-8">Effective Date: January 1, 2026</p>

        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed bg-[#13151b] border border-zinc-800/80 p-8 rounded-2xl shadow-xl">
          <p>
            Welcome to ClawAI Stack. By accessing or using our autonomous finance and multi-agent platform, you agree to be bound by these Terms of Service[cite: 1].
          </p>

          <h3 className="text-lg font-bold text-white pt-4 border-t border-zinc-800">1. Subscriptions & Billing</h3>
          <p>
            ClawAI Stack services are billed on a subscription basis. You agree to provide accurate billing details and maintain valid payment methods for your chosen tier[cite: 1].
          </p>

          <h3 className="text-lg font-bold text-white pt-4 border-t border-zinc-800">2. Autonomous Agent Execution</h3>
          <p>
            While our AI Claws (CFO, AP, AR, Bookkeeper, Controller) are engineered for high precision, users remain ultimately responsible for final financial statement approvals, tax filings, and regulatory submissions[cite: 1].
          </p>

          <h3 className="text-lg font-bold text-white pt-4 border-t border-zinc-800">3. Limitation of Liability</h3>
          <p>
            ClawAI Stack is provided on an "as is" basis. We strive for 99.9% operational uptime and strict calculation accuracy, but assume no liability for indirect financial loss resulting from third-party accounting sync errors[cite: 1].
          </p>
        </div>
      </div>
    </div>
  );
}