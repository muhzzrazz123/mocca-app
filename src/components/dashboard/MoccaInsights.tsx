import React from 'react';
import { Lightbulb, TrendingUp, AlertCircle, Sparkles, MessageSquare, Award } from 'lucide-react';

export interface InsightItem {
  id: string;
  type: 'bestseller' | 'stock' | 'request' | 'profit' | 'slow';
  title: string;
  text: string;
  metric?: string;
}

interface MoccaInsightsProps {
  insights: InsightItem[];
}

export const MoccaInsights: React.FC<MoccaInsightsProps> = ({ insights }) => {
  const getIcon = (type: InsightItem['type']) => {
    switch (type) {
      case 'bestseller':
        return Award;
      case 'profit':
        return TrendingUp;
      case 'stock':
        return AlertCircle;
      case 'request':
        return MessageSquare;
      case 'slow':
        return Sparkles;
      default:
        return Lightbulb;
    }
  };

  return (
    <div className="bg-gradient-to-br from-mocca-900 via-mocca-900 to-mocca-950 rounded-2xl p-6 border border-gold/30 shadow-gold-glow relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-mocca-750/80 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gold/15 text-gold border border-gold/40 shadow-sm">
            <Lightbulb size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-cream font-serif tracking-wide">
                MOCCA Smart Insights
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/40">
                AI Telemetry
              </span>
            </div>
            <p className="text-xs text-cream-muted">
              Auto-calculated from real sales, inventory, and customer activity
            </p>
          </div>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 relative z-10">
        {insights.map((item) => {
          const Icon = getIcon(item.type);
          return (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-mocca-850/80 hover:bg-mocca-800 border border-mocca-700/80 hover:border-gold/50 transition-all flex items-start gap-3.5 group"
            >
              <div className="p-2 rounded-lg bg-gold/10 text-gold border border-gold/20 shrink-0 group-hover:scale-105 transition-transform">
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold text-gold uppercase tracking-wider">
                    {item.title}
                  </span>
                  {item.metric && (
                    <span className="text-xs font-bold text-cream bg-mocca-900 px-2 py-0.5 rounded border border-mocca-700">
                      {item.metric}
                    </span>
                  )}
                </div>
                <p className="text-xs text-cream leading-relaxed font-medium">{item.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
