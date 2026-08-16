import { Link } from 'react-router-dom'
import { Bot } from 'lucide-react'

export default function LandingNavbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-surface-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
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

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#features"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            Pricing
          </a>
          <Link
          to="/dashboard"
          className="text-sm text-zinc-400 transition hover:text-white"
        >
          Dashboard
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        <Link
          to="/auth"
          className="hidden rounded-lg border border-surface-border px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-surface-border md:block"
        >
          Sign In
        </Link>
        <Link
          to="/auth"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background transition hover:bg-accent/90"
        >
          Get Started
        </Link>
      </div>
      </div>
    </header>
  )
}
