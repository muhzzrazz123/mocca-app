import React, { createContext, useContext, useState, useEffect } from 'react';

interface SecurityContextType {
  isLocked: boolean;
  unlock: (enteredPin: string) => boolean;
  lock: () => void;
  ownerPin: string;
  updatePin: (currentPin: string, newPin: string) => boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const OWNER_PIN_STORAGE_KEY = 'mocca_owner_pin';
const LOCK_STATE_STORAGE_KEY = 'mocca_app_locked';

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ownerPin, setOwnerPin] = useState<string>(() => {
    return localStorage.getItem(OWNER_PIN_STORAGE_KEY) || '1234';
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    // Lock on initial load for security
    const stored = sessionStorage.getItem(LOCK_STATE_STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });

  const unlock = (enteredPin: string): boolean => {
    if (enteredPin === ownerPin) {
      setIsLocked(false);
      sessionStorage.setItem(LOCK_STATE_STORAGE_KEY, 'false');
      return true;
    }
    return false;
  };

  const lock = () => {
    setIsLocked(true);
    sessionStorage.setItem(LOCK_STATE_STORAGE_KEY, 'true');
  };

  const updatePin = (currentPin: string, newPin: string): boolean => {
    if (currentPin === ownerPin && newPin.length >= 4) {
      setOwnerPin(newPin);
      localStorage.setItem(OWNER_PIN_STORAGE_KEY, newPin);
      return true;
    }
    return false;
  };

  return (
    <SecurityContext.Provider value={{ isLocked, unlock, lock, ownerPin, updatePin }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
