import React from 'react';
import {
  Search,
  PlusCircle,
  Calendar,
  Sparkles,
  ShoppingBag,
  Bell,
  Menu,
  Lock,
  Sun,
  Moon,
} from 'lucide-react';
import { usePeriod, type PeriodFilter } from '../../context/PeriodContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSecurity } from '../../context/SecurityContext';
import type { NavItemKey } from './Sidebar';

interface HeaderProps {
  activeTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  onOpenMobileMenu?: () => void;
  onOpenSearch?: () => void;
  onOpenDailyEntry?: () => void;
  alertsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenMobileMenu,
  onOpenSearch,
  onOpenDailyEntry,
  alertsCount = 0,
}) => {
  const { period, setPeriod } = usePeriod();
  const { role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lock } = useSecurity();

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Business Overview';
      case 'billing':
        return 'Billing & POS';
      case 'daily-profit':
        return 'Daily Profit, Sales & Products';
      case 'accounts':
        return 'Accounts & Cash Book';
      case 'staff':
        return 'Staff, Attendance & Salary';
      default:
        return 'MOCCA';
    }
  };

  const periodOptions: PeriodFilter[] = [
    'Today',
    'Yesterday',
    'Last 7 Days',
    'Last 30 Days',
    'This Month',
    'Last Month',
    'This Year',
  ];

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="h-16 lg:h-20 bg-white/90 dark:bg-[#0E1015]/90 backdrop-blur border-b border-gray-200 dark:border-[#1E222D] px-4 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 select-none transition-colors duration-200">
      {/* Left: Brand / Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <img
            src="/mocca-logo.png"
            alt="MOCCA"
            className="w-9 h-9 rounded-full object-cover lg:hidden ring-1 ring-gold/50"
          />
          <div>
            <h1 className="text-base lg:text-xl font-bold text-gray-900 dark:text-cream tracking-tight flex items-center gap-2 font-serif">
              <span>{getPageTitle()}</span>
              {activeTab === 'dashboard' && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-gold bg-gold/15 px-2 py-0.5 rounded-full border border-gold/30">
                  <Sparkles size={12} /> Live Sync
                </span>
              )}
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-mocca-400 font-medium hidden sm:block">
              MOCCA Gents & Boys • {todayFormatted} • Owner: <strong>Mashboob</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Quick Search */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#161820] dark:hover:bg-[#1E222D] text-gray-600 dark:text-cream-muted px-3.5 py-2 rounded-xl border border-gray-200 dark:border-[#222630] text-xs transition-colors"
        >
          <Search size={15} className="text-gold" />
          <span className="text-gray-400 dark:text-mocca-400">Search invoices, items, staff...</span>
          <kbd className="hidden xl:inline-block bg-white dark:bg-[#0E1015] text-gray-500 dark:text-mocca-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-gray-200 dark:border-[#222630]">
            Ctrl+K
          </kbd>
        </button>

        {/* Period Filter Dropdown */}
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#161820] px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-[#222630] text-xs">
          <Calendar size={14} className="text-gold shrink-0" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            className="bg-transparent text-gray-800 dark:text-cream font-medium outline-none cursor-pointer text-xs"
          >
            {periodOptions.map((opt) => (
              <option key={opt} value={opt} className="bg-white dark:bg-[#0E1015] text-gray-900 dark:text-cream">
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Theme Toggle (Light/Dark) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#161820] dark:hover:bg-[#1E222D] text-gray-700 dark:text-cream-muted border border-gray-200 dark:border-[#222630] transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-gray-700" />}
        </button>

        {/* Lock Screen Button */}
        <button
          onClick={lock}
          className="p-2 rounded-xl bg-gray-100 hover:bg-rose-50 dark:bg-[#161820] dark:hover:bg-rose-500/20 text-gray-600 hover:text-rose-600 dark:text-cream-muted dark:hover:text-rose-400 border border-gray-200 dark:border-[#222630] transition-colors"
          title="Lock App (Owner PIN Protected)"
        >
          <Lock size={16} />
        </button>

        {/* Quick Daily Entry Action Button */}
        <button
          onClick={onOpenDailyEntry}
          className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#161820] dark:hover:bg-[#1E222D] text-gold-700 dark:text-gold font-bold px-3 py-2 rounded-xl text-xs border border-gold/40 hover:border-gold shadow-sm transition-all active:scale-95"
          title="Add Daily Expense, Received Stock, Attendance, or Request"
        >
          <PlusCircle size={15} />
          <span className="hidden md:inline">+ Daily Entry</span>
          <span className="md:hidden">Daily</span>
        </button>

        {/* Primary Action Button: New Bill / POS */}
        <button
          onClick={() => onSelectTab('billing')}
          className="flex items-center gap-2 bg-gradient-to-r from-gold to-gold-600 hover:from-gold-light hover:to-gold text-mocca-950 font-bold px-3.5 lg:px-4 py-2 rounded-xl text-xs lg:text-sm shadow-gold-glow transition-all active:scale-95"
        >
          <ShoppingBag size={16} className="shrink-0" />
          <span className="hidden sm:inline">New Bill</span>
          <span className="sm:hidden">Bill</span>
        </button>
      </div>
    </header>
  );
};
