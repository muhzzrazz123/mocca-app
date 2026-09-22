import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserAccessMode = 'owner' | 'staff';

interface SecurityContextType {
  isLocked: boolean;
  userMode: UserAccessMode;
  activeStaffName: string;
  targetLockScreen: UserAccessMode;
  setTargetLockScreen: (screen: UserAccessMode) => void;
  ownerPin: string;
  staffPin: string;
  unlockOwner: (enteredPin: string) => boolean;
  unlockStaff: (enteredPin: string, staffName?: string) => boolean;
  unlock: (enteredPin: string) => boolean;
  lock: (targetScreen?: UserAccessMode) => void;
  updatePin: (currentPin: string, newPin: string) => boolean;
  updateStaffPin: (newPin: string) => boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const OWNER_PIN_STORAGE_KEY = 'mocca_owner_pin';
const STAFF_PIN_STORAGE_KEY = 'mocca_staff_pin';
const LOCK_STATE_STORAGE_KEY = 'mocca_app_locked';
const USER_MODE_STORAGE_KEY = 'mocca_user_mode';
const ACTIVE_STAFF_STORAGE_KEY = 'mocca_active_staff_name';

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ownerPin, setOwnerPin] = useState<string>(() => {
    const stored = localStorage.getItem(OWNER_PIN_STORAGE_KEY);
    if (!stored || stored === '1234') {
      localStorage.setItem(OWNER_PIN_STORAGE_KEY, '7755');
      return '7755';
    }
    return stored;
  });

  const [staffPin, setStaffPin] = useState<string>(() => {
    const stored = localStorage.getItem(STAFF_PIN_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STAFF_PIN_STORAGE_KEY, '0000');
      return '0000';
    }
    return stored;
  });

  const [userMode, setUserMode] = useState<UserAccessMode>(() => {
    const stored = sessionStorage.getItem(USER_MODE_STORAGE_KEY);
    return (stored === 'staff' ? 'staff' : 'owner') as UserAccessMode;
  });

  const [activeStaffName, setActiveStaffName] = useState<string>(() => {
    return sessionStorage.getItem(ACTIVE_STAFF_STORAGE_KEY) || 'Karthik S (Cashier)';
  });

  const [targetLockScreen, setTargetLockScreen] = useState<UserAccessMode>('owner');

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    // Lock on initial load for security
    const stored = sessionStorage.getItem(LOCK_STATE_STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });

  const unlockOwner = (enteredPin: string): boolean => {
    if (enteredPin === ownerPin) {
      setUserMode('owner');
      sessionStorage.setItem(USER_MODE_STORAGE_KEY, 'owner');
      setIsLocked(false);
      sessionStorage.setItem(LOCK_STATE_STORAGE_KEY, 'false');
      return true;
    }
    return false;
  };

  const unlockStaff = (enteredPin: string, staffName?: string): boolean => {
    if (enteredPin === staffPin) {
      setUserMode('staff');
      sessionStorage.setItem(USER_MODE_STORAGE_KEY, 'staff');
      if (staffName) {
        setActiveStaffName(staffName);
        sessionStorage.setItem(ACTIVE_STAFF_STORAGE_KEY, staffName);
      }
      setIsLocked(false);
      sessionStorage.setItem(LOCK_STATE_STORAGE_KEY, 'false');
      return true;
    }
    return false;
  };

  const unlock = (enteredPin: string): boolean => {
    if (enteredPin === ownerPin) {
      return unlockOwner(enteredPin);
    }
    if (enteredPin === staffPin) {
      return unlockStaff(enteredPin);
    }
    return false;
  };

  const lock = (targetScreen?: UserAccessMode) => {
    setIsLocked(true);
    sessionStorage.setItem(LOCK_STATE_STORAGE_KEY, 'true');
    if (targetScreen) {
      setTargetLockScreen(targetScreen);
    } else {
      setTargetLockScreen(userMode);
    }
  };

  const updatePin = (currentPin: string, newPin: string): boolean => {
    if (currentPin === ownerPin && newPin.length >= 4) {
      setOwnerPin(newPin);
      localStorage.setItem(OWNER_PIN_STORAGE_KEY, newPin);
      return true;
    }
    return false;
  };

  const updateStaffPin = (newPin: string): boolean => {
    if (newPin.length >= 4) {
      setStaffPin(newPin);
      localStorage.setItem(STAFF_PIN_STORAGE_KEY, newPin);
      return true;
    }
    return false;
  };

  return (
    <SecurityContext.Provider
      value={{
        isLocked,
        userMode,
        activeStaffName,
        targetLockScreen,
        setTargetLockScreen,
        ownerPin,
        staffPin,
        unlockOwner,
        unlockStaff,
        unlock,
        lock,
        updatePin,
        updateStaffPin,
      }}
    >
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
