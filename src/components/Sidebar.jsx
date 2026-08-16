import { Link } from 'react-router-dom'
import { Bot } from 'lucide-react'

export default function Sidebar({ navItems, activeNav, onNavChange }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-surface-border bg-surface">
      {/* Logo */}
      <Link
        to="/"
        className="flex h-16 items-center gap-2.5 border-b border-surface-border px-5 transition hover:bg-surface-elevated/50"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
          <Bot className="h-4 w-4 text-background" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-white">
            ClawAI Stack
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            Your AI Finance Team
          </p>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeNav === id
          return (
            <button
              key={id}
              onClick={() => onNavChange(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-zinc-400 hover:bg-surface-elevated hover:text-zinc-200'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-accent' : ''}`} />
              {label}
              {id === 'ai-claws' && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">
                  3
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-surface-border p-4">
        <div className="rounded-lg bg-accent/10 p-3">
          <p className="text-xs font-semibold text-accent">Pro Plan</p>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            3 AI Claws active · 847 tasks this month
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
            <div className="h-full w-3/4 rounded-full bg-accent" />
          </div>
          <p className="mt-1 text-[10px] text-zinc-600">75% of monthly quota</p>
        </div>
      </div>
    </aside>
  )
}
