import React from 'react';
import {
  Search,
  PlusCircle,
  Calendar,
  Sparkles,
  ShoppingBag,
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
  onOpenSearch,
  onOpenDailyEntry,
}) => {
  const { period, setPeriod } = usePeriod();
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
    <header className="h-16 lg:h-20 bg-white/95 dark:bg-[#11212D]/95 backdrop-blur border-b border-[#9BA8AB]/40 dark:border-[#253745] px-4 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 select-none transition-colors duration-200">
      {/* Left: Brand / Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <img
            src="/mocca-logo.png"
            alt="MOCCA"
            className="w-9 h-9 rounded-full object-cover lg:hidden ring-1 ring-emerald-500/50"
          />
          <div>
            <h1 className="text-base lg:text-xl font-black text-[#06141B] dark:text-[#CCD0CF] tracking-tight flex items-center gap-2 font-serif">
              <span>{getPageTitle()}</span>
              {activeTab === 'dashboard' && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <Sparkles size={12} className="text-emerald-600 dark:text-emerald-400" /> Live Sync
                </span>
              )}
            </h1>
            <p className="text-[11px] text-[#4A5C6A] dark:text-[#9BA8AB] font-medium hidden sm:block">
              MOCCA Gents & Boys • {todayFormatted} • Owner: <strong className="text-[#06141B] dark:text-[#CCD0CF]">Mashboob</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Quick Search */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2.5 bg-gray-100 hover:bg-emerald-50 hover:border-emerald-500 dark:bg-[#182B3A] dark:hover:bg-[#253745] dark:hover:border-emerald-500 text-[#06141B] dark:text-[#CCD0CF] px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#253745] text-xs font-semibold transition-all group"
        >
          <Search size={15} className="text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 stroke-[2.5]" />
          <span className="text-[#4A5C6A] dark:text-[#9BA8AB]">Search invoices, items, staff...</span>
          <kbd className="hidden xl:inline-block bg-white dark:bg-[#11212D] text-[#06141B] dark:text-[#CCD0CF] text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#9BA8AB]/40 dark:border-[#253745]">
            Ctrl+K
          </kbd>
        </button>

        {/* Period Filter Dropdown */}
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#182B3A] px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-[#253745] text-xs font-bold text-[#06141B] dark:text-[#CCD0CF]">
          <Calendar size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            className="bg-transparent text-[#06141B] dark:text-[#CCD0CF] font-bold outline-none cursor-pointer text-xs"
          >
            {periodOptions.map((opt) => (
              <option key={opt} value={opt} className="bg-white dark:bg-[#11212D] text-[#06141B] dark:text-[#CCD0CF] font-semibold">
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Theme Toggle (Light/Dark) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-gray-100 hover:bg-emerald-50 hover:border-emerald-500 dark:bg-[#182B3A] dark:hover:bg-[#253745] dark:hover:border-emerald-500 text-[#06141B] dark:text-[#CCD0CF] border border-gray-300 dark:border-[#253745] transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-[#06141B]" />}
        </button>

        {/* Lock Screen Button */}
        <button
          onClick={lock}
          className="p-2 rounded-xl bg-gray-100 hover:bg-rose-50 hover:border-rose-400 dark:bg-[#182B3A] dark:hover:bg-rose-500/20 text-[#06141B] hover:text-rose-600 dark:text-[#CCD0CF] dark:hover:text-rose-400 border border-gray-300 dark:border-[#253745] transition-colors"
          title="Lock App (Owner PIN Protected)"
        >
          <Lock size={16} />
        </button>

        {/* Quick Daily Entry Action Button */}
        <button
          onClick={onOpenDailyEntry}
          className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-[#182B3A] dark:hover:bg-[#253745] text-[#06141B] dark:text-emerald-300 font-extrabold px-3 py-2 rounded-xl text-xs border border-emerald-500/40 hover:border-emerald-500 shadow-sm transition-all active:scale-95 group"
          title="Add Daily Expense, Received Stock, Attendance, or Request"
        >
          <PlusCircle size={15} className="text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 stroke-[2.5]" />
          <span className="hidden md:inline">+ Daily Entry</span>
          <span className="md:hidden">Daily</span>
        </button>

        {/* Primary Action Button: New Bill / POS */}
        <button
          onClick={() => onSelectTab('billing')}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-3.5 lg:px-4 py-2 rounded-xl text-xs lg:text-sm shadow-emerald-500/20 shadow-md hover:shadow-emerald-500/40 transition-all active:scale-95"
        >
          <ShoppingBag size={16} className="shrink-0 stroke-[2.5]" />
          <span className="hidden sm:inline">New Bill</span>
          <span className="sm:hidden">Bill</span>
        </button>
      </div>
    </header>
  );
};
