import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  Layers, 
  BarChart3, 
  Settings, 
  LogOut, 
  PanelLeftClose, 
  PanelLeft,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'AI Claws', icon: Cpu, badge: '5' },
    { name: 'Integrations', icon: Layers },
    { name: 'Reports', icon: BarChart3 },
    { name: 'Settings', icon: Settings },
  ];

  return (
    <aside 
      className={`h-screen bg-[#0d0e12] border-r border-zinc-800/80 flex flex-col justify-between transition-all duration-300 sticky top-0 z-40 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div>
        <div className="h-16 px-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
            {/* Logo Icon */}
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <span className="text-emerald-400 font-extrabold text-sm font-mono">C</span>
            </div>
            
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-white tracking-tight leading-none">ClawAI Stack</span>
                <span className="text-[10px] text-zinc-500 font-medium mt-0.5">Autonomous Finance</span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(true)}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800/50 transition cursor-pointer"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(false)}
              className="w-full py-2 flex justify-center text-zinc-500 hover:text-zinc-300 mb-2 cursor-pointer"
              title="Expand Sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;

            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                <div className={`flex items-center gap-3 ${isCollapsed ? 'mx-auto' : ''}`}>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                    isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer / Sign Out */}
      <div className="p-3 border-t border-zinc-800/80">
        <button 
          onClick={() => alert("Signing out...")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition cursor-pointer ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-4 w-4 text-rose-400" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}