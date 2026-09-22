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
    <div className="bg-white dark:bg-[#12141A] rounded-2xl p-6 border border-gray-300 dark:border-gold/30 shadow-sm relative overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-mocca-750/80 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gold/20 text-black dark:text-gold border border-gold/40 shadow-sm">
            <Lightbulb size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-black dark:text-cream font-serif tracking-wide">
                MOCCA Smart Insights
              </h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gold/20 text-black dark:text-gold border border-gold/40">
                AI Telemetry
              </span>
            </div>
            <p className="text-xs text-gray-700 dark:text-cream-muted font-medium">
              Auto-calculated from real sales, inventory, and customer activity
            </p>
          </div>
        </div>
      </div>

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 relative z-10">
        {insights.map((item) => {
          const Icon = getIcon(item.type);
          return (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-gray-50 dark:bg-[#181B24] border border-gray-200 dark:border-mocca-750 flex flex-col justify-between space-y-2 hover:border-gold/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gold/20 text-black dark:text-gold">
                    <Icon size={16} className="stroke-[2.5]" />
                  </div>
                  <h4 className="text-xs font-black text-black dark:text-cream">{item.title}</h4>
                </div>
                {item.metric && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-mocca-800 text-black dark:text-gold border border-gray-300 dark:border-mocca-700 shrink-0">
                    {item.metric}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-800 dark:text-cream-muted leading-relaxed font-medium">
                {item.text}
              </p>
            </div>
          );
        })}

        {insights.length === 0 && (
          <div className="col-span-full text-center py-6 text-xs text-gray-600 dark:text-mocca-400">
            No telemetry insights generated yet. Insights will appear as sales and inventory move.
          </div>
        )}
      </div>
    </div>
  );
};
