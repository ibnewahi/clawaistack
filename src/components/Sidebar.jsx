import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Cpu, Zap, FileText, Settings, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'AI Claws', path: '/claws', icon: Cpu, badge: '5' },
    { name: 'Integrations', path: '/integrations', icon: Zap },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-surface border-r border-surface-border flex flex-col justify-between select-none">
      <div>
        {/* Logo / Header */}
        <div className="p-6 border-b border-surface-border flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center font-bold text-zinc-950">
            C
          </div>
          <div>
            <h1 className="font-bold text-white text-sm">ClawAI Stack</h1>
            <p className="text-[10px] text-zinc-400">Autonomous Financial Intelligence</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive 
                    ? 'bg-accent/10 text-accent border border-accent/20' 
                    : 'text-zinc-400 hover:text-white hover:bg-surface-border/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    isActive ? 'bg-accent text-zinc-950' : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer: Sign Out & System Status */}
      <div className="p-4 border-t border-surface-border space-y-3">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-950/40 border border-red-500/10 transition cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] text-emerald-400 pt-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Operational</span>
        </div>
      </div>
    </aside>
  );
}