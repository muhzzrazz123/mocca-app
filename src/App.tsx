import React, { useState, useEffect } from 'react';
import { seedDatabaseIfEmpty } from './db/seedData';
import { AuthProvider } from './context/AuthContext';
import { PeriodProvider } from './context/PeriodContext';
import { MainLayout } from './components/layout/MainLayout';
import { Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        await seedDatabaseIfEmpty();
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setTimeout(() => setIsInitializing(false), 500); // Smooth subtle fade
      }
    }
    init();
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-mocca-950 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gold/20 rounded-full blur-2xl animate-pulse" />
          <img
            src="/mocca-logo.png"
            alt="MOCCA Official Logo"
            className="w-24 h-24 rounded-full object-cover relative z-10 shadow-gold-glow ring-2 ring-gold/60 animate-pulse"
          />
        </div>

        <h1 className="text-2xl lg:text-3xl font-bold text-gold font-serif tracking-wider mb-1">
          MOCCA
        </h1>
        <p className="text-xs uppercase tracking-[0.25em] text-cream-muted font-semibold mb-6">
          Gents & Boys Collections
        </p>

        <div className="flex items-center gap-2 text-xs text-mocca-400 font-medium">
          <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <span>Synchronizing Retail Store Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <PeriodProvider>
        <MainLayout />
      </PeriodProvider>
    </AuthProvider>
  );
};

export default App;
