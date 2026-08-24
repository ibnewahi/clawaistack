import React, { useState, useEffect } from 'react';
import { Check, Zap, Shield, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PricingPage() {
  const [currentTier, setCurrentTier] = useState('Starter');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch the user's current tier on load
  useEffect(() => {
    async function fetchUserTier() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('tier')
          .eq('id', user.id)
          .single();
        
        if (data && data.tier) {
          setCurrentTier(data.tier);
        }
      }
    }
    fetchUserTier();
  }, []);

  // Handle tier upgrade action
  const handleUpgrade = async (newTier) => {
    setIsLoading(true);
    setMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found.');

      // Update the user profile tier in Supabase
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ id: user.id, tier: newTier, updated_at: new Date() });

      if (error) throw error;

      setCurrentTier(newTier);
      setMessage(`Successfully updated subscription to ${newTier}!`);
      setIsLoading(false);
    } catch (err) {
      console.error('Error updating tier:', err.message);
      setMessage('Failed to update tier. Please try again.');
      setIsLoading(false);
    }
  };

  // Synchronized with accurate claw distribution per tier
  const plans = [
    {
      name: 'Starter',
      price: '$49',
      description: 'Perfect for solo founders getting started with AI finance.',
      features: ['Bookkeeper Claw', 'Standard reconciliation', 'Basic cash alerts', '30-day history'],
      tierKey: 'Starter'
    },
    {
      name: 'Business',
      price: '$149',
      description: 'For growing teams that need automated financial ops.',
      features: ['Bookkeeper, AR & AP Claws', 'Automated email actions', 'API & Accounting integrations', '90-day history', 'Priority support'],
      tierKey: 'Business',
      popular: true
    },
    {
      name: 'CFO Tier',
      price: '$399',
      description: 'Enterprise-grade finance automation with full control.',
      features: ['All 5 AI Claws (Includes CFO & Controller)', 'Custom multi-agent workflows', 'Dedicated support', 'Unlimited history', 'SSO & audit-ready exports'],
      tierKey: 'CFO Tier'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 font-sans text-white">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-extrabold tracking-tight">Workspace Subscription Plans</h2>
        <p className="mt-3 text-zinc-400 text-sm">
          Scale your finance team, not headcount. Choose the tier that matches your operational volume.
        </p>
        {message && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-medium">
            {message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrent = currentTier === plan.tierKey;
          return (
            <div 
              key={plan.name}
              className={`bg-[#13151b] rounded-2xl p-6 border flex flex-col justify-between shadow-xl transition relative ${
                isCurrent ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              {plan.popular && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-[#090a0f] text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-[#090a0f] text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full">
                  Active Plan
                </span>
              )}

              <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className="ml-1 text-sm text-zinc-400">/mo</span>
                </div>
                <p className="mt-4 text-xs text-zinc-400 leading-relaxed">{plan.description}</p>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-xs text-zinc-300">
                      <Check className="h-4 w-4 text-emerald-400 mr-2 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <button
                  disabled={isCurrent || isLoading}
                  onClick={() => handleUpgrade(plan.tierKey)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-zinc-800 text-zinc-500 cursor-default'
                      : 'bg-emerald-500 text-[#090a0f] hover:bg-emerald-400 disabled:opacity-50'
                  }`}
                >
                  {isCurrent ? 'Active Plan' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}