import React from 'react';
import { Mail, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

const iconMap = {
  collection: Mail,
  forecast: TrendingUp,
  alert: AlertTriangle,
  reconciliation: CheckCircle2,
};

export default function InsightItem({
  type,
  title,
  description,
  action_text,
  action_type,
  time_ago,
  onAction,
}) {
  const IconComponent = iconMap[type] || AlertTriangle;

  return (
    <div className="flex items-start gap-4 rounded-xl border border-surface-border bg-surface p-4">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-accent">
        <IconComponent className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-white truncate">{title}</h4>
          <span className="text-[11px] text-zinc-500 shrink-0">{time_ago}</span>
        </div>
        <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{description}</p>
        {action_text && (
          <button
            onClick={() => onAction && onAction(action_type)}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
          >
            <span>{action_text}</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}