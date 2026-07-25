import React, { useState } from 'react';
import { UserRole, AdminUser } from '../types/society';
import { 
  Building2, 
  ShieldCheck, 
  User, 
  Eye, 
  Wrench, 
  Megaphone, 
  Wallet, 
  Calendar, 
  PhoneCall, 
  Grid3X3,
  Lock,
  LogOut,
  AlertTriangle,
  Menu,
  X,
  GitFork,
  ChevronRight,
  Home,
  HeartHandshake,
  Palette,
  Check,
  ChevronDown
} from 'lucide-react';

export type ThemeId = 'cyber' | 'emerald' | 'amethyst' | 'amber';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  dotColor: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'cyber', name: 'Cyber Neon', dotColor: 'bg-sky-400' },
  { id: 'emerald', name: 'Emerald Jade', dotColor: 'bg-emerald-400' },
  { id: 'amethyst', name: 'Royal Amethyst', dotColor: 'bg-fuchsia-400' },
  { id: 'amber', name: 'Sunset Amber', dotColor: 'bg-amber-400' },
];

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentAdmin: AdminUser | null;
  onAdminLogout: () => void;
  onOpenAdminLogin: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  emergencyCount: number;
  isHamburgerOpen?: boolean;
  onToggleHamburger?: () => void;
  theme?: ThemeId;
  onThemeChange?: (newTheme: ThemeId) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  currentAdmin,
  onAdminLogout,
  onOpenAdminLogin,
  activeTab,
  onTabChange,
  emergencyCount,
  isHamburgerOpen: externalIsHamburgerOpen,
  onToggleHamburger: externalOnToggleHamburger,
  theme = 'cyber',
  onThemeChange,
}) => {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [internalIsHamburgerOpen, setInternalIsHamburgerOpen] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);

  const isHamburgerOpen = externalIsHamburgerOpen !== undefined ? externalIsHamburgerOpen : internalIsHamburgerOpen;
  const toggleHamburger = externalOnToggleHamburger || (() => setInternalIsHamburgerOpen(!internalIsHamburgerOpen));

  // Lock body scroll when hamburger menu is open so background page doesn't scroll
  React.useEffect(() => {
    if (isHamburgerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isHamburgerOpen]);

  // Nav items - Home is the top entry, Helper People added
  const tabs = [
    { id: 'home', label: 'Vaishnavi Pride Overview (Home)', icon: Home },
    { id: 'helpers', label: 'Helper People (Household Services)', icon: HeartHandshake },
    { id: 'tickets', label: 'Tickets & Maintenance Board', icon: Wrench },
    { id: 'notices', label: 'Announcements & Notice Board', icon: Megaphone, badge: emergencyCount > 0 ? emergencyCount : undefined },
    { id: 'finance', label: 'Fund Ledger & UPI Payment Tracker', icon: Wallet },
    { id: 'amenities', label: 'Amenity Booking Engine', icon: Calendar },
    { id: 'directory', label: '22-Floor Resident Matrix', icon: Grid3X3 },
    { id: 'emergency', label: 'SOS Push Emergency Broadcast', icon: PhoneCall },
    { id: 'admins', label: 'Admin Hierarchy & Governance Tree', icon: GitFork },
  ];

  const currentActiveTabObj = tabs.find(t => t.id === activeTab) || tabs[0];
  const CurrentIcon = currentActiveTabObj.icon;

  const handleConfirmSignOut = () => {
    onAdminLogout();
    setShowSignOutConfirm(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 shadow-2xl transition-colors duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-sky-900/60 via-slate-900 to-indigo-900/60 border-b border-sky-800/40 px-4 py-1.5 text-xs text-slate-300 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <Building2 className="w-3 h-3 mr-1" />
            22 Floors | 154 Units
          </span>
          <span className="hidden md:inline text-slate-400">Vaishnavi Pride High-Rise Tower</span>
        </div>

        {/* Role Switcher, Theme Toggle & Admin Auth Badge */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">Role:</span>
          
          <button
            onClick={() => onRoleChange('Resident')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              currentRole === 'Resident'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 ring-1 ring-sky-400'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Resident
          </button>

          <button
            onClick={() => {
              if (currentRole !== 'Management') {
                onRoleChange('Management');
                if (!currentAdmin) onOpenAdminLogin();
              }
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              currentRole === 'Management'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-1 ring-indigo-400'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-200" />
            Management Admin
          </button>

          <button
            onClick={() => onRoleChange('Auditor')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              currentRole === 'Auditor'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 ring-1 ring-amber-400'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Public Auditor
          </button>

          {/* Theme Selector Dropdown */}
          {onThemeChange && (
            <div className="relative flex items-center">
              <button
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                className="ml-1 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-md"
                title="Change Society Theme Palette"
              >
                <Palette className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline font-semibold text-slate-400">Theme:</span>
                <span className="flex items-center gap-1.5 text-sky-300 font-bold">
                  <span className={`w-2 h-2 rounded-full ${THEME_OPTIONS.find(t => t.id === theme)?.dotColor || 'bg-sky-400'}`}></span>
                  {THEME_OPTIONS.find(t => t.id === theme)?.name || 'Cyber Neon'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showThemeDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[10px] font-extrabold text-slate-400 px-2.5 py-1 uppercase tracking-wider border-b border-slate-800 mb-1 flex items-center justify-between">
                    <span>Dark Theme Aesthetics</span>
                    <Palette className="w-3 h-3 text-sky-400" />
                  </div>
                  <div className="space-y-1">
                    {THEME_OPTIONS.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          onThemeChange(t.id);
                          setShowThemeDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                          theme === t.id
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 ring-1 ring-sky-500/30'
                            : 'text-slate-300 hover:bg-slate-800/80 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${t.dotColor} shadow-sm`}></span>
                          <span>{t.name}</span>
                        </div>
                        {theme === t.id && <Check className="w-4 h-4 text-sky-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Authenticated Admin Account Badge */}
          {currentRole === 'Management' && (
            <div className="ml-2 pl-2 border-l border-slate-700 flex items-center gap-2">
              {currentAdmin ? (
                <div className="flex items-center gap-1.5 bg-indigo-950/80 border border-indigo-500/40 px-2 py-0.5 rounded-lg text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-bold text-indigo-200">{currentAdmin.name}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                    currentAdmin.adminType === 'SuperAdmin' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'bg-indigo-500/20 text-indigo-300'
                  }`}>
                    {currentAdmin.adminType}
                  </span>
                  <button
                    onClick={() => setShowSignOutConfirm(true)}
                    className="ml-1 p-0.5 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Sign Out Admin"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAdminLogin}
                  className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  Sign In Admin
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Header Bar (ONLY Hamburger Button, Brand & Active Section Indicator) */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Hamburger Button & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleHamburger}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-md ${
              isHamburgerOpen 
                ? 'bg-rose-950/80 text-rose-300 border-rose-500/60 ring-2 ring-rose-500/30' 
                : 'bg-indigo-950/80 hover:bg-indigo-900/90 text-sky-300 border-indigo-500/50 hover:border-sky-400 ring-1 ring-sky-500/20'
            }`}
            aria-label="Toggle Hamburger Navigation Menu"
          >
            {isHamburgerOpen ? (
              <>
                <X className="w-5 h-5 text-rose-400" />
                <span>Close Menu</span>
              </>
            ) : (
              <>
                <Menu className="w-5 h-5 text-sky-400" />
                <span>Navigation Menu</span>
              </>
            )}
          </button>

          <button 
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold text-sm group-hover:scale-105 transition-transform">
              VP
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Vaishnavi Pride
                <span className="text-[10px] font-normal text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-800/60">
                  Society App
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">Operations & Financial Transparency System</p>
            </div>
          </button>
        </div>

        {/* Right: Current Active Section Indicator Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs">
          <span className="text-slate-400 hidden sm:inline">Current Section:</span>
          <span className="font-semibold text-sky-300 flex items-center gap-1.5">
            <CurrentIcon className="w-3.5 h-3.5 text-sky-400" />
            {currentActiveTabObj.label}
          </span>
        </div>
      </div>

      {/* STRICT SINGLE-COLUMN VERTICAL HAMBURGER MENU DRAWER */}
      {isHamburgerOpen && (
        <div className="bg-slate-950/98 backdrop-blur-2xl border-b border-slate-800 px-4 py-4 space-y-2 shadow-2xl animate-in slide-in-from-top-4 duration-200 max-w-xl mx-auto max-h-[calc(100vh-100px)] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] font-bold text-sky-400 uppercase tracking-wider">
            <span>Navigation Modules (Vertical Menu)</span>
            <span className="text-slate-500 text-[10px] font-normal">Select a module to navigate</span>
          </div>
          
          {/* STRICT VERTICAL SINGLE-COLUMN LIST */}
          <div className="flex flex-col space-y-2 py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    if (externalOnToggleHamburger) externalOnToggleHamburger();
                    else setInternalIsHamburgerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl text-xs font-semibold transition-all border ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-900/90 via-indigo-900/90 to-slate-900 text-white border-sky-400 shadow-xl ring-1 ring-sky-400/50'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{tab.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {tab.badge && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                        {tab.badge}
                      </span>
                    )}
                    {isActive ? (
                      <span className="text-[10px] font-bold text-sky-400 bg-sky-950 px-2 py-1 rounded-md border border-sky-500/40">
                        ACTIVE
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SIGN OUT CONFIRMATION MODAL POPUP */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-sm p-6 space-y-4 border-rose-500/40 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <span className="p-2 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </span>
              <div>
                <h3 className="font-bold text-white text-base">Confirm Sign Out</h3>
                <p className="text-xs text-slate-400">Management Admin Session</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you actually want to sign out of Management Admin session for <strong className="text-white">{currentAdmin?.name} ({currentAdmin?.email})</strong>?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSignOut}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/40 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
