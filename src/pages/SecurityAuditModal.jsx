import { X, Lock, CheckCircle2 } from 'lucide-react';

export default function SecurityAuditModal({ isOpen, onClose }) {
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
            <CheckCircle2 className="h-5 w-5 shrink-0" />
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
            className="px-5 py-2 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}