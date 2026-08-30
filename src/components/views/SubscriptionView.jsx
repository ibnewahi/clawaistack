import React, { useState } from 'react';
import { CreditCard, CheckCircle, ExternalLink, ShieldAlert } from 'lucide-react';

export default function SubscriptionView() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');

  const handleManualActivation = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate updating Supabase or notifying admin of payment proof
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 text-zinc-100">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscription & Billing</h1>
        <p className="text-zinc-400 text-sm mt-1">Manage your workspace plan and secure global payments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Plan Details Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO PLAN
              </span>
              <span className="text-xl font-bold">$29<span className="text-sm font-normal text-zinc-400">/month</span></span>
            </div>
            <h3 className="text-lg font-medium mt-4">ClawAI Stack Pro</h3>
            <p className="text-zinc-400 text-sm mt-1">Full access to multi-agent automation, dashboards, and automated accounting workflows.</p>
            
            <ul className="mt-6 space-y-3 text-sm text-zinc-300">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Unlimited Workspaces</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Advanced Financial Integrations</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400" /> Priority Support</li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800">
            <a 
              href="https://www.payoneer.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Pay via Payoneer Invoice <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Payment Verification Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-medium">Activate Subscription</h3>
            <p className="text-zinc-400 text-sm mt-1">Once you have completed your payment via Payoneer, enter your transaction reference below to instantly notify support and update your workspace access.</p>

            {submitted ? (
              <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-start gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Payment Reference Submitted!</p>
                  <p className="text-zinc-300 mt-1">Your account will be updated within 24 hours after manual verification.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleManualActivation} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Payoneer Transaction ID / Reference</label>
                  <input 
                    type="text" 
                    required
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g., PAY-12345678"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Confirm Payment'}
                </button>
              </form>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-800 flex items-start gap-2 text-xs text-zinc-400">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p>Global card payments are processed securely through Payoneer. Direct automatic renewals will be enabled once API integrations are available.</p>
          </div>
        </div>
      </div>
    </div>
  );
}