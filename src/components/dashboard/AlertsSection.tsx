import React from 'react';
import {
  AlertTriangle,
  Clock,
  UserX,
  CreditCard,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { NavItemKey } from '../layout/Sidebar';

export interface DashboardAlert {
  id: string;
  type: 'danger' | 'warning' | 'info';
  category: 'STOCK' | 'BILL' | 'STAFF' | 'SUPPLIER';
  title: string;
  description: string;
  actionTab: NavItemKey;
  actionLabel: string;
}

interface AlertsSectionProps {
  alerts: DashboardAlert[];
  onNavigate: (tab: NavItemKey) => void;
}

export const AlertsSection: React.FC<AlertsSectionProps> = ({ alerts, onNavigate }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-[#12141A] border border-gray-300 dark:border-mocca-800 rounded-2xl p-5 flex items-center gap-3 text-emerald-800 dark:text-emerald-400 shadow-sm">
        <Sparkles size={20} className="shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-bold text-black dark:text-cream">All Systems Clear</p>
          <p className="text-xs text-gray-700 dark:text-mocca-400">
            No critical alerts, overdue bills, or stock issues requiring urgent attention.
          </p>
        </div>
      </div>
    );
  }

  const getAlertIcon = (category: DashboardAlert['category']) => {
    switch (category) {
      case 'STOCK':
        return AlertTriangle;
      case 'BILL':
        return Clock;
      case 'STAFF':
        return UserX;
      case 'SUPPLIER':
        return CreditCard;
      default:
        return AlertTriangle;
    }
  };

  const getAlertColors = (type: DashboardAlert['type']) => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-rose-50/90 dark:bg-rose-950/20 hover:bg-rose-100/80 dark:hover:bg-rose-950/30',
          border: 'border-rose-300 dark:border-rose-800/40',
          iconBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
          badge: 'bg-rose-500/15 text-rose-800 dark:text-rose-400 border-rose-400/40',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50/90 dark:bg-amber-950/20 hover:bg-amber-100/80 dark:hover:bg-amber-950/30',
          border: 'border-amber-300 dark:border-amber-800/40',
          iconBg: 'bg-amber-500/15 text-amber-800 dark:text-amber-400',
          badge: 'bg-amber-500/15 text-amber-900 dark:text-amber-400 border-amber-400/40',
        };
      default:
        return {
          bg: 'bg-white dark:bg-mocca-900/80 hover:bg-gray-50 dark:hover:bg-mocca-850',
          border: 'border-gray-300 dark:border-mocca-750',
          iconBg: 'bg-gold/20 text-black dark:text-gold',
          badge: 'bg-gold/20 text-black dark:text-gold border-gold/40',
        };
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-cream">
            Action Required ({alerts.length})
          </h3>
        </div>
        <span className="text-xs text-gray-700 dark:text-mocca-400 font-semibold">Real-time alerts</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {alerts.map((alert) => {
          const Icon = getAlertIcon(alert.category);
          const colors = getAlertColors(alert.type);

          return (
            <div
              key={alert.id}
              onClick={() => onNavigate(alert.actionTab)}
              className={`p-4 rounded-xl border transition-all cursor-pointer group flex items-start justify-between gap-3 shadow-sm ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={`p-2 rounded-lg shrink-0 ${colors.iconBg}`}>
                  <Icon size={18} className="stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded border font-bold uppercase tracking-wider ${colors.badge}`}
                    >
                      {alert.category}
                    </span>
                    <h4 className="text-xs font-black text-black dark:text-cream truncate">{alert.title}</h4>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-cream-muted line-clamp-2 leading-relaxed font-medium">
                    {alert.description}
                  </p>
                </div>
              </div>

              <button
                className="shrink-0 p-1.5 rounded-lg bg-gray-100 dark:bg-mocca-800 text-black dark:text-gold group-hover:bg-gold group-hover:text-mocca-950 transition-colors border border-gray-300 dark:border-transparent"
                title={alert.actionLabel}
              >
                <ChevronRight size={16} className="stroke-[2.5]" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
