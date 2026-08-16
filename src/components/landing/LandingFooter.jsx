import { Link } from 'react-router-dom'
import { Bot } from 'lucide-react'

const footerLinks = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Dashboard', to: '/dashboard' },
  ],
  Company: [
    { label: 'About', to: '/about' },
    { label: 'Blog', to: '/blog' },
    { label: 'Careers', to: '/careers' },
  ],
  Legal: [
    { label: 'Privacy', to: '/privacy' },
    { label: 'Terms', to: '/terms' },
    { label: 'Security', to: '/security' },
  ],
}

export default function LandingFooter() {
  return (
    <footer className="border-t border-surface-border px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
                <Bot className="h-3.5 w-3.5 text-background" />
              </div>
              <span className="text-sm font-bold text-white">ClawAI Stack</span>
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              Autonomous AI agents for modern finance teams.
            </p>
          </div>

          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {group}
              </p>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-sm text-zinc-500 transition hover:text-accent"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-zinc-500 transition hover:text-accent"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-surface-border pt-8 sm:flex-row">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} ClawAI Stack. All rights reserved.
          </p>
          <p className="text-xs text-zinc-600">
            Built for B2B finance teams who move fast.
          </p>
        </div>
      </div>
    </footer>
  )
}
