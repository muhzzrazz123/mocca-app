import React, { useState } from 'react';
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

export const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavItemKey>('dashboard');
  const [isOpenMobileMore, setIsOpenMobileMore] = useState(false);
  const [isOpenSearch, setIsOpenSearch] = useState(false);
  const [isDailyEntryOpen, setIsDailyEntryOpen] = useState(false);

  // Live queries for header and badges
  const pendingRequestsCount = useLiveQuery(
    () => db.customerRequests.where('status').equals('Pending').count(),
    []
  );

  const bills = useLiveQuery(() => db.bills.toArray(), []);
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = (bills || []).filter(
    (b) => b.status === 'Overdue' || (b.dueDate < todayStr && b.status !== 'Paid')
  ).length;

  // Render view based on active tab (Streamlined 5-element core navigation)
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;

      case 'billing':
        return <PosBillingView />;

      case 'daily-profit':
        return <DailyProfitView />;

      case 'accounts':
        return <AccountsView />;

      case 'staff':
        return <StaffManagementView />;

      default:
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#ECEEF2] dark:bg-[#07080A] flex flex-col lg:flex-row text-black dark:text-cream selection:bg-gold selection:text-mocca-950 transition-colors">
      {/* Desktop Luxury Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        alertsCount={overdueCount}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          onOpenMobileMenu={() => setIsOpenMobileMore(true)}
          onOpenSearch={() => setIsOpenSearch(true)}
          onOpenDailyEntry={() => setIsDailyEntryOpen(true)}
          alertsCount={overdueCount}
        />

        {/* View Content with Grey Background */}
        <main className="flex-1 bg-[#ECEEF2] dark:bg-[#07080A] overflow-y-auto transition-colors">
          {renderContent()}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          isOpenMore={isOpenMobileMore}
          setIsOpenMore={setIsOpenMobileMore}
        />

        {/* Global Search Modal */}
        <GlobalSearchModal
          isOpen={isOpenSearch}
          onClose={() => setIsOpenSearch(false)}
          onNavigate={(tab) => setActiveTab(tab)}
        />

        {/* Fast Daily Store Operations Modal */}
        <DailyEntryModal
          isOpen={isDailyEntryOpen}
          onClose={() => setIsDailyEntryOpen(false)}
          onNavigateToPos={() => {
            setIsDailyEntryOpen(false);
            setActiveTab('billing');
          }}
        />
      </div>
    </div>
  );
};

export default MainLayout;
