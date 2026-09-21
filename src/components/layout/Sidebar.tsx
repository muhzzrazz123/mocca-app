import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Shirt,
  Boxes,
  ShoppingBag,
  Truck,
  Users,
  MessageSquarePlus,
  UserCheck,
  Landmark,
  CalendarClock,
  BarChart3,
  Lightbulb,
  Settings,
  ChevronRight,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavItemKey =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'purchases'
  | 'suppliers'
  | 'customers'
  | 'customer-requests'
  | 'staff'
  | 'finance'
  | 'bills'
  | 'reports'
  | 'insights'
  | 'settings';

interface SidebarProps {
  activeTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  pendingRequestsCount?: number;
  alertsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingRequestsCount = 0,
  alertsCount = 0,
}) => {
  const { role, currentUser, switchRole, canViewFinancials, canEditSettings } = useAuth();

  const navItems = [
    { key: 'dashboard' as NavItemKey, label: 'Dashboard', icon: LayoutDashboard },
    { key: 'pos' as NavItemKey, label: 'Billing / POS', icon: ReceiptText, badge: 'HOT' },
    { key: 'products' as NavItemKey, label: 'Products', icon: Shirt },
    { key: 'inventory' as NavItemKey, label: 'Inventory', icon: Boxes },
    { key: 'purchases' as NavItemKey, label: 'Purchases', icon: ShoppingBag },
    { key: 'suppliers' as NavItemKey, label: 'Suppliers', icon: Truck },
    { key: 'customers' as NavItemKey, label: 'Customers', icon: Users },
    {
      key: 'customer-requests' as NavItemKey,
      label: 'Customer Requests',
      icon: MessageSquarePlus,
      badgeCount: pendingRequestsCount,
    },
    { key: 'staff' as NavItemKey, label: 'Staff & Attendance', icon: UserCheck },
    ...(canViewFinancials
      ? [{ key: 'finance' as NavItemKey, label: 'Finance', icon: Landmark }]
      : []),
    {
      key: 'bills' as NavItemKey,
      label: 'Bills & Payments',
      icon: CalendarClock,
      badgeCount: alertsCount > 0 ? alertsCount : undefined,
    },
    { key: 'reports' as NavItemKey, label: 'Reports', icon: BarChart3 },
    { key: 'insights' as NavItemKey, label: 'MOCCA Insights', icon: Lightbulb },
    ...(canEditSettings
      ? [{ key: 'settings' as NavItemKey, label: 'Settings', icon: Settings }]
      : []),
  ];

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-mocca-900 border-r border-mocca-750/80 select-none shrink-0 h-screen sticky top-0">
      {/* Brand Header with Official MOCCA Logo */}
      <div className="px-6 py-5 border-b border-mocca-750/80 flex items-center gap-3.5 bg-mocca-900/60 backdrop-blur">
        <div className="relative group">
          <img
            src="/mocca-logo.png"
            alt="MOCCA Logo"
            className="w-12 h-12 rounded-full object-cover shadow-gold-glow ring-2 ring-gold/40 transition-transform group-hover:scale-105"
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-mocca-900"></span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-gold font-serif font-bold text-lg tracking-wider leading-tight">
            MOCCA
          </span>
          <span className="text-[11px] font-medium text-cream-muted uppercase tracking-widest truncate">
            Gents & Boys
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-mocca-400">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-gold/20 via-gold/10 to-transparent text-gold border-l-2 border-gold font-semibold shadow-sm'
                  : 'text-cream-muted hover:text-cream hover:bg-mocca-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={19}
                  className={`transition-colors ${
                    isActive ? 'text-gold' : 'text-mocca-400 group-hover:text-cream'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/20 text-gold border border-gold/30 font-bold uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
                {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                    {item.badgeCount}
                  </span>
                )}
                {isActive && <ChevronRight size={14} className="text-gold/80" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* User Role Card & Switcher */}
      <div className="p-3 border-t border-mocca-750/80 bg-mocca-950/40">
        <div className="bg-mocca-850 p-3 rounded-xl border border-mocca-750 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center text-gold font-bold text-xs shrink-0">
              <ShieldCheck size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-cream truncate leading-tight">
                {currentUser?.name || 'Staff User'}
              </p>
              <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-mocca-750 text-gold uppercase tracking-wider mt-0.5">
                {role}
              </span>
            </div>
          </div>

          {/* Quick Role Switcher for paired testing */}
          <select
            value={role}
            onChange={(e) => switchRole(e.target.value as any)}
            className="bg-mocca-900 border border-mocca-700 text-cream text-[11px] rounded-lg px-2 py-1 outline-none focus:border-gold cursor-pointer"
            title="Switch User Role"
          >
            <option value="ADMIN">Owner</option>
            <option value="MANAGER">Manager</option>
            <option value="CASHIER">Cashier</option>
          </select>
        </div>
      </div>
    </aside>
  );
};
