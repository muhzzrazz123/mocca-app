import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  badgeText?: string;
  badgeType?: 'positive' | 'negative' | 'neutral' | 'emerald';
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
      case 'emerald':
        return 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border-emerald-500/50 font-bold';
      default:
        return 'bg-gray-100 dark:bg-[#182B3A] text-gray-800 dark:text-[#CCD0CF] border-gray-300 dark:border-[#253745] font-medium';
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 group shadow-sm ${
        highlight
          ? 'bg-white dark:bg-[#11212D] border-emerald-500/60 ring-1 ring-emerald-500/30 hover:border-emerald-500'
          : 'bg-white hover:bg-gray-50/80 dark:bg-[#11212D] dark:hover:bg-[#182B3A] border-gray-300 hover:border-emerald-500 dark:border-[#253745] hover:shadow-emerald-500/10'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-bold text-[#4A5C6A] dark:text-[#9BA8AB] uppercase tracking-wider truncate">
            {title}
          </p>
          <h3 className="text-2xl lg:text-3xl font-black tracking-tight text-[#06141B] dark:text-[#CCD0CF] group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
            {value}
          </h3>
        </div>

        <div
          className={`p-3 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${
            highlight
              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/50'
              : 'bg-gray-100 dark:bg-[#182B3A] text-[#06141B] dark:text-emerald-400 border-gray-300 dark:border-[#253745]'
          }`}
        >
          <Icon size={22} className="stroke-[2.5]" />
        </div>
      </div>

      {(subtitle || badgeText || extraInfo) && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-[#253745] flex items-center justify-between text-xs gap-2">
          {subtitle && <span className="text-[#4A5C6A] dark:text-[#9BA8AB] font-medium truncate">{subtitle}</span>}
          {badgeText && (
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full border font-bold shrink-0 ${getBadgeClass()}`}
            >
              {badgeText}
            </span>
          )}
          {extraInfo && <span className="text-[11px] text-[#4A5C6A] dark:text-[#9BA8AB] font-semibold truncate">{extraInfo}</span>}
        </div>
      )}
    </div>
  );
};
