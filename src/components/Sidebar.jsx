import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bot, Sliders, FileText, Settings, ShieldCheck } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Claws', path: '/claws', icon: Bot, badge: '3' },
    { name: 'Integrations', path: '/integrations', icon: Sliders },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-surface-border bg-surface flex flex-col justify-between h-screen p-4">
      <div className="space-y-6">
        <Link to="/dashboard" className="flex items-center gap-3 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-background font-bold text-lg">
            C
          </div>
          <span className="font-bold text-white text-base">ClawAI Stack</span>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-800/80 text-white font-semibold'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-zinc-400" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-surface-border pt-4 px-2 flex items-center gap-2 text-[11px] text-zinc-500">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        <span>System Operational</span>
      </div>
    </aside>
  );
}