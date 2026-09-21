import React, { useState } from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Shirt,
  BarChart3,
  MoreHorizontal,
  X,
  Boxes,
  ShoppingBag,
  Truck,
  Users,
  MessageSquarePlus,
  UserCheck,
  Landmark,
  CalendarClock,
  Lightbulb,
  Settings,
} from 'lucide-react';
import type { NavItemKey } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  activeTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  isOpenMore: boolean;
  setIsOpenMore: (open: boolean) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onSelectTab,
  isOpenMore,
  setIsOpenMore,
}) => {
  const { canViewFinancials, canEditSettings } = useAuth();

  const mainTabs = [
    { key: 'dashboard' as NavItemKey, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'pos' as NavItemKey, label: 'Billing', icon: ReceiptText },
    { key: 'products' as NavItemKey, label: 'Products', icon: Shirt },
    { key: 'reports' as NavItemKey, label: 'Reports', icon: BarChart3 },
  ];

  const moreTabs = [
    { key: 'inventory' as NavItemKey, label: 'Inventory', icon: Boxes },
    { key: 'purchases' as NavItemKey, label: 'Purchases', icon: ShoppingBag },
    { key: 'suppliers' as NavItemKey, label: 'Suppliers', icon: Truck },
    { key: 'customers' as NavItemKey, label: 'Customers', icon: Users },
    { key: 'customer-requests' as NavItemKey, label: 'Customer Requests', icon: MessageSquarePlus },
    { key: 'staff' as NavItemKey, label: 'Staff & Attendance', icon: UserCheck },
    ...(canViewFinancials
      ? [{ key: 'finance' as NavItemKey, label: 'Finance', icon: Landmark }]
      : []),
    { key: 'bills' as NavItemKey, label: 'Bills & Payments', icon: CalendarClock },
    { key: 'insights' as NavItemKey, label: 'MOCCA Insights', icon: Lightbulb },
    ...(canEditSettings
      ? [{ key: 'settings' as NavItemKey, label: 'Settings', icon: Settings }]
      : []),
  ];

  return (
    <>
      {/* Slide-over Drawer for "More" */}
      {isOpenMore && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOpenMore(false)}
          />
          <div className="fixed bottom-0 inset-x-0 bg-mocca-900 border-t border-mocca-700 rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-mocca-750">
              <div className="flex items-center gap-3">
                <img
                  src="/mocca-logo.png"
                  alt="MOCCA"
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-gold"
                />
                <div>
                  <h3 className="text-gold font-serif font-bold text-base">MOCCA</h3>
                  <p className="text-xs text-cream-muted">All Store Management Sections</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpenMore(false)}
                className="p-2 rounded-lg bg-mocca-800 text-cream-muted hover:text-cream"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-4">
              {moreTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      onSelectTab(tab.key);
                      setIsOpenMore(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl text-left text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gold/20 text-gold border border-gold/40'
                        : 'bg-mocca-850 text-cream-muted hover:text-cream hover:bg-mocca-800'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-gold' : 'text-mocca-400'} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-mocca-900/95 backdrop-blur border-t border-mocca-750 flex items-center justify-around px-2 z-40 select-none">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onSelectTab(tab.key)}
              className={`flex flex-col items-center justify-center gap-1 w-16 py-1 transition-colors ${
                isActive ? 'text-gold font-bold' : 'text-cream-muted hover:text-cream'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-gold stroke-[2.5]' : 'stroke-[1.75]'} />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        <button
          onClick={() => setIsOpenMore(true)}
          className={`flex flex-col items-center justify-center gap-1 w-16 py-1 transition-colors ${
            isOpenMore ? 'text-gold font-bold' : 'text-cream-muted hover:text-cream'
          }`}
        >
          <MoreHorizontal size={20} className={isOpenMore ? 'text-gold' : ''} />
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </nav>
    </>
  );
};
