import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/Logo';

export default function LandingFooter() {
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
            <Link 
              to="/" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center cursor-pointer group"
            >
              <Logo className="h-8 w-auto" />
            </Link>
            
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
              <li><Link to="/pricing" className="hover:text-emerald-400 transition">Pricing</Link></li>
              <li><Link to="/auth" className="hover:text-emerald-400 transition">Console Login</Link></li>
            </ul>
          </div>

          {/* Supported Integrations */}
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

          {/* Legal Links - Direct Navigation */}
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block mb-4">Legal & Governance</span>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-emerald-400 transition block"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-emerald-400 transition block"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/security"
                  className="hover:text-emerald-400 transition block"
                >
                  Security & Audit Logs
                </Link>
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
    </footer>
  );
}