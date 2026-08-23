import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  RotateCw, 
  Upload, 
  Bell, 
  ChevronDown, 
  SlidersHorizontal,
  Check,
  Building2,
  Sparkles,
  Plus,
  User,
  Save,
  X,
  ExternalLink,
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Header({ 
  selectedCompany, 
  onCompanyChange, 
  hideMetrics, 
  onHideMetricsToggle, 
  onSync, 
  isSyncing, 
  onOpenUpload,
  onExecuteClawTest,
  isExecutingTest
}) {
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // User Profile State
  const [userProfile, setUserProfile] = useState({
    name: 'Misbahullah',
    email: 'misbah312@gmail.com',
    role: 'Fractional CFO / Consultant'
  });

  const companyMenuRef = useRef(null);
  const notificationsMenuRef = useRef(null);
  const profileMenuRef = useRef(null);

  // Fetch logged-in user details and custom profile attributes on mount
  useEffect(() => {
    async function getUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', user.id)
            .single();

          setUserProfile({
            name: profileData?.full_name || user.user_metadata?.full_name || 'Misbahullah',
            email: user.email || 'misbah312@gmail.com',
            role: profileData?.role || 'Fractional CFO / Consultant'
          });
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    }
    getUserData();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Update user metadata in Supabase Auth
        await supabase.auth.updateUser({
          data: { full_name: userProfile.name }
        });

        // Upsert custom profile attributes into public.profiles table
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: userProfile.name,
          role: userProfile.role,
          updated_at: new Date().toISOString()
        });
      }
      setIsProfileMenuOpen(false);
    } catch (err) {
      console.error('Error updating profile:', err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Notification State with navigation links
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Reconciliation Complete', desc: '14 Stripe transactions reconciled automatically.', time: '2m ago', unread: true, link: '/dashboard/reconciliation' },
    { id: 2, title: 'AR Follow-up Sent', desc: 'Overdue reminder sent to ACME Corp.', time: '15m ago', unread: true, link: '/dashboard/ar' },
    { id: 3, title: '3-Way Match Verified', desc: 'Vendor Bill #V-8812 approved for payout.', time: '1h ago', unread: false, link: '/dashboard/bills' },
  ]);

  const companies = [
    'ClawAI Stack Int Ltd',
    'Apex Financials UK',
    'Nova Capital Partners',
  ];

  // Close dropdown menus when clicking anywhere outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (companyMenuRef.current && !companyMenuRef.current.contains(event.target)) {
        setIsCompanyMenuOpen(false);
      }
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-[#0d0e12]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
      
      {/* Workspace Selector & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        
        {/* Company Switcher Dropdown */}
        <div className="relative" ref={companyMenuRef}>
          <button 
            type="button"
            onClick={() => {
              setIsCompanyMenuOpen(prev => !prev);
              setIsNotificationsOpen(false);
              setIsProfileMenuOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#13151b] border border-zinc-800 rounded-lg text-xs font-medium text-white hover:border-zinc-700 transition cursor-pointer"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="max-w-[150px] sm:max-w-none truncate">{selectedCompany || 'Select Workspace'}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${isCompanyMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Company Dropdown Menu */}
          {isCompanyMenuOpen && (
            <div className="absolute left-0 mt-2 w-60 bg-[#13151b] border border-zinc-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Switch Workspace Entity
              </div>
              {companies.map((comp) => (
                <button
                  key={comp}
                  type="button"
                  onClick={() => {
                    onCompanyChange(comp);
                    setIsCompanyMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition cursor-pointer ${
                    selectedCompany === comp 
                      ? 'bg-emerald-500/10 text-emerald-300 font-medium' 
                      : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{comp}</span>
                  </div>
                  {selectedCompany === comp && <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                </button>
              ))}

              <div className="border-t border-zinc-800/80 mt-1 pt-1 px-1">
                <button 
                  type="button"
                  onClick={() => {
                    setIsCompanyMenuOpen(false);
                    const newName = prompt("Enter new workspace / company name:");
                    if (newName && newName.trim()) {
                      onCompanyChange(newName.trim());
                    }
                  }}
                  className="w-full text-left px-2 py-1.5 text-[11px] text-emerald-400 hover:bg-emerald-500/10 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add New Entity</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global Search Bar with Styled KBD Badge */}
        <div className="relative flex-1 hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search transactions, claws, invoices..." 
            className="w-full bg-[#13151b] border border-zinc-800 rounded-lg pl-9 pr-12 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800/80 border border-zinc-700/60 rounded pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Header Action Buttons */}
      <div className="flex items-center gap-2.5">
        
        {/* KPI Compact Toggle */}
        <button 
          type="button"
          onClick={onHideMetricsToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
            hideMetrics 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-[#13151b] border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{hideMetrics ? 'Show KPIs' : 'Compact KPIs'}</span>
        </button>

        {/* Sync Button */}
        <button 
          type="button"
          onClick={onSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#13151b] border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-medium rounded-lg transition cursor-pointer"
        >
          <RotateCw className={`h-3.5 w-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync'}</span>
        </button>

        {/* Test Execute-Claw Button */}
        <button 
          type="button"
          onClick={onExecuteClawTest}
          disabled={isExecutingTest}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
          title="Trigger Supabase Edge Gateway Test"
        >
          <Zap className={`h-3.5 w-3.5 fill-emerald-400/20 ${isExecutingTest ? 'animate-bounce' : ''}`} />
          <span>{isExecutingTest ? 'Running...' : 'Test Execute-Claw'}</span>
        </button>

        {/* Upload Button */}
        <button 
          type="button"
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-lg transition shadow-sm shadow-emerald-950/50 cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5 text-zinc-950" />
          <span>Upload</span>
        </button>

        <div className="h-4 w-px bg-zinc-800 mx-1"></div>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notificationsMenuRef}>
          <button 
            type="button"
            onClick={() => {
              setIsNotificationsOpen(prev => !prev);
              setIsCompanyMenuOpen(false);
              setIsProfileMenuOpen(false);
            }}
            className="p-2 text-zinc-400 hover:text-white hover:bg-[#13151b] rounded-lg transition relative cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>

          {/* Notifications Popover Panel */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#13151b] border border-zinc-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-mono">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[10px] text-zinc-400 hover:text-emerald-400 transition cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
              </div>

              {/* Notification Items with Links */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.map((item) => (
                  <div 
                    key={item.id} 
                    className={`p-2.5 rounded-xl border text-xs transition ${
                      item.unread 
                        ? 'bg-[#181a22] border-emerald-500/30' 
                        : 'bg-[#13151b] border-zinc-800/60 opacity-70'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-zinc-200 text-[11px]">{item.title}</span>
                      <span className="text-[9px] text-zinc-500 font-mono">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">{item.desc}</p>
                    
                    <div className="mt-2 pt-2 border-t border-zinc-800/60 flex justify-end">
                      <a 
                        href={item.link}
                        onClick={() => setIsNotificationsOpen(false)}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 hover:text-emerald-300 transition"
                      >
                        <span>View details</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-1 border-t border-zinc-800/80 text-center">
                <button 
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-[11px] text-zinc-400 hover:text-white transition cursor-pointer font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-zinc-800 mx-1"></div>

        {/* User Profile Dropdown Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button 
            type="button"
            onClick={() => {
              setIsProfileMenuOpen(prev => !prev);
              setIsCompanyMenuOpen(false);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-2.5 bg-[#13151b] border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-xl cursor-pointer transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
              {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-white leading-none">{userProfile.name}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5 leading-none">{userProfile.role}</p>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 ml-1 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown Panel */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#13151b] border border-zinc-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">User Profile Settings</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1 font-medium text-[11px]">Full Name</label>
                  <input 
                    type="text" 
                    value={userProfile.name}
                    onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                    className="w-full bg-[#090a0f] border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:border-emerald-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium text-[11px]">Email Address</label>
                  <input 
                    type="email" 
                    value={userProfile.email}
                    disabled
                    className="w-full bg-[#090a0f]/50 border border-zinc-800/50 rounded-xl px-3 py-2 text-zinc-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-medium text-[11px]">Professional Title / Role</label>
                  <input 
                    type="text" 
                    value={userProfile.role}
                    onChange={(e) => setUserProfile({...userProfile, role: e.target.value})}
                    className="w-full bg-[#090a0f] border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:border-emerald-500 outline-none"
                    placeholder="e.g. Fractional CFO / Consultant"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button 
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 text-zinc-950 font-semibold rounded-xl cursor-pointer transition-all"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {isSavingProfile ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>

    </header>
  );
}