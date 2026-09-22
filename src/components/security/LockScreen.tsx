import React, { useState, useEffect } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { Lock, ShieldCheck, Delete, AlertCircle } from 'lucide-react';

export const LockScreen: React.FC = () => {
  const { unlock } = useSecurity();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        if (pin.length >= 4) {
          handleUnlock();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 4) {
        // Auto check on 4 digits
        setTimeout(() => {
          const success = unlock(nextPin);
          if (!success) {
            setError(true);
            setPin('');
          }
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const handleUnlock = () => {
    const success = unlock(pin);
    if (!success) {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#ECEEF2] dark:bg-[#0A0B0E] flex flex-col items-center justify-center p-6 text-black dark:text-cream select-none overflow-hidden transition-colors">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-gold/15 to-transparent rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-10 w-[600px] h-[300px] bg-gradient-to-t from-gray-300/60 dark:from-gray-900/60 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-sm flex flex-col items-center relative z-10 space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-3">
          <div className="relative inline-block group">
            <img
              src="/mocca-logo.png"
              alt="MOCCA Logo"
              className="w-20 h-20 rounded-full object-cover shadow-gold-glow ring-2 ring-gold/60 mx-auto transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gold text-mocca-950 flex items-center justify-center shadow-sm">
              <Lock size={12} className="stroke-[2.5]" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold font-serif text-black dark:text-cream tracking-wide">
              MOCCA GENTS & BOYS
            </h1>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gray-700 dark:text-mocca-400 font-bold mt-1">
              Owner Security Counter Access
            </p>
          </div>
        </div>

        {/* User Identity Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#14161D] border border-gray-300 dark:border-[#272B36] text-xs shadow-sm">
          <ShieldCheck size={14} className="text-gold" />
          <span className="text-gray-700 dark:text-cream-muted font-medium">Store Owner:</span>
          <span className="text-black dark:text-gold font-bold">Mashboob</span>
        </div>

        {/* PIN Dots Indicator */}
        <div className="space-y-2 text-center w-full">
          <div
            className={`flex items-center justify-center gap-3.5 py-2 ${
              error ? 'animate-bounce text-rose-500' : ''
            }`}
          >
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    error
                      ? 'bg-rose-500 ring-4 ring-rose-500/20'
                      : isFilled
                      ? 'bg-black dark:bg-gold shadow-md scale-110'
                      : 'bg-white dark:bg-[#1C1F28] border-2 border-gray-400 dark:border-[#2F3543]'
                  }`}
                />
              );
            })}
          </div>

          {error ? (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center justify-center gap-1.5">
              <AlertCircle size={14} /> Incorrect Owner PIN. Try again.
            </p>
          ) : (
            <p className="text-xs text-gray-700 dark:text-mocca-400 font-medium">
              Enter your 4-digit PIN to access the register
            </p>
          )}
        </div>

        {/* Numeric Keypad with Black Letters on White/Grey */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-white dark:bg-[#14161D] hover:bg-gray-100 dark:hover:bg-[#1C1F28] active:bg-gray-200 dark:active:bg-gold/20 active:scale-95 border border-gray-300 dark:border-[#242833] hover:border-gold/60 text-2xl font-black text-black dark:text-cream transition-all flex items-center justify-center shadow-sm"
            >
              {digit}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-white dark:bg-[#14161D] hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-95 border border-gray-300 dark:border-[#242833] hover:border-rose-400 text-xs font-bold text-gray-700 hover:text-rose-600 dark:text-mocca-400 dark:hover:text-rose-400 transition-all flex items-center justify-center shadow-sm"
          >
            CLEAR
          </button>

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-white dark:bg-[#14161D] hover:bg-gray-100 dark:hover:bg-[#1C1F28] active:bg-gray-200 dark:active:bg-gold/20 active:scale-95 border border-gray-300 dark:border-[#242833] hover:border-gold/60 text-2xl font-black text-black dark:text-cream transition-all flex items-center justify-center shadow-sm"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-white dark:bg-[#14161D] hover:bg-gray-100 dark:hover:bg-[#1C1F28] active:scale-95 border border-gray-300 dark:border-[#242833] text-gray-800 hover:text-black dark:text-mocca-400 dark:hover:text-cream transition-all flex items-center justify-center shadow-sm"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
