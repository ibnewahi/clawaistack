import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FeatureGate({ requiredTier = 'starter', children }) {
  const [userTier, setUserTier] = useState('free');
  const [loading, setLoading] = useState(true);

  // Define tier hierarchy weights for comparison
  const tierWeights = { free: 0, starter: 1, business: 2, cfo: 3 };

  useEffect(() => {
    async function fetchUserTier() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Query the profiles table to fetch the active tier
        const { data } = await supabase
          .from('profiles')
          .select('tier')
          .eq('id', user.id)
          .single();
        
        if (data && data.tier) {
          setUserTier(data.tier);
        }
      }
      setLoading(false);
    }
    fetchUserTier();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-500 text-xs font-mono">
        Verifying account permissions...
      </div>
    );
  }

  const hasAccess = (tierWeights[userTier] || 0) >= (tierWeights[requiredTier] || 0);

  if (!hasAccess) {
    return (
      <div className="relative rounded-2xl border border-zinc-800 bg-[#13151b] p-8 text-center overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-lg">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Upgrade Required</h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-5 leading-relaxed">
            This module requires the <span className="text-emerald-400 font-semibold uppercase">{requiredTier} Tier</span> or higher to execute autonomous financial operations.
          </p>
          <Link
            to="/pricing"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-[#090a0f] text-xs font-bold hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            View Pricing Tiers
          </Link>
        </div>
        
        {/* Blurred preview mock behind the lock overlay */}
        <div className="opacity-20 filter blur-sm space-y-3 select-none pointer-events-none">
          <div className="h-4 w-3/4 bg-zinc-700 rounded" />
          <div className="h-24 w-full bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  return children;
}