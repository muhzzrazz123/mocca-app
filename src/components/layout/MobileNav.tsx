import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  TrendingUp,
  Wallet,
  UserCheck,
} from 'lucide-react';
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
  const mainTabs = [
    { key: 'dashboard' as NavItemKey, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'billing' as NavItemKey, label: 'Billing', icon: ReceiptText },
    { key: 'daily-profit' as NavItemKey, label: 'Profit', icon: TrendingUp },
    { key: 'accounts' as NavItemKey, label: 'Accounts', icon: Wallet },
    { key: 'staff' as NavItemKey, label: 'Staff', icon: UserCheck },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-white/95 dark:bg-[#0E1015]/95 backdrop-blur border-t border-gray-200 dark:border-[#1E222D] flex items-center justify-around px-2 z-40 select-none shadow-lg transition-colors">
      {mainTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onSelectTab(tab.key)}
            className={`flex flex-col items-center justify-center gap-1 w-16 py-1 transition-colors ${
              isActive
                ? 'text-gold font-bold'
                : 'text-gray-500 dark:text-cream-muted hover:text-gray-900 dark:hover:text-cream'
            }`}
          >
            <Icon size={20} className={isActive ? 'text-gold stroke-[2.5]' : 'stroke-[1.75]'} />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
