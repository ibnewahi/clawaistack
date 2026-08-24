import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Bot, Cpu, FileText, ShieldCheck, Settings, CreditCard, LogOut, ChevronLeft, ChevronRight, Zap, User, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Sidebar({ collapsed, setCollapsed, onSignOut }) {
  const [userEmail, setUserEmail] = useState('user@company.com');
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Claws', path: '/dashboard/claws', icon: Bot },
    { name: 'Integrations', path: '/dashboard/integrations', icon: Cpu },
    { name: 'Reports', path: '/dashboard/reports', icon: FileText },
    { name: 'Audit Logs', path: '/dashboard/audit-logs', icon: ShieldCheck },
    { name: 'Pricing & Tiers', path: '/pricing', icon: CreditCard },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  // Fetch logged-in user email
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        setUserEmail(user.email);
      }
    }
    getUser();
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <aside className={`border-r border-zinc-800/80 bg-[#13151b] flex flex-col justify-between transition-all duration-300 relative ${collapsed ? 'w-20' : 'w-64'}`}>
      <div>
        {/* Brand Header: Logo and Name now route to the Dashboard (to="/dashboard") */}
        <div className="flex items-center justify-between px-5 py-6 border-b border-zinc-800/80">
          <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden group cursor-pointer">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 group-hover:border-emerald-500/60 transition">
              <Zap className="h-5 w-5 fill-emerald-400/20" />
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-white tracking-tight group-hover:text-emerald-400 transition">ClawAI <span className="text-emerald-400">Stack</span></span>
                <span className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase">Finance AI</span>
              </div>
            )}
          </Link>
          
          {/* Collapse Toggle Button */}
          <button 
            type="button"
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
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) => `relative flex items-center w-full px-3.5 py-3 rounded-xl text-sm font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
                title={collapsed ? item.name : undefined}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-emerald-400 rounded-r-full shadow-sm shadow-emerald-400/50 z-10" />
                    )}
                    <Icon className={`h-4 w-4 shrink-0 mr-3 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Profile Footer with Popup Menu */}
      <div className="p-4 border-t border-zinc-800/85 relative" ref={dropdownRef}>
        {profileOpen && (
          <div className="absolute bottom-full mb-2 left-4 right-4 bg-[#181b24] border border-zinc-700/80 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-2 border-b border-zinc-800/80 mb-1">
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Signed in as</p>
              <p className="text-xs text-white font-semibold truncate">{userEmail}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setProfileOpen(false);
                onSignOut();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setProfileOpen(!profileOpen)}
          className={`w-full flex items-center justify-between p-2 rounded-xl bg-[#181b24]/60 hover:bg-[#181b24] border border-zinc-800/80 transition cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? userEmail : "User Profile & Menu"}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
              {userEmail ? userEmail.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </div>
            {!collapsed && (
              <div className="flex flex-col text-left truncate">
                <span className="text-xs font-semibold text-white truncate">{userEmail.split('@')[0]}</span>
                <span className="text-[10px] text-zinc-400 truncate">{userEmail}</span>
              </div>
            )}
          </div>
          {!collapsed && <ChevronUp className={`h-4 w-4 text-zinc-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />}
        </button>
      </div>
    </aside>
  );
}