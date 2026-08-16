import { TrendingUp, TrendingDown, AlertTriangle, Clock } from 'lucide-react'

const trendConfig = {
  up: {
    color: 'text-accent',
    bg: 'bg-accent/10',
    Icon: TrendingUp,
  },
  down: {
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    Icon: TrendingDown,
  },
  neutral: {
    color: 'text-zinc-400',
    bg: 'bg-surface-elevated',
    Icon: Clock,
  },
}

export default function MetricCard({ title, value, change, trend, alert }) {
  const config = trendConfig[trend] || trendConfig.neutral
  const { color, bg, Icon } = config

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-surface p-5 transition hover:border-accent/30 ${
        alert ? 'border-red-500/30' : 'border-surface-border'
      }`}
    >
      {alert && (
        <div className="absolute right-3 top-3">
          <AlertTriangle className="h-4 w-4 text-red-400" />
        </div>
      )}

      <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${bg} ${color}`}
        >
          <Icon className="h-3 w-3" />
          {change}
        </span>
        {alert && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-red-400">
            Alert
          </span>
        )}
      </div>

      <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-accent/5 transition group-hover:bg-accent/10" />
    </div>
  )
}
