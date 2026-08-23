import { X, FileText } from 'lucide-react';

export default function TermsOfServiceModal({ isOpen, onClose }) {
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
            ClawAI Stack provides autonomous finance specialized agents ("Claws") designed for bookkeeping QA, cashflow forecasting, AP matching, and AR recovery. While AI Claws execute tasks automatically, final financial approvals and payout authorization remain under human supervision.
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
            className="px-5 py-2 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}