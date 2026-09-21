import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { db } from '../db/db';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  switchRole: (role: UserRole) => Promise<void>;
  canViewFinancials: boolean;
  canManageStaff: boolean;
  canManagePurchases: boolean;
  canEditSettings: boolean;
  canPerformReturns: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 1,
    username: 'admin',
    name: 'Mashboob (Store Owner)',
    role: 'ADMIN',
    pin: '1234',
    createdAt: new Date().toISOString(),
  });

  useEffect(() => {
    // Load admin user from DB if available
    db.users.where('role').equals('ADMIN').first().then((user) => {
      if (user) {
        if (user.name !== 'Mashboob (Store Owner)') {
          user.name = 'Mashboob (Store Owner)';
          db.users.update(user.id!, { name: 'Mashboob (Store Owner)' });
        }
        setCurrentUser(user);
      }
    });
  }, []);

  const switchRole = async (newRole: UserRole) => {
    const user = await db.users.where('role').equals(newRole).first();
    if (user) {
      if (newRole === 'ADMIN' && user.name !== 'Mashboob (Store Owner)') {
        user.name = 'Mashboob (Store Owner)';
        db.users.update(user.id!, { name: 'Mashboob (Store Owner)' });
      }
      setCurrentUser(user);
    } else {
      // Fallback virtual user for role
      setCurrentUser({
        username: newRole.toLowerCase(),
        name:
          newRole === 'ADMIN'
            ? 'Mashboob (Store Owner)'
            : newRole === 'MANAGER'
            ? 'Vignesh R (Store Manager)'
            : 'Karthik S (POS Cashier)',
        role: newRole,
        pin: '0000',
        createdAt: new Date().toISOString(),
      });
    }
  };

  const role = currentUser?.role || 'ADMIN';

  // Strict role permissions
  // Cashier must NOT see: Profit, Salary, Expenses, Financial reports, Supplier balances
  const canViewFinancials = role === 'ADMIN';
  const canManageStaff = role === 'ADMIN' || role === 'MANAGER';
  const canManagePurchases = role === 'ADMIN' || role === 'MANAGER';
  const canEditSettings = role === 'ADMIN';
  const canPerformReturns = role === 'ADMIN' || role === 'MANAGER' || role === 'CASHIER';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        switchRole,
        canViewFinancials,
        canManageStaff,
        canManagePurchases,
        canEditSettings,
        canPerformReturns,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
