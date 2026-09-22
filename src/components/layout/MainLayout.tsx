import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Sidebar, type NavItemKey } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { DashboardView } from '../dashboard/DashboardView';
import { PosBillingView } from '../pos/PosBillingView';
import { DailyProfitView } from '../profit/DailyProfitView';
import { AccountsView } from '../accounts/AccountsView';
import { StaffManagementView } from '../staff/StaffManagementView';
import { DailyEntryModal } from '../daily/DailyEntryModal';
import { useSecurity } from '../../context/SecurityContext';

import { BARCODE_SCAN_EVENT } from '../../context/BarcodeContext';

export const MainLayout: React.FC = () => {
  const { userMode } = useSecurity();

  // If in staff mode, start directly on 'billing'
  const [activeTab, setActiveTab] = useState<NavItemKey>(() =>
    userMode === 'staff' ? 'billing' : 'dashboard'
  );
  const [isOpenMobileMore, setIsOpenMobileMore] = useState(false);
  const [isOpenSearch, setIsOpenSearch] = useState(false);
  const [isDailyEntryOpen, setIsDailyEntryOpen] = useState(false);

  // Auto-route to billing when a barcode is scanned anywhere in the app!
  useEffect(() => {
    const handleBarcodeEvent = () => {
      setActiveTab('billing');
    };
    window.addEventListener(BARCODE_SCAN_EVENT, handleBarcodeEvent);
    return () => window.removeEventListener(BARCODE_SCAN_EVENT, handleBarcodeEvent);
  }, []);

  // Guard: if userMode is staff, ensure tab stays locked to billing!
  useEffect(() => {
    if (userMode === 'staff' && activeTab !== 'billing') {
      setActiveTab('billing');
    }
  }, [userMode, activeTab]);

  const handleSelectTab = (tab: NavItemKey) => {
    if (userMode === 'staff') {
      // In staff mode, only billing is allowed
      setActiveTab('billing');
      return;
    }
    setActiveTab(tab);
  };

  // Live queries for header and badges (owner only)
  const bills = useLiveQuery(() => db.bills.toArray(), []);
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount =
    userMode === 'staff'
      ? 0
      : (bills || []).filter(
          (b) => b.status === 'Overdue' || (b.dueDate < todayStr && b.status !== 'Paid')
        ).length;

  // Render view based on active tab
  const renderContent = () => {
    if (userMode === 'staff') {
      // Strictly render POS Billing counter only
      return <PosBillingView />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => handleSelectTab(tab)} />;

      case 'billing':
        return <PosBillingView />;

      case 'daily-profit':
        return <DailyProfitView />;

      case 'accounts':
        return <AccountsView />;

      case 'staff':
        return <StaffManagementView />;

      default:
        return <DashboardView onNavigate={(tab) => handleSelectTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#CCD0CF] dark:bg-[#06141B] flex flex-col lg:flex-row text-[#06141B] dark:text-[#CCD0CF] selection:bg-emerald-500 selection:text-white transition-colors">
      {/* Desktop Luxury Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        alertsCount={overdueCount}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onOpenMobileMenu={() => setIsOpenMobileMore(true)}
          onOpenSearch={() => (userMode !== 'staff' ? setIsOpenSearch(true) : null)}
          onOpenDailyEntry={() => (userMode !== 'staff' ? setIsDailyEntryOpen(true) : null)}
          alertsCount={overdueCount}
        />

        {/* View Content with Exact Palette Background */}
        <main className="flex-1 bg-[#CCD0CF] dark:bg-[#06141B] overflow-y-auto transition-colors">
          {renderContent()}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          isOpenMore={isOpenMobileMore}
          setIsOpenMore={setIsOpenMobileMore}
        />

        {/* Global Search Modal - Owner Only */}
        {userMode !== 'staff' && (
          <GlobalSearchModal
            isOpen={isOpenSearch}
            onClose={() => setIsOpenSearch(false)}
            onNavigate={(tab) => handleSelectTab(tab)}
          />
        )}

        {/* Fast Daily Store Operations Modal - Owner Only */}
        {userMode !== 'staff' && (
          <DailyEntryModal
            isOpen={isDailyEntryOpen}
            onClose={() => setIsDailyEntryOpen(false)}
            onNavigateToPos={() => {
              setIsDailyEntryOpen(false);
              handleSelectTab('billing');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MainLayout;
