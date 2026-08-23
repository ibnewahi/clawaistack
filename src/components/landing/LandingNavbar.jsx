import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingNavbar({ onOpenDemo }) {
  return (
    <nav className="sticky top-0 z-50 bg-[#090a0f]/80 backdrop-blur-xl border-b border-zinc-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 group-hover:border-emerald-500/60 transition duration-300">
            <Zap className="h-5 w-5 fill-emerald-400/20 group-hover:scale-110 transition duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold text-white tracking-tight">
              ClawAI <span className="text-emerald-400">Stack</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-zinc-400 font-medium tracking-wider uppercase">
                Finance AI
              </span>
            </div>
          </div>
        </div>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
          <a href="#roi-calculator" className="hover:text-emerald-400 transition-colors">ROI Calculator</a>
          <a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={onOpenDemo}
            className="hidden sm:inline-flex text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Book Demo
          </button>
          <Link 
            to="/auth" 
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link 
            to="/auth" 
            className="px-4 py-2 rounded-xl text-sm font-bold text-[#090a0f] bg-emerald-500 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            Get Started
          </Link>
        </div>

      </div>
    </nav>
  );
}