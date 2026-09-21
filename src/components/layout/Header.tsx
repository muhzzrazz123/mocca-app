import React from 'react';
import {
  Search,
  PlusCircle,
  Calendar,
  Sparkles,
  ShoppingBag,
  Bell,
  Menu,
} from 'lucide-react';
import { usePeriod, type PeriodFilter } from '../../context/PeriodContext';
import { useAuth } from '../../context/AuthContext';
import type { NavItemKey } from './Sidebar';

interface HeaderProps {
  activeTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  onOpenMobileMenu?: () => void;
  onOpenSearch?: () => void;
  alertsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenMobileMenu,
  onOpenSearch,
  alertsCount = 0,
}) => {
  const { period, setPeriod } = usePeriod();
  const { role, switchRole } = useAuth();

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Business Overview';
      case 'pos':
        return 'Retail POS & Billing';
      case 'products':
        return 'Product Catalog';
      case 'inventory':
        return 'Inventory & Stock Control';
      case 'purchases':
        return 'Purchase Orders';
      case 'suppliers':
        return 'Supplier Directory';
      case 'customers':
        return 'Customer CRM';
      case 'customer-requests':
        return 'Customer Requests';
      case 'staff':
        return 'Staff & Attendance';
      case 'finance':
        return 'Financial Intelligence';
      case 'bills':
        return 'Bills & Recurring Rent';
      case 'reports':
        return 'Reports & Data Export';
      case 'insights':
        return 'MOCCA Insights Engine';
      case 'settings':
        return 'Store & System Settings';
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

  // Formatted current date string
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="h-16 lg:h-20 bg-mocca-900/90 backdrop-blur border-b border-mocca-750/80 px-4 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg bg-mocca-800 text-cream-muted hover:text-cream border border-mocca-700"
          aria-label="Open Navigation"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2.5">
          <img
            src="/mocca-logo.png"
            alt="MOCCA"
            className="w-9 h-9 rounded-full object-cover lg:hidden ring-1 ring-gold/50"
          />
          <div>
            <h1 className="text-base lg:text-xl font-bold text-cream tracking-tight flex items-center gap-2">
              <span>{getPageTitle()}</span>
              {activeTab === 'dashboard' && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-gold bg-gold/15 px-2 py-0.5 rounded-full border border-gold/30">
                  <Sparkles size={12} /> Live Sync
                </span>
              )}
            </h1>
            <p className="text-[11px] text-mocca-400 font-medium hidden sm:block">
              MOCCA Gents & Boys Collections • {todayFormatted}
            </p>
          </div>
        </div>
      </div>

      {/* Center / Right: Quick Search + Date Period Filter + Action Button */}
      <div className="flex items-center gap-2.5 lg:gap-3.5">
        {/* Quick Search Bar */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2.5 bg-mocca-800/80 hover:bg-mocca-750 text-cream-muted px-3.5 py-2 rounded-xl border border-mocca-700/80 text-xs transition-colors"
        >
          <Search size={15} className="text-gold" />
          <span className="text-mocca-400">Search products, invoices, customers...</span>
          <kbd className="hidden xl:inline-block bg-mocca-900 text-mocca-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-mocca-700">
            Ctrl+K
          </kbd>
        </button>

        {/* Period Filter Dropdown */}
        <div className="flex items-center gap-1.5 bg-mocca-850 px-2.5 py-1.5 rounded-xl border border-mocca-700/80 text-xs">
          <Calendar size={14} className="text-gold shrink-0" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
            className="bg-transparent text-cream font-medium outline-none cursor-pointer text-xs"
          >
            {periodOptions.map((opt) => (
              <option key={opt} value={opt} className="bg-mocca-900 text-cream">
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Alerts Bell */}
        <button
          onClick={() => onSelectTab('bills')}
          className="relative p-2 rounded-xl bg-mocca-850 text-cream-muted hover:text-cream border border-mocca-700 hover:border-gold/40 transition-colors"
          title="View Alerts & Dues"
        >
          <Bell size={18} />
          {alertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
              {alertsCount}
            </span>
          )}
        </button>

        {/* Primary Action Button: New Bill / POS */}
        <button
          onClick={() => onSelectTab('pos')}
          className="flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-mocca-950 font-bold px-3.5 lg:px-4 py-2 rounded-xl text-xs lg:text-sm shadow-gold-glow transition-all active:scale-95"
        >
          <ShoppingBag size={16} className="shrink-0" />
          <span className="hidden sm:inline">New Sale / Bill</span>
          <span className="sm:hidden">Bill</span>
        </button>
      </div>
    </header>
  );
};
