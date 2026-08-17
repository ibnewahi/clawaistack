import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  Layers, 
  FileText, 
  Settings, 
  LogOut 
} from 'lucide-react';

const iconMap = {
  LayoutDashboard,
  Cpu,
  Layers,
  FileText,
  Settings
};

export default function Sidebar({ navItems = [], activeNav, onNavChange }) {
  return (
    <aside className="flex w-64 flex-col border-r border-surface-border bg-background p-4">
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-bold text-background">
          C
        </div>
        <span className="text-base font-semibold text-white">ClawAI Stack</span>
      </div>

      <nav className="mt-6 flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = activeNav === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavChange && onNavChange(item.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-surface text-white'
                  : 'text-zinc-400 hover:bg-surface/50 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-surface-border pt-4">
        <div className="flex items-center gap-3 px-2 py-2 text-xs text-zinc-500">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>System Operational</span>
        </div>
      </div>
    </aside>
  );
}