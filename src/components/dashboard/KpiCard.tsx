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
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'negative':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'gold':
        return 'bg-gold/20 text-gold border-gold/40 font-bold';
      default:
        return 'bg-mocca-700/50 text-cream-muted border-mocca-600/50';
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 group ${
        highlight
          ? 'bg-gradient-to-br from-mocca-850 via-mocca-900 to-mocca-950 border-gold/40 shadow-gold-glow'
          : 'bg-mocca-900/90 hover:bg-mocca-850 border-mocca-750/80 hover:border-mocca-600'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-semibold text-mocca-400 uppercase tracking-wider truncate">
            {title}
          </p>
          <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-cream group-hover:text-gold transition-colors truncate">
            {value}
          </h3>
        </div>

        <div
          className={`p-3 rounded-xl border shrink-0 transition-transform group-hover:scale-105 ${
            highlight
              ? 'bg-gold/15 text-gold border-gold/40'
              : 'bg-mocca-800 text-gold/80 border-mocca-700'
          }`}
        >
          <Icon size={22} />
        </div>
      </div>

      {(subtitle || badgeText || extraInfo) && (
        <div className="mt-4 pt-3 border-t border-mocca-800/80 flex items-center justify-between text-xs gap-2">
          {subtitle && <span className="text-cream-muted truncate">{subtitle}</span>}
          {badgeText && (
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${getBadgeClass()}`}
            >
              {badgeText}
            </span>
          )}
          {extraInfo && <span className="text-[11px] text-mocca-400 truncate">{extraInfo}</span>}
        </div>
      )}
    </div>
  );
};
