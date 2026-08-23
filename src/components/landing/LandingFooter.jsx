import { useState } from 'react';
import { Zap, ShieldCheck, ArrowRight, X, Lock, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

/* --- Legal Modals --- */

function PrivacyPolicyModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-[#13151b] p-6 sm:p-8 text-zinc-300 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-400 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest mb-2">
          <ShieldCheck className="h-4 w-4" /> Legal Governance
        </div>
        <h2 className="text-2xl font-bold text-white mb-6">Privacy Policy</h2>

        <div className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <p>
            <strong className="text-zinc-200">Effective Date:</strong> January 1, 2026
          </p>
          <p>
            At ClawAI Stack, we take your financial data privacy seriously. This Privacy Policy outlines how we collect, process, and protect client ledger data, payment credentials, and system metrics.
          </p>

          <h3 className="text-base font-semibold text-white pt-2">1. Information Collection & Usage</h3>
          <p>
            We collect financial metadata, bank transaction read-outs, and enterprise integration keys strictly to execute authorized AI operations such as AR collection, bill matching, and runway modeling.
          </p>

          <h3 className="text-base font-semibold text-white pt-2">2. Data Isolation & Security</h3>
          <p>
            Client data is never pooled or used to train public machine learning models. All ledger inputs are processed in isolated operational containers protected by 256-bit AES encryption at rest and TLS 1.3 in transit.
          </p>

          <h3 className="text-base font-semibold text-white pt-2">3. Third-Party Integrations</h3>
          <p>
            OAuth access tokens granted to ClawAI Stack for accounting software are encrypted at the hardware security layer (HSM) and can be revoked by the user at any time.
          </p>

          <h3 className="text-base font-semibold text-white pt-2">4. Your Data Rights</h3>
          <p>
            You retain 100% ownership of your financial records. You may request a complete export or immediate purge of all stored audit logs by submitting a request to legal@clawaistack.com.
          </p>
        </div>

        <div className="mt-8 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function TermsOfServiceModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-[#13151b] p-6 sm:p-8 text-zinc-300 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-400 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest mb-2">
          <FileText className="h-4 w-4" /> Platform Agreement
        </div>
        <h2 className="text-2xl font-bold text-white mb-6">Terms of Service</h2>

        <div className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <p>
            <strong className="text-zinc-200">Last Updated:</strong> March 2026
          </p>
          <p>
            By accessing or subscribing to ClawAI Stack, you agree to comply with the following terms governing our autonomous finance operations framework.
          </p>

          <h3 className="text-base font-semibold text-white pt-2">1. Scope of AI Automation</h3>
          <p>
            ClawAI Stack provides autonomous finance specialized agents ("Claws") designed for bookkeeping QA, cashflow forecasting, AP matching, and AR recovery. While AI Claws execute tasks automatically, final financial approvals remain under human supervision.
          </p>

          <h3 className="text-base font-semibold text-white pt-2">2. Subscription & Billing</h3>
          <p>
            Plans (Starter, Business, CFO Tier) are billed monthly or annually in advance. Subscriptions auto-renew unless cancelled at least 24 hours prior to the billing cycle reset.
          </p>

          <h3 className="text-base font-semibold text-white pt-2">3. Acceptable Use</h3>
          <p>
            You agree not to upload fraudulent accounting data, bypass audit safeguards, or attempt reverse engineering of underlying multi-agent routines.
          </p>

          <h3 className="text-base font-semibold text-white pt-2">4. Limitation of Liability</h3>
          <p>
            ClawAI Stack is an operational software platform and does not replace certified public accountants (CPAs) or tax counsel. Liability is limited to the subscription amount paid in the preceding 12-month period.
          </p>
        </div>

        <div className="mt-8 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SecurityAuditModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-[#13151b] p-6 sm:p-8 text-zinc-300 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-400 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest mb-2">
          <Lock className="h-4 w-4" /> Enterprise Security
        </div>
        <h2 className="text-2xl font-bold text-white mb-6">Security & Audit Logs</h2>

        <div className="space-y-4 text-sm leading-relaxed text-zinc-400">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            SOC2 Type II Compliant Architecture • Immutable Ledger Logging Active
          </div>

          <h3 className="text-base font-semibold text-white pt-2">1. Continuous Immutable Audit Trails</h3>
          <p>
            Every execution, automated email send, and reconciliation action performed by an AI Claw generates an append-only audit record tagged with cryptographic hashes.
          </p>

          <h3 className="text-base font-semibold text-white pt-2">2. Zero-Trust Access Controls</h3>
          <p>
            We implement strict Role-Based Access Control (RBAC) and optional Single Sign-On (SSO) with Multi-Factor Authentication (MFA) to prevent unauthorized entry into system workflows.
          </p>

          <h3 className="text-base font-semibold text-white pt-2">3. Encryption Standards</h3>
          <p>
            All financial API payloads are protected via TLS 1.3 encryption in transit and AES-256 encryption at rest. Database secrets are rotated automatically every 30 days.
          </p>
        </div>

        <div className="mt-8 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Main Footer Component --- */

export default function LandingFooter() {
  const [activeModal, setActiveModal] = useState(null);

  return (
    <footer className="relative z-10 border-t border-zinc-800/80 bg-[#06070a] text-zinc-400">
      
      {/* Pre-Footer CTA Banner */}
      <div className="border-b border-zinc-800/60 py-16 px-6">
        <div className="max-w-5xl mx-auto rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-[#13151b] to-emerald-950/20 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to deploy your autonomous finance team?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
            Connect your accounting stack in under 2 minutes and let AI Claws handle cash forecasting, AR collections, and audit QA.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-7 py-3 text-sm font-bold text-[#090a0f] transition hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 hover:scale-[1.02]"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Link Directory */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Zap className="h-4 w-4 fill-emerald-400/20" />
              </div>
              <span className="text-lg font-extrabold text-white tracking-tight">
                ClawAI <span className="text-emerald-400">Stack</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              Autonomous AI agents engineered for cash-flow forecasting, vendor bill processing, bookkeeping QA, and automated AR collections.
            </p>
            <div className="inline-flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5" /> All AI Claws Operational
            </div>
          </div>

          {/* Product Links */}
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block mb-4">Product</span>
            <ul className="space-y-2.5 text-xs font-medium">
              <li><a href="#features" className="hover:text-emerald-400 transition">AI Claws</a></li>
              <li><a href="#roi-calculator" className="hover:text-emerald-400 transition">ROI Calculator</a></li>
              <li><a href="#pricing" className="hover:text-emerald-400 transition">Pricing</a></li>
              <li><Link to="/auth" className="hover:text-emerald-400 transition">Console Login</Link></li>
            </ul>
          </div>

          {/* Supported Integrations (Non-clickable Trust Indicators) */}
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block mb-4">
              Supported Integrations
            </span>
            <ul className="space-y-2.5 text-xs text-zinc-400 font-medium select-none">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" /> Odoo ERP
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" /> Zoho Books
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" /> QuickBooks Online
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" /> Xero & Stripe
              </li>
            </ul>
          </div>

          {/* Legal Links (Clickable Modals) */}
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block mb-4">Legal & Governance</span>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('privacy')}
                  className="hover:text-emerald-400 transition cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('terms')}
                  className="hover:text-emerald-400 transition cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveModal('security')}
                  className="hover:text-emerald-400 transition cursor-pointer text-left"
                >
                  Security & Audit Logs
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} ClawAI Stack. All rights reserved.</p>
          <div className="flex items-center gap-6 font-mono text-[11px]">
            <span>SOC2 Type II Ready</span>
            <span>256-Bit SSL Encryption</span>
          </div>
        </div>
      </div>

      {/* Render Legal Modals */}
      <PrivacyPolicyModal isOpen={activeModal === 'privacy'} onClose={() => setActiveModal(null)} />
      <TermsOfServiceModal isOpen={activeModal === 'terms'} onClose={() => setActiveModal(null)} />
      <SecurityAuditModal isOpen={activeModal === 'security'} onClose={() => setActiveModal(null)} />
    </footer>
  );
}