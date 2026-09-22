import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  TrendingUp,
  Wallet,
  UserCheck,
  Lock,
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import type { NavItemKey } from './Sidebar';

interface MobileNavProps {
  activeTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isOpenMore?: boolean;
  setIsOpenMore?: (open: boolean) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const { userMode, lock } = useSecurity();

  const allTabs = [
    { key: 'dashboard' as NavItemKey, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'billing' as NavItemKey, label: 'Billing', icon: ReceiptText },
    { key: 'daily-profit' as NavItemKey, label: 'Profit', icon: TrendingUp },
    { key: 'accounts' as NavItemKey, label: 'Accounts', icon: Wallet },
    { key: 'staff' as NavItemKey, label: 'Staff', icon: UserCheck },
  ];

  if (userMode === 'staff') {
    return (
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-white/95 dark:bg-[#11212D]/95 backdrop-blur border-t border-[#9BA8AB]/40 dark:border-[#253745] flex items-center justify-around px-4 z-40 select-none shadow-lg transition-colors">
        <button
          onClick={() => onSelectTab('billing')}
          className="flex flex-col items-center justify-center gap-1 py-1 text-emerald-600 dark:text-emerald-400 font-bold"
        >
          <ReceiptText size={20} className="stroke-[2.5]" />
          <span className="text-[10px] tracking-tight">Counter Billing</span>
        </button>

        <button
          onClick={() => lock('staff')}
          className="flex flex-col items-center justify-center gap-1 py-1 text-[#4A5C6A] dark:text-[#9BA8AB] hover:text-rose-500 font-medium"
        >
          <Lock size={20} />
          <span className="text-[10px] tracking-tight">Lock Counter</span>
        </button>
      </nav>
    );
  }

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-white/95 dark:bg-[#11212D]/95 backdrop-blur border-t border-[#9BA8AB]/40 dark:border-[#253745] flex items-center justify-around px-2 z-40 select-none shadow-lg transition-colors">
      {allTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onSelectTab(tab.key)}
            className={`flex flex-col items-center justify-center gap-1 w-16 py-1 transition-colors ${
              isActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-[#4A5C6A] dark:text-[#9BA8AB] hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            <Icon size={20} className={isActive ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.5]' : 'stroke-[1.75]'} />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
