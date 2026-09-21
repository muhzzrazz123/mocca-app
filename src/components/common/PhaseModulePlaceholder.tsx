import React from 'react';
import { LucideIcon, ArrowLeft, ArrowRight, Database } from 'lucide-react';
import type { NavItemKey } from '../layout/Sidebar';

interface PhaseModulePlaceholderProps {
  tabKey: NavItemKey;
  title: string;
  description: string;
  icon: LucideIcon;
  phaseNumber: number;
  features: string[];
  dbEntities: string[];
  onBackToDashboard: () => void;
}

export const PhaseModulePlaceholder: React.FC<PhaseModulePlaceholderProps> = ({
  tabKey,
  title,
  description,
  icon: Icon,
  phaseNumber,
  features,
  dbEntities,
  onBackToDashboard,
}) => {
  return (
    <div className="p-6 lg:p-12 max-w-4xl mx-auto space-y-6 animate-fadeIn pb-24">
      <button
        onClick={onBackToDashboard}
        className="flex items-center gap-2 text-xs font-semibold text-gold hover:text-gold-light transition-colors"
      >
        <ArrowLeft size={16} /> Back to Live Dashboard
      </button>

      <div className="bg-mocca-900 border border-gold/30 rounded-2xl p-6 lg:p-8 space-y-6 shadow-luxury">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-gold/15 text-gold border border-gold/40 shrink-0">
            <Icon size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/40 uppercase tracking-wider">
                Phase {phaseNumber} Module
              </span>
              <span className="text-xs text-mocca-400">Database Ready</span>
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-cream font-serif">{title}</h2>
            <p className="text-sm text-cream-muted mt-1 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-mocca-800">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cream flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold" /> Key Functional Modules
            </h4>
            <ul className="space-y-2 text-xs text-cream-muted">
              {features.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <ArrowRight size={13} className="text-gold shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cream flex items-center gap-2">
              <Database size={14} className="text-emerald-400" /> Relational Database Tables
            </h4>
            <div className="flex flex-wrap gap-2">
              {dbEntities.map((ent, idx) => (
                <span
                  key={idx}
                  className="text-xs font-mono px-2.5 py-1 rounded-lg bg-mocca-850 border border-mocca-700 text-emerald-400"
                >
                  {ent}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-mocca-400 pt-2">
              All tables, relations, and initial seeds are active and synced in Dexie.js IndexedDB.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
