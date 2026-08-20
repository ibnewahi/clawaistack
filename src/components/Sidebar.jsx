import React from 'react';
import { LayoutDashboard, Bot, Cpu, FileText, Settings, LogOut, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, onSignOut }) {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'AI Claws', icon: Bot },
    { name: 'Integrations', icon: Cpu },
    { name: 'Reports', icon: FileText },
    { name: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`border-r border-zinc-800/80 bg-[#13151b] flex flex-col justify-between transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div>
        {/* Brand Header with Clean Icon & Name Lockup */}
        <div className="flex items-center justify-between px-5 py-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Sleek Sidebar Icon Mark */}
            <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Zap className="h-5 w-5 fill-emerald-400/20" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-white tracking-tight">ClawAI <span className="text-emerald-400">Stack</span></span>
                <span className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase">Finance AI</span>
              </div>
            )}
          </div>
          
          {/* Collapse Toggle Button */}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition cursor-pointer"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-zinc-800/80">
        <button
          onClick={onSignOut}
          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}