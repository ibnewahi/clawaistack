import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricCard({ title, value, changePercent, isPositive }) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface p-5">
      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{title}</p>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl font-bold text-white">{value}</span>
        {changePercent && (
          <span
            className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="mr-1 h-3 w-3" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3" />
            )}
            {changePercent}
          </span>
        )}
      </div>
    </div>
  );
}