import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function SecurityPolicy() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 font-sans px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 mb-8 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Infrastructure Security</span>
            <h1 className="text-3xl font-bold text-white mt-1">Security & Audit Logs</h1>
          </div>
        </div>

        <p className="text-xs text-zinc-400 font-mono mb-8">Compliance Standard: SOC 2 Type II Ready & 256-Bit SSL</p>

        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed bg-[#13151b] border border-zinc-800/80 p-8 rounded-2xl shadow-xl">
          <p>
            Security is engineered into the core of ClawAI Stack. We protect your corporate ledger and financial pipelines using institutional-grade safeguards[cite: 1].
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#090a0f] border border-zinc-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mb-2" />
              <h4 className="font-bold text-white">Encryption in Transit & Rest</h4>
              <p className="text-xs text-zinc-400 mt-1">All data is secured via TLS 1.3 channels and AES-256 bit database encryption[cite: 1].</p>
            </div>
            <div className="p-4 rounded-xl bg-[#090a0f] border border-zinc-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mb-2" />
              <h4 className="font-bold text-white">Isolated Containers</h4>
              <p className="text-xs text-zinc-400 mt-1">Your multi-agent workloads run in strict sandboxed environments with zero data cross-contamination[cite: 1].</p>
            </div>
          </div>

          <h3 className="text-lg font-bold text-white pt-4 border-t border-zinc-800">Audit Compliance</h3>
          <p>
            Every transaction categorization, invoice follow-up, and bill match generates an immutable audit trail entry compatible with standard accounting regulations[cite: 1].
          </p>
        </div>
      </div>
    </div>
  );
}