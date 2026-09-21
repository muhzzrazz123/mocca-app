import React, { createContext, useContext, useState, useMemo } from 'react';

export type PeriodFilter =
  | 'Today'
  | 'Yesterday'
  | 'Last 7 Days'
  | 'Last 30 Days'
  | 'This Month'
  | 'Last Month'
  | 'This Year'
  | 'Custom';

interface PeriodContextType {
  period: PeriodFilter;
  setPeriod: (p: PeriodFilter) => void;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  customStart: string;
  customEnd: string;
  setCustomRange: (start: string, end: string) => void;
  periodLabel: string;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export const PeriodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [period, setPeriod] = useState<PeriodFilter>('Today');
  
  const today = new Date();
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];

  const [customStart, setCustomStart] = useState<string>(formatYMD(new Date(Date.now() - 86400000 * 7)));
  const [customEnd, setCustomEnd] = useState<string>(formatYMD(today));

  const { startDate, endDate, periodLabel } = useMemo(() => {
    const now = new Date();
    const todayStr = formatYMD(now);

    switch (period) {
      case 'Today':
        return { startDate: todayStr, endDate: todayStr, periodLabel: "Today's Business" };

      case 'Yesterday': {
        const y = new Date(now.getTime() - 86400000);
        const yStr = formatYMD(y);
        return { startDate: yStr, endDate: yStr, periodLabel: 'Yesterday' };
      }

      case 'Last 7 Days': {
        const d7 = new Date(now.getTime() - 86400000 * 6);
        return { startDate: formatYMD(d7), endDate: todayStr, periodLabel: 'Last 7 Days' };
      }

      case 'Last 30 Days': {
        const d30 = new Date(now.getTime() - 86400000 * 29);
        return { startDate: formatYMD(d30), endDate: todayStr, periodLabel: 'Last 30 Days' };
      }

      case 'This Month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startDate: formatYMD(startOfMonth), endDate: todayStr, periodLabel: 'This Month' };
      }

      case 'Last Month': {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          startDate: formatYMD(startOfLastMonth),
          endDate: formatYMD(endOfLastMonth),
          periodLabel: 'Last Month',
        };
      }

      case 'This Year': {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return { startDate: formatYMD(startOfYear), endDate: todayStr, periodLabel: 'This Year' };
      }

      case 'Custom':
        return {
          startDate: customStart,
          endDate: customEnd,
          periodLabel: `${customStart} to ${customEnd}`,
        };

      default:
        return { startDate: todayStr, endDate: todayStr, periodLabel: 'Today' };
    }
  }, [period, customStart, customEnd]);

  const setCustomRange = (start: string, end: string) => {
    setCustomStart(start);
    setCustomEnd(end);
    setPeriod('Custom');
  };

  return (
    <PeriodContext.Provider
      value={{
        period,
        setPeriod,
        startDate,
        endDate,
        customStart,
        customEnd,
        setCustomRange,
        periodLabel,
      }}
    >
      {children}
    </PeriodContext.Provider>
  );
};

export const usePeriod = (): PeriodContextType => {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriod must be used within a PeriodProvider');
  }
  return context;
};
