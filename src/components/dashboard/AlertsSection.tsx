import React from 'react';
import {
  AlertTriangle,
  XCircle,
  Clock,
  UserX,
  Calendar,
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
      <div className="bg-mocca-900/60 border border-mocca-800 rounded-2xl p-5 flex items-center gap-3 text-emerald-400">
        <Sparkles size={20} className="shrink-0" />
        <div>
          <p className="text-sm font-semibold text-cream">All Systems Clear</p>
          <p className="text-xs text-mocca-400">
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
          border: 'border-rose-500/40 hover:border-rose-500/80',
          bg: 'bg-rose-500/10',
          iconBg: 'bg-rose-500/20 text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        };
      case 'warning':
        return {
          border: 'border-amber-500/40 hover:border-amber-500/80',
          bg: 'bg-amber-500/10',
          iconBg: 'bg-amber-500/20 text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      default:
        return {
          border: 'border-gold/30 hover:border-gold/60',
          bg: 'bg-gold/5',
          iconBg: 'bg-gold/15 text-gold',
          badge: 'bg-gold/20 text-gold border-gold/40',
        };
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-cream">
            Action Required ({alerts.length})
          </h3>
        </div>
        <span className="text-xs text-mocca-400">Real-time alerts</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {alerts.map((alert) => {
          const Icon = getAlertIcon(alert.category);
          const colors = getAlertColors(alert.type);

          return (
            <div
              key={alert.id}
              onClick={() => onNavigate(alert.actionTab)}
              className={`p-4 rounded-xl border transition-all cursor-pointer group flex items-start justify-between gap-3 ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={`p-2 rounded-lg shrink-0 ${colors.iconBg}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded border font-bold uppercase tracking-wider ${colors.badge}`}
                    >
                      {alert.category}
                    </span>
                    <h4 className="text-xs font-bold text-cream truncate">{alert.title}</h4>
                  </div>
                  <p className="text-xs text-cream-muted line-clamp-2 leading-relaxed">
                    {alert.description}
                  </p>
                </div>
              </div>

              <button
                className="shrink-0 p-1.5 rounded-lg bg-mocca-800 text-gold group-hover:bg-gold group-hover:text-mocca-950 transition-colors"
                title={alert.actionLabel}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
