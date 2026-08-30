import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 font-sans px-6 py-16">
      <div className="max-w-3xl mx-auto">
        
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 mb-8 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Legal Governance</span>
            <h1 className="text-3xl font-bold text-white mt-1">Privacy Policy</h1>
          </div>
        </div>

        <p className="text-xs text-zinc-400 font-mono mb-8">Effective Date: January 1, 2026</p>

        {/* Content Body */}
        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed bg-[#13151b] border border-zinc-800/80 p-8 rounded-2xl shadow-xl">
          <p>
            At ClawAI Stack, we take your financial data privacy seriously. This Privacy Policy outlines how we collect, process, and protect client ledger data, payment credentials, and system metrics[cite: 1].
          </p>

          <h3 className="text-lg font-bold text-white pt-4 border-t border-zinc-800">1. Information Collection & Usage</h3>
          <p>
            We collect financial metadata, bank transaction read-outs, and enterprise integration keys strictly to execute authorized AI operations such as AR collection, bill matching, and runway modeling[cite: 1].
          </p>

          <h3 className="text-lg font-bold text-white pt-4 border-t border-zinc-800">2. Data Isolation & Security</h3>
          <p>
            Client data is never pooled or used to train public machine learning models. All ledger inputs are processed in isolated operational containers protected by 256-bit AES encryption at rest and TLS 1.3 in transit[cite: 1].
          </p>

          <h3 className="text-lg font-bold text-white pt-4 border-t border-zinc-800">3. Third-Party Integrations</h3>
          <p>
            OAuth access tokens granted to ClawAI Stack for accounting software are encrypted at the hardware security layer (HSM) and can be revoked by the user at any time[cite: 1].
          </p>

          <h3 className="text-lg font-bold text-white pt-4 border-t border-zinc-800">4. Your Data Rights</h3>
          <p>
            You retain 100% ownership of your financial records. You may request a complete export or immediate purge of all stored audit logs by submitting a request to legal@clawaistack.com[cite: 1].
          </p>
        </div>

      </div>
    </div>
  );
}