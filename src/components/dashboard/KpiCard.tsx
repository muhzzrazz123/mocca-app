import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  badgeText?: string;
  badgeType?: 'positive' | 'negative' | 'neutral' | 'gold';
  highlight?: boolean;
  extraInfo?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeType = 'neutral',
  highlight = false,
  extraInfo,
}) => {
  const getBadgeClass = () => {
    switch (badgeType) {
      case 'positive':
        return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-emerald-500/30';
      case 'negative':
        return 'bg-rose-500/15 text-rose-800 dark:text-rose-400 border-rose-500/30';
      case 'gold':
        return 'bg-gold/25 text-black dark:text-gold border-gold/50 font-bold';
      default:
        return 'bg-gray-100 dark:bg-mocca-700/50 text-gray-800 dark:text-cream-muted border-gray-300 dark:border-mocca-600/50 font-medium';
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 group shadow-sm ${
        highlight
          ? 'bg-white dark:bg-[#12141A] border-gold/70 ring-1 ring-gold/40'
          : 'bg-white hover:bg-gray-50/80 dark:bg-[#12141A] dark:hover:bg-[#181B24] border-gray-300 dark:border-[#222736]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-bold text-gray-600 dark:text-mocca-400 uppercase tracking-wider truncate">
            {title}
          </p>
          <h3 className="text-2xl lg:text-3xl font-black tracking-tight text-black dark:text-cream group-hover:text-gold-700 dark:group-hover:text-gold transition-colors truncate">
            {value}
          </h3>
        </div>

        <div
          className={`p-3 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${
            highlight
              ? 'bg-gold/20 text-black dark:text-gold border-gold/50'
              : 'bg-gray-100 dark:bg-mocca-800 text-black dark:text-gold/80 border-gray-300 dark:border-mocca-700'
          }`}
        >
          <Icon size={22} className="stroke-[2.5]" />
        </div>
      </div>

      {(subtitle || badgeText || extraInfo) && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-mocca-800/80 flex items-center justify-between text-xs gap-2">
          {subtitle && <span className="text-gray-700 dark:text-cream-muted font-medium truncate">{subtitle}</span>}
          {badgeText && (
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full border font-bold shrink-0 ${getBadgeClass()}`}
            >
              {badgeText}
            </span>
          )}
          {extraInfo && <span className="text-[11px] text-gray-600 dark:text-mocca-400 font-semibold truncate">{extraInfo}</span>}
        </div>
      )}
    </div>
  );
};
