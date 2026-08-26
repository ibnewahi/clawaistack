import React from 'react';
import { Bot, Lock, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusConfig = {
  active: {
    label: 'Active',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25',
  },
  'action-needed': {
    label: 'Action Needed',
    dot: 'bg-amber-400 animate-pulse',
    badge: 'bg-amber-400/15 text-amber-400 border-amber-400/30 hover:bg-amber-400/25',
  },
  paused: {
    label: 'Paused',
    dot: 'bg-zinc-500',
    badge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30 hover:bg-zinc-500/25',
  },
  idle: {
    label: 'Paused',
    dot: 'bg-zinc-500',
    badge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30 hover:bg-zinc-500/25',
  },
};

// Tier hierarchy weight for comparison
const tierWeights = {
  'Starter': 1,
  'Business': 2,
  'CFO Tier': 3,
};

export default function AIClawCard({
  id,
  name,
  description,
  status = 'paused',
  tasksToday = 0,
  icon: Icon = Bot,
  requiredTier = 'Starter',
  userTier = 'Starter',
  onToggleStatus,
}) {
  const navigate = useNavigate();
  const RenderIcon = Icon || Bot;
  const config = statusConfig[status] || statusConfig.paused;

  // Check if user's tier meets or exceeds the required tier
  const userWeight = tierWeights[userTier] || 1;
  const requiredWeight = tierWeights[requiredTier] || 1;
  const isLocked = userWeight < requiredWeight;

  return (
    <div className={`group relative flex items-start gap-4 rounded-xl border p-4 transition ${
      isLocked 
        ? 'border-zinc-800/80 bg-zinc-900/40 opacity-75' 
        : 'border-zinc-800/80 bg-[#13151b] hover:border-emerald-500/25 hover:bg-[#181b24]'
    }`}>
      {/* Icon Section */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition ${
        isLocked 
          ? 'bg-zinc-800 text-zinc-500' 
          : 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20'
      }`}>
        {isLocked ? <Lock className="h-5 w-5" /> : <RenderIcon className="h-5 w-5" />}
      </div>

      {/* Content Section */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <h3 className="truncate text-sm font-semibold text-white">{name}</h3>
            {isLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                Requires {requiredTier}
              </span>
            )}
          </div>

          {!isLocked && (
            <button
              type="button"
              onClick={onToggleStatus}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition cursor-pointer ${config.badge}`}
              title="Click to toggle status"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
              {config.label}
            </button>
          )}
        </div>

        <p className="mt-1 text-xs leading-relaxed text-zinc-400">{description}</p>

        {/* Footer info or Upgrade Call to Action */}
        {isLocked ? (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">Upgrade your workspace to unlock this claw.</span>
            <button
              type="button"
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
            >
              Upgrade Now <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <p className="mt-2 text-[11px] text-zinc-500">
            {tasksToday > 0 ? (
              <>
                <span className="font-medium text-zinc-300">{tasksToday}</span>
                {' task' + (tasksToday > 1 ? 's' : '') + ' processed today'}
              </>
            ) : (
              'No tasks run today'
            )}
          </p>
        )}
      </div>
    </div>
  );
}