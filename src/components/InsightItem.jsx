import { Mail, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'

const typeConfig = {
  collection: {
    icon: Mail,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10',
  },
  forecast: {
    icon: TrendingUp,
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  margin: {
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-400/10',
  },
  reconciliation: {
    icon: CheckCircle2,
    color: 'text-zinc-400',
    bg: 'bg-surface-elevated',
  },
}

const priorityDot = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  normal: 'bg-accent',
  low: 'bg-zinc-600',
}

export default function InsightItem({
  type,
  title,
  description,
  time,
  priority,
  actionLabel,
  isLast,
  onAction,
}) {
  const config = typeConfig[type] || typeConfig.reconciliation
  const Icon = config.icon

  return (
    <div
      className={`flex gap-4 p-4 transition hover:bg-surface-elevated/40 ${
        !isLast ? 'border-b border-surface-border' : ''
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
      >
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${priorityDot[priority]}`}
              />
              <h3 className="truncate text-sm font-medium text-white">{title}</h3>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              {description}
            </p>
          </div>
          <span className="shrink-0 text-[11px] text-zinc-600">{time}</span>
        </div>

        {actionLabel && (
          <button
            onClick={onAction}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/20"
          >
            {actionLabel}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}
