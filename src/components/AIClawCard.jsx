const statusConfig = {
  active: {
    label: 'Active',
    dot: 'bg-accent',
    badge: 'bg-accent/15 text-accent border-accent/30',
  },
  'action-needed': {
    label: 'Action Needed',
    dot: 'bg-amber-400 animate-pulse',
    badge: 'bg-amber-400/15 text-amber-400 border-amber-400/30',
  },
  idle: {
    label: 'Idle',
    dot: 'bg-zinc-500',
    badge: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  },
}

export default function AIClawCard({
  name,
  description,
  status,
  tasksToday,
  icon: Icon,
}) {
  const config = statusConfig[status]

  return (
    <div className="group flex items-start gap-4 rounded-xl border border-surface-border bg-surface p-4 transition hover:border-accent/25 hover:bg-surface-elevated/50">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent transition group-hover:bg-accent/20">
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-sm font-semibold text-white">{name}</h3>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${config.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
            {config.label}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">{description}</p>
        <p className="mt-2 text-[11px] text-zinc-600">
          {tasksToday > 0 ? (
            <>
              <span className="font-medium text-zinc-400">{tasksToday}</span>{' '}
              tasks completed today
            </>
          ) : (
            'No tasks queued'
          )}
        </p>
      </div>
    </div>
  )
}
