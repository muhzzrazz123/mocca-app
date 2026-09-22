import React, { useState, useEffect } from 'react';
import { useSecurity, type UserAccessMode } from '../../context/SecurityContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import {
  Lock,
  ShieldCheck,
  Delete,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  ShoppingCart,
} from 'lucide-react';

export const LockScreen: React.FC = () => {
  const { unlockOwner, unlockStaff, targetLockScreen, setTargetLockScreen } = useSecurity();
  const [mode, setMode] = useState<UserAccessMode>(targetLockScreen || 'owner');
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  // Live staff list for staff selection
  const staffList = useLiveQuery(() => db.staff.toArray(), []) || [];
  const [selectedStaffName, setSelectedStaffName] = useState<string>('');

  useEffect(() => {
    if (staffList.length > 0 && !selectedStaffName) {
      const cashier = staffList.find((s) => s.position === 'Cashier') || staffList[0];
      setSelectedStaffName(`${cashier.name} (${cashier.position})`);
    }
  }, [staffList, selectedStaffName]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        if (pin.length >= 4) {
          handleUnlock(pin);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, mode, selectedStaffName]);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 4) {
        setTimeout(() => {
          handleUnlock(nextPin);
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

  const handleUnlock = (pinToTest: string) => {
    if (mode === 'owner') {
      const success = unlockOwner(pinToTest);
      if (!success) {
        setError(true);
        setPin('');
      }
    } else {
      const success = unlockStaff(pinToTest, selectedStaffName || 'Staff Cashier');
      if (!success) {
        setError(true);
        setPin('');
      }
    }
  };

  const switchMode = (newMode: UserAccessMode) => {
    setMode(newMode);
    setTargetLockScreen(newMode);
    setPin('');
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#CCD0CF] dark:bg-[#06141B] flex flex-col items-center justify-center p-6 text-[#06141B] dark:text-[#CCD0CF] select-none overflow-hidden transition-colors">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-500/15 to-transparent rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-10 w-[600px] h-[300px] bg-gradient-to-t from-gray-300/60 dark:from-[#11212D]/60 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-sm flex flex-col items-center relative z-10 space-y-5">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2.5">
          <div className="relative inline-block group">
            <img
              src="/mocca-logo.png"
              alt="MOCCA Logo"
              className="w-20 h-20 rounded-full object-cover shadow-lg ring-2 ring-emerald-500/60 mx-auto transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <Lock size={12} className="stroke-[2.5]" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold font-serif text-[#06141B] dark:text-[#CCD0CF] tracking-wide">
              MOCCA GENTS & BOYS
            </h1>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#4A5C6A] dark:text-[#9BA8AB] font-bold mt-1">
              {mode === 'owner' ? 'Store Owner Security Access' : 'Staff POS Counter Billing'}
            </p>
          </div>
        </div>

        {/* Identity & Mode Badge */}
        {mode === 'owner' ? (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] text-xs shadow-sm">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[#4A5C6A] dark:text-[#9BA8AB] font-medium">Store Owner:</span>
            <span className="text-[#06141B] dark:text-emerald-400 font-bold">Mashboob</span>
          </div>
        ) : (
          <div className="w-full space-y-2">
            <div className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] text-xs shadow-sm">
              <ShoppingCart size={14} className="text-emerald-500" />
              <span className="text-[#06141B] dark:text-emerald-400 font-bold">
                Direct Counter Billing
              </span>
            </div>

            {/* Staff Selector */}
            {staffList.length > 0 && (
              <div className="flex items-center gap-2 bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] px-3 py-1.5 rounded-xl shadow-sm text-xs">
                <UserCheck size={14} className="text-emerald-500 shrink-0" />
                <select
                  value={selectedStaffName}
                  onChange={(e) => setSelectedStaffName(e.target.value)}
                  className="w-full bg-transparent text-[#06141B] dark:text-[#CCD0CF] font-semibold outline-none cursor-pointer text-xs"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={`${s.name} (${s.position})`} className="text-gray-900">
                      {s.name} — {s.position}
                    </option>
                  ))}
                  <option value="Staff Cashier" className="text-gray-900">
                    Other Staff / Counter Cashier
                  </option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* PIN Dots Indicator */}
        <div className="space-y-2 text-center w-full">
          <div
            className={`flex items-center justify-center gap-3.5 py-1.5 ${
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
                      ? 'bg-[#06141B] dark:bg-emerald-500 shadow-md scale-110'
                      : 'bg-white dark:bg-[#182B3A] border-2 border-gray-400 dark:border-[#253745]'
                  }`}
                />
              );
            })}
          </div>

          {error ? (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center justify-center gap-1.5">
              <AlertCircle size={14} /> Incorrect {mode === 'owner' ? 'Owner' : 'Staff'} PIN. Try again.
            </p>
          ) : (
            <p className="text-xs text-gray-700 dark:text-[#9BA8AB] font-medium">
              {mode === 'owner'
                ? 'Enter 4-digit Owner PIN to access full store'
                : 'Enter 4-digit Staff PIN to access POS Billing'}
            </p>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-13 rounded-2xl bg-white dark:bg-[#14161D] hover:bg-emerald-50 dark:hover:bg-[#1C1F28] active:bg-emerald-100 dark:active:bg-emerald-500/20 active:scale-95 border border-gray-300 dark:border-[#242833] hover:border-emerald-500 text-2xl font-black text-black dark:text-[#CCD0CF] hover:text-emerald-700 dark:hover:text-emerald-400 transition-all flex items-center justify-center shadow-sm"
            >
              {digit}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            className="h-13 rounded-2xl bg-white dark:bg-[#14161D] hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-95 border border-gray-300 dark:border-[#242833] hover:border-rose-400 text-xs font-bold text-gray-700 hover:text-rose-600 dark:text-[#9BA8AB] dark:hover:text-rose-400 transition-all flex items-center justify-center shadow-sm"
          >
            CLEAR
          </button>

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-13 rounded-2xl bg-white dark:bg-[#14161D] hover:bg-emerald-50 dark:hover:bg-[#1C1F28] active:bg-emerald-100 dark:active:bg-emerald-500/20 active:scale-95 border border-gray-300 dark:border-[#242833] hover:border-emerald-500 text-2xl font-black text-black dark:text-[#CCD0CF] hover:text-emerald-700 dark:hover:text-emerald-400 transition-all flex items-center justify-center shadow-sm"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-13 rounded-2xl bg-white dark:bg-[#14161D] hover:bg-emerald-50 dark:hover:bg-[#1C1F28] hover:border-emerald-500 active:scale-95 border border-gray-300 dark:border-[#242833] text-gray-800 hover:text-emerald-700 dark:text-[#9BA8AB] dark:hover:text-emerald-400 transition-all flex items-center justify-center shadow-sm"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Mode Switcher Button */}
        <div className="pt-1">
          {mode === 'owner' ? (
            <button
              type="button"
              onClick={() => switchMode('staff')}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] hover:border-emerald-500 text-xs font-bold text-[#06141B] dark:text-[#CCD0CF] hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center gap-2 shadow-sm"
            >
              <span>Staff / Cashier Counter Login</span>
              <ArrowRight size={15} className="text-emerald-500" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode('owner')}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] hover:border-emerald-500 text-xs font-bold text-[#06141B] dark:text-[#CCD0CF] hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex items-center gap-2 shadow-sm"
            >
              <ArrowLeft size={15} className="text-emerald-500" />
              <span>Owner Access (Mashboob)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
