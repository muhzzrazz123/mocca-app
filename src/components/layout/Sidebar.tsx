import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  TrendingUp,
  Wallet,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Lock,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSecurity } from '../../context/SecurityContext';

export type NavItemKey =
  | 'dashboard'
  | 'billing'
  | 'daily-profit'
  | 'accounts'
  | 'staff';

interface SidebarProps {
  activeTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  alertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { lock } = useSecurity();

  const navItems = [
    { key: 'dashboard' as NavItemKey, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'billing' as NavItemKey, label: 'Billing (POS)', icon: ReceiptText, badge: 'Counter' },
    { key: 'daily-profit' as NavItemKey, label: 'Daily Profit', icon: TrendingUp, subtitle: 'Sales & Products' },
    { key: 'accounts' as NavItemKey, label: 'Accounts', icon: Wallet, subtitle: 'Cash, Expenses & Rent' },
    { key: 'staff' as NavItemKey, label: 'Staff & Salary', icon: UserCheck, subtitle: 'Attendance & Payroll' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-[#0E1015] border-r border-gray-300 dark:border-[#1E222D] select-none shrink-0 h-screen sticky top-0 transition-colors duration-200">
      {/* Brand Header with Official MOCCA Logo */}
      <div className="px-6 py-5 border-b border-gray-300 dark:border-[#1E222D] flex items-center justify-between bg-gray-50/80 dark:bg-[#0E1015]/60">
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <img
              src="/mocca-logo.png"
              alt="MOCCA Logo"
              className="w-12 h-12 rounded-full object-cover shadow-gold-glow ring-2 ring-gold/50 transition-transform group-hover:scale-105"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0E1015]"></span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-black dark:text-gold font-serif font-black text-xl tracking-wider leading-tight">
              MOCCA
            </span>
            <span className="text-[10px] font-bold text-gray-700 dark:text-cream-muted uppercase tracking-widest truncate">
              Gents & Boys
            </span>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#1A1D26] dark:hover:bg-[#252A36] text-black dark:text-cream-muted transition-colors border border-gray-200 dark:border-[#222736]"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-black" />}
        </button>
      </div>

      {/* Navigation List - 5 Streamlined Core Elements with Black Letters */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-6 space-y-2">
        <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-mocca-400">
          Main Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all group ${
                isActive
                  ? 'bg-gold/20 dark:bg-gold/15 text-black dark:text-gold border border-gold/60 shadow-sm font-black'
                  : 'text-black dark:text-cream-muted hover:text-black dark:hover:text-cream hover:bg-gray-100 dark:hover:bg-[#161820] font-bold'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`p-2 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-gold text-mocca-950 shadow-gold-glow'
                      : 'bg-gray-100 dark:bg-[#1A1D26] text-black dark:text-mocca-400 group-hover:text-gold'
                  }`}
                >
                  <Icon size={18} className="stroke-[2.5]" />
                </div>
                <div className="text-left min-w-0">
                  <div className="truncate text-black dark:text-cream font-bold">{item.label}</div>
                  {item.subtitle && (
                    <div className="text-[11px] text-gray-600 dark:text-mocca-400 font-medium truncate">
                      {item.subtitle}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/20 text-black dark:text-gold border border-gold/40 font-bold uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight size={16} className="text-black dark:text-gold stroke-[2.5]" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Owner Security & Lock Card */}
      <div className="p-3.5 border-t border-gray-300 dark:border-[#1E222D] bg-gray-50/80 dark:bg-[#0A0B0E]/60">
        <div className="bg-white dark:bg-[#14161D] p-3 rounded-2xl border border-gray-300 dark:border-[#222630] flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gold/20 border border-gold/50 flex items-center justify-center text-black dark:text-gold font-bold text-xs shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-black dark:text-cream truncate leading-tight">
                Mashboob
              </p>
              <span className="inline-block text-[10px] font-bold text-gray-600 dark:text-gold uppercase tracking-wider">
                Store Owner
              </span>
            </div>
          </div>

          {/* Instant App Lock Button */}
          <button
            onClick={lock}
            className="p-2 rounded-xl bg-gray-100 hover:bg-rose-50 dark:bg-[#1E222D] dark:hover:bg-rose-500/20 text-black hover:text-rose-600 dark:text-mocca-400 dark:hover:text-rose-400 border border-gray-300 dark:border-[#2C3240] transition-colors"
            title="Lock Register / Screen"
          >
            <Lock size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
};
