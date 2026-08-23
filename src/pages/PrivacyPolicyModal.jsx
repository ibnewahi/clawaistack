import { X, ShieldCheck } from 'lucide-react';

export default function PrivacyPolicyModal({ isOpen, onClose }) {
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
            We collect financial metadata, bank transaction read-outs, and enterprise integration keys (e.g., Odoo ERP, Zoho Books, QuickBooks, Xero) strictly to execute authorized AI operations such as AR collection, bill matching, and runway modeling.
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
            className="px-5 py-2 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}