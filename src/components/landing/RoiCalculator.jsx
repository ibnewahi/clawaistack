import { useState } from 'react';
import { Calculator, Clock, DollarSign, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';

export default function RoiCalculator() {
  // Input States
  const [monthlyInvoices, setMonthlyInvoices] = useState(250);
  const [hourlyRate, setHourlyRate] = useState(45);
  const [teamSize, setTeamSize] = useState(2);

  // Constants (Averages based on accounting automation metrics)
  const HOURS_PER_INVOICE_MANUAL = 0.35; // ~21 minutes to process, verify, match, and log manually
  const AUTOMATION_EFFICIENCY = 0.85; // 85% time reduction with AI Claws
  const BUSINESS_PLAN_COST = 149; // $149/mo Business Tier

  // Dynamic Calculations
  const totalManualHours = Math.round(monthlyInvoices * HOURS_PER_INVOICE_MANUAL * teamSize);
  const hoursSavedPerMonth = Math.round(totalManualHours * AUTOMATION_EFFICIENCY);
  const monthlyLaborCostSaved = Math.round(hoursSavedPerMonth * hourlyRate);
  const netMonthlySavings = Math.max(0, monthlyLaborCostSaved - BUSINESS_PLAN_COST);
  const annualSavings = netMonthlySavings * 12;
  const roiPercentage = Math.round((netMonthlySavings / BUSINESS_PLAN_COST) * 100);

  return (
    <section id="roi-calculator" className="py-20 px-6 relative overflow-hidden bg-[#090a0f]">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs mb-4">
            <Calculator className="h-3.5 w-3.5" /> Interactive ROI Model
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Calculate Your Time & Cost Savings
          </h2>
          <p className="mt-4 text-zinc-400 text-base sm:text-lg">
            See how much manual finance overhead ClawAI Stack eliminates for your team every month.
          </p>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Sliders / Inputs */}
          <div className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-[#13151b]/80 p-6 sm:p-8 backdrop-blur-xl flex flex-col justify-between shadow-2xl">
            <div className="space-y-8">
              
              {/* Slider 1: Monthly Invoices & Bills */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <label className="font-medium text-zinc-200">Monthly Invoices & Receipts</label>
                  <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                    {monthlyInvoices.toLocaleString()} / mo
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="2000"
                  step="25"
                  value={monthlyInvoices}
                  onChange={(e) => setMonthlyInvoices(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                  <span>50</span>
                  <span>1,000</span>
                  <span>2,000+</span>
                </div>
              </div>

              {/* Slider 2: Average Hourly Rate */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <label className="font-medium text-zinc-200">Average Hourly Rate (Bookkeeper / Analyst)</label>
                  <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                    ${hourlyRate} / hr
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  step="5"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                  <span>$20/hr</span>
                  <span>$85/hr</span>
                  <span>$150/hr</span>
                </div>
              </div>

              {/* Slider 3: Finance Team Size */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <label className="font-medium text-zinc-200">Finance Team Members</label>
                  <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                    {teamSize} {teamSize === 1 ? 'person' : 'people'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={teamSize}
                  onChange={(e) => setTeamSize(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>

            </div>

            {/* Micro Feature Bullet Points */}
            <div className="mt-8 pt-6 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Automated 3-way line matching</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Zero-delay AR collection dispatch</span>
              </div>
            </div>
          </div>

          {/* Right Column: Output Metrics Card */}
          <div className="lg:col-span-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-[#13151b] via-[#0d0f14] to-emerald-950/20 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-3 bg-emerald-500/10 text-emerald-400 font-mono text-[10px] uppercase tracking-wider rounded-bl-xl border-l border-b border-emerald-500/20 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Real-time Estimate
            </div>

            <div className="space-y-6">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold block">
                Estimated Monthly Impact
              </span>

              {/* Stat 1: Hours Saved */}
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Time Reclaimed</div>
                    <div className="text-xl font-bold text-white font-mono">{hoursSavedPerMonth} hrs/mo</div>
                  </div>
                </div>
              </div>

              {/* Stat 2: Monthly Net Savings */}
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-400">Net Monthly Savings</div>
                    <div className="text-xl font-bold text-emerald-400 font-mono">${netMonthlySavings.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Stat 3: Annualized Impact */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-emerald-300">Annualized Savings</div>
                    <div className="text-2xl font-black text-white font-mono">${annualSavings.toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-emerald-400 font-bold block">
                    {roiPercentage}% ROI
                  </span>
                </div>
              </div>
            </div>

            {/* CTA inside Card */}
            <div className="mt-8 pt-4">
              <a
                href="#pricing"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-sm hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20"
              >
                Claim These Savings Now
              </a>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}