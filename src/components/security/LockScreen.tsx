import React, { useState, useEffect } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { Lock, ShieldCheck, Delete, ArrowRight, KeyRound, AlertCircle } from 'lucide-react';

export const LockScreen: React.FC = () => {
  const { unlock } = useSecurity();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);

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
    <div className="fixed inset-0 z-50 bg-[#0A0B0E] flex flex-col items-center justify-center p-6 text-cream select-none overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-gold/10 to-transparent rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-10 w-[600px] h-[300px] bg-gradient-to-t from-gray-900/60 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-sm flex flex-col items-center relative z-10 space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-3">
          <div className="relative inline-block group">
            <img
              src="/mocca-logo.png"
              alt="MOCCA Logo"
              className="w-20 h-20 rounded-full object-cover shadow-gold-glow ring-2 ring-gold/50 mx-auto transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold">
              <Lock size={12} />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold font-serif text-cream tracking-wide">
              MOCCA GENTS & BOYS
            </h1>
            <p className="text-[11px] uppercase tracking-[0.2em] text-mocca-400 font-semibold mt-0.5">
              Owner Security Counter Access
            </p>
          </div>
        </div>

        {/* User Identity Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#14161D] border border-[#272B36] text-xs">
          <ShieldCheck size={14} className="text-gold" />
          <span className="text-cream-muted font-medium">Store Owner:</span>
          <span className="text-gold font-bold">Mashboob</span>
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
                      ? 'bg-gold shadow-gold-glow scale-110'
                      : 'bg-[#1C1F28] border border-[#2F3543]'
                  }`}
                />
              );
            })}
          </div>

          {error ? (
            <p className="text-xs text-rose-400 font-medium flex items-center justify-center gap-1.5">
              <AlertCircle size={13} /> Incorrect Owner PIN. Try again.
            </p>
          ) : (
            <p className="text-xs text-mocca-400">Enter your 4-digit PIN to access the register</p>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-[#14161D] hover:bg-[#1C1F28] active:bg-gold/20 active:scale-95 border border-[#242833] hover:border-gold/40 text-lg font-bold text-cream transition-all flex items-center justify-center shadow-sm"
            >
              {digit}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-[#14161D] hover:bg-rose-500/10 active:scale-95 border border-[#242833] hover:border-rose-500/40 text-xs font-bold text-mocca-400 hover:text-rose-400 transition-all flex items-center justify-center"
          >
            CLEAR
          </button>

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-[#14161D] hover:bg-[#1C1F28] active:bg-gold/20 active:scale-95 border border-[#242833] hover:border-gold/40 text-lg font-bold text-cream transition-all flex items-center justify-center shadow-sm"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-[#14161D] hover:bg-[#1C1F28] active:scale-95 border border-[#242833] text-mocca-400 hover:text-cream transition-all flex items-center justify-center"
          >
            <Delete size={18} />
          </button>
        </div>

        {/* Default PIN Hint */}
        <div className="pt-2 text-center text-[11px] text-mocca-500 flex items-center justify-center gap-1.5">
          <KeyRound size={12} className="text-gold/60" />
          <span>Default Store Owner PIN: <strong>1234</strong></span>
        </div>
      </div>
    </div>
  );
};
