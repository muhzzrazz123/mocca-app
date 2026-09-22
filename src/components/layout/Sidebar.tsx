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
  ArrowLeftRight,
} from 'lucide-react';
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
  const { lock, userMode, activeStaffName } = useSecurity();

  // If in staff mode, ONLY show Billing! All other elements are completely hidden.
  const allNavItems = [
    { key: 'dashboard' as NavItemKey, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'billing' as NavItemKey, label: 'Billing (POS)', icon: ReceiptText, badge: 'Counter' },
    { key: 'daily-profit' as NavItemKey, label: 'Daily Profit', icon: TrendingUp, subtitle: 'Sales & Products' },
    { key: 'accounts' as NavItemKey, label: 'Accounts', icon: Wallet, subtitle: 'Cash, Expenses & Rent' },
    { key: 'staff' as NavItemKey, label: 'Staff & Salary', icon: UserCheck, subtitle: 'Attendance & Payroll' },
  ];

  const navItems = userMode === 'staff'
    ? allNavItems.filter((i) => i.key === 'billing')
    : allNavItems;

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-[#11212D] border-r border-gray-300 dark:border-[#253745] select-none shrink-0 h-screen sticky top-0 transition-colors duration-200">
      {/* Brand Header with Official MOCCA Logo */}
      <div className="px-6 py-5 border-b border-gray-300 dark:border-[#253745] flex items-center justify-between bg-gray-50/80 dark:bg-[#11212D]/80">
        <div className="flex items-center gap-3.5">
          <div className="relative group">
            <img
              src="/mocca-logo.png"
              alt="MOCCA Logo"
              className="w-12 h-12 rounded-full object-cover shadow-md ring-2 ring-emerald-500/50 transition-transform group-hover:scale-105"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#11212D]"></span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[#06141B] dark:text-[#CCD0CF] font-serif font-black text-xl tracking-wider leading-tight">
              MOCCA
            </span>
            <span className="text-[10px] font-bold text-[#4A5C6A] dark:text-[#9BA8AB] uppercase tracking-widest truncate">
              {userMode === 'staff' ? 'Counter Billing' : 'Gents & Boys'}
            </span>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#182B3A] dark:hover:bg-[#253745] text-[#06141B] dark:text-[#CCD0CF] transition-colors border border-gray-200 dark:border-[#253745]"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-[#06141B]" />}
        </button>
      </div>

      {/* Navigation List - Only Billing for Staff; All 5 for Owner */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-6 space-y-2">
        <div className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-[#4A5C6A] dark:text-[#9BA8AB]">
          {userMode === 'staff' ? 'Counter POS Register' : 'Main Navigation'}
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
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/60 shadow-sm font-black'
                  : 'text-[#06141B] dark:text-[#CCD0CF] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 dark:hover:bg-[#182B3A] font-bold'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`p-2 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-[#182B3A] text-[#06141B] dark:text-[#9BA8AB] group-hover:text-emerald-600 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/40'
                  }`}
                >
                  <Icon size={18} className="stroke-[2.5]" />
                </div>
                <div className="text-left min-w-0">
                  <div className="truncate text-[#06141B] dark:text-[#CCD0CF] font-bold">{item.label}</div>
                  {item.subtitle && (
                    <div className="text-[11px] text-[#4A5C6A] dark:text-[#9BA8AB] font-medium truncate">
                      {item.subtitle}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-500/40 font-bold uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight size={16} className="text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Security & Lock Card */}
      <div className="p-3.5 border-t border-gray-300 dark:border-[#253745] bg-gray-50/80 dark:bg-[#06141B]/60 space-y-2">
        {userMode === 'staff' ? (
          /* Staff Mode Card */
          <div className="bg-white dark:bg-[#11212D] p-3 rounded-2xl border border-gray-300 dark:border-[#253745] space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs shrink-0">
                  <UserCheck size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#06141B] dark:text-[#CCD0CF] truncate leading-tight">
                    {activeStaffName}
                  </p>
                  <span className="inline-block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    Counter Staff
                  </span>
                </div>
              </div>

              {/* Lock Button */}
              <button
                onClick={() => lock('staff')}
                className="p-2 rounded-xl bg-gray-100 hover:bg-rose-50 dark:bg-[#182B3A] dark:hover:bg-rose-500/20 text-[#06141B] hover:text-rose-600 dark:text-[#9BA8AB] dark:hover:text-rose-400 border border-gray-300 dark:border-[#253745] transition-colors"
                title="Lock Counter (Staff PIN)"
              >
                <Lock size={15} />
              </button>
            </div>

            {/* Switch to Owner Login */}
            <button
              onClick={() => lock('owner')}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-gray-100 dark:bg-[#182B3A] hover:bg-gray-200 dark:hover:bg-[#253745] text-[11px] font-semibold text-[#4A5C6A] dark:text-[#9BA8AB] hover:text-[#06141B] dark:hover:text-[#CCD0CF] transition-colors"
            >
              <ArrowLeftRight size={13} />
              <span>Switch to Owner Access</span>
            </button>
          </div>
        ) : (
          /* Owner Mode Card */
          <div className="bg-white dark:bg-[#11212D] p-3 rounded-2xl border border-gray-300 dark:border-[#253745] flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#06141B] dark:text-[#CCD0CF] truncate leading-tight">
                  Mashboob
                </p>
                <span className="inline-block text-[10px] font-bold text-[#4A5C6A] dark:text-emerald-400 uppercase tracking-wider">
                  Store Owner
                </span>
              </div>
            </div>

            <button
              onClick={() => lock('owner')}
              className="p-2 rounded-xl bg-gray-100 hover:bg-rose-50 dark:bg-[#182B3A] dark:hover:bg-rose-500/20 text-[#06141B] hover:text-rose-600 dark:text-[#9BA8AB] dark:hover:text-rose-400 border border-gray-300 dark:border-[#253745] transition-colors"
              title="Lock Counter (Owner PIN Protected)"
            >
              <Lock size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
