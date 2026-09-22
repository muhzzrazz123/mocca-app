import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface BarcodeContextType {
  lastScannedBarcode: string | null;
  triggerBarcodeScan: (barcode: string) => void;
  isCameraScannerOpen: boolean;
  setIsCameraScannerOpen: (open: boolean) => void;
  scanToast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showScanToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const BarcodeContext = createContext<BarcodeContextType | undefined>(undefined);

export const BARCODE_SCAN_EVENT = 'mocca:barcode-scanned';

export const BarcodeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [scanToast, setScanToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const toastTimeoutRef = useRef<number | null>(null);

  const showScanToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setScanToast({ message, type });
    toastTimeoutRef.current = window.setTimeout(() => {
      setScanToast(null);
    }, 3500);
  };

  const triggerBarcodeScan = (rawBarcode: string) => {
    const cleaned = rawBarcode.trim();
    if (!cleaned) return;

    setLastScannedBarcode(cleaned);

    // Dispatch global event so MainLayout and PosBillingView can respond immediately
    const event = new CustomEvent(BARCODE_SCAN_EVENT, {
      detail: { barcode: cleaned },
    });
    window.dispatchEvent(event);
  };

  // Global Hardware Scanner Listener (captures rapid keyboard wedge sequences)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = performance.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Ignore modifiers
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
        return;
      }

      // Check if scanner finished sequence with 'Enter'
      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 3) {
          const scannedCode = bufferRef.current;
          bufferRef.current = '';
          triggerBarcodeScan(scannedCode);
        } else {
          bufferRef.current = '';
        }
        return;
      }

      // If time between keystrokes is small (< 85ms), it's a hardware barcode scanner typing
      if (timeDiff > 90) {
        // Reset buffer if human typing slowly
        bufferRef.current = '';
      }

      // Append printable single character
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  return (
    <BarcodeContext.Provider
      value={{
        lastScannedBarcode,
        triggerBarcodeScan,
        isCameraScannerOpen,
        setIsCameraScannerOpen,
        scanToast,
        showScanToast,
      }}
    >
      {children}

      {/* Floating Scan Feedback Banner */}
      {scanToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div
            className={`px-4 py-2.5 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold ${
              scanToast.type === 'success'
                ? 'bg-[#11212D] text-emerald-400 border-emerald-500/50'
                : scanToast.type === 'error'
                ? 'bg-[#11212D] text-rose-400 border-rose-500/50'
                : 'bg-[#11212D] text-[#CCD0CF] border-[#253745]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                scanToast.type === 'success'
                  ? 'bg-emerald-500'
                  : scanToast.type === 'error'
                  ? 'bg-rose-500'
                  : 'bg-blue-400'
              } animate-ping`}
            />
            <span>{scanToast.message}</span>
          </div>
        </div>
      )}
    </BarcodeContext.Provider>
  );
};

export const useBarcode = (): BarcodeContextType => {
  const context = useContext(BarcodeContext);
  if (!context) {
    throw new Error('useBarcode must be used within a BarcodeProvider');
  }
  return context;
};
