import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Sidebar, type NavItemKey } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { DashboardView } from '../dashboard/DashboardView';
import { StaffManagementView } from '../staff/StaffManagementView';
import { ProfitTableView } from '../finance/ProfitTableView';
import { PhaseModulePlaceholder } from '../common/PhaseModulePlaceholder';
import {
  ReceiptText,
  Shirt,
  Boxes,
  ShoppingBag,
  Truck,
  Users,
  MessageSquarePlus,
  UserCheck,
  Landmark,
  CalendarClock,
  BarChart3,
  Lightbulb,
  Settings,
} from 'lucide-react';

export const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavItemKey>('dashboard');
  const [isOpenMobileMore, setIsOpenMobileMore] = useState(false);
  const [isOpenSearch, setIsOpenSearch] = useState(false);

  // Live queries for header and sidebar badges
  const pendingRequestsCount = useLiveQuery(
    () => db.customerRequests.where('status').equals('Pending').count(),
    []
  );

  const bills = useLiveQuery(() => db.bills.toArray(), []);
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = (bills || []).filter(
    (b) => b.status === 'Overdue' || (b.dueDate < todayStr && b.status !== 'Paid')
  ).length;

  // Render view based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;

      case 'pos':
        return (
          <PhaseModulePlaceholder
            tabKey="pos"
            title="Retail POS Billing & Invoicing"
            description="High-speed retail counter billing with barcode scanning, size/color variant matrix, multi-payment options (Cash, UPI, Card, Split), printable 80mm thermal receipts, A4 tax invoices, and instant cascading inventory/revenue updates."
            icon={ReceiptText}
            phaseNumber={3}
            features={[
              'Fast Barcode scanner & keyboard shortcuts (F2, F8)',
              'Multi-variant clothing picker (Size & Color matrix)',
              'Auto stock decrement & gross profit calculation',
              '80mm Thermal Receipt & A4 Modern Invoice printing',
              'Full & Partial Returns / Exchanges handling',
            ]}
            dbEntities={['sales', 'saleItems', 'salePayments', 'returns', 'returnItems']}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        );

      case 'products':
        return (
          <PhaseModulePlaceholder
            tabKey="products"
            title="Product Catalog & Variant Matrix"
            description="Complete clothing apparel management supporting multi-variant matrix (Sizes S to XXL / 28 to 38, multiple colors), independent SKUs, barcodes, cost and selling prices, supplier links, and category organization."
            icon={Shirt}
            phaseNumber={2}
            features={[
              'Apparel size & color variant matrix table',
              'Independent SKU & barcode per variant',
              'Category & Brand management',
              'Purchase price vs Selling price margin tracking',
              'Minimum stock reorder alerts',
            ]}
            dbEntities={['products', 'productVariants', 'categories', 'brands']}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        );

      case 'inventory':
        return (
          <PhaseModulePlaceholder
            tabKey="inventory"
            title="Inventory & Stock Control"
            description="Real-time stock monitoring, stock adjustments (Add, Remove, Damage, Lost, Return), inventory valuation at cost vs retail, slow movers detection, and automated movement audit logs."
            icon={Boxes}
            phaseNumber={2}
            features={[
              'Live stock levels with low/out-of-stock badges',
              'Stock adjustment forms with reason tagging',
              'Inventory movement ledger tracking every unit',
              'Stock valuation at cost price vs retail price',
              'Protection against negative stock selling',
            ]}
            dbEntities={['inventoryMovements', 'productVariants']}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        );

      case 'purchases':
        return (
          <PhaseModulePlaceholder
            tabKey="purchases"
            title="Purchase Orders & Supplier Invoices"
            description="Record incoming clothing stock from suppliers with automatic inventory increments, supplier credit tracking, and COGS recalculations."
            icon={ShoppingBag}
            phaseNumber={4}
            features={[
              'Supplier purchase invoice creation',
              'Batch variant stock intake',
              'Payment status tracking (Paid, Partial, Credit)',
              'Automatic COGS update for accurate profit calculation',
            ]}
            dbEntities={['purchases', 'purchaseItems', 'suppliers']}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        );

      case 'suppliers':
        return (
          <PhaseModulePlaceholder
            tabKey="suppliers"
            title="Supplier Directory & Ledger"
            description="Manage clothing manufacturers, mills, and garment suppliers with phone numbers, addresses, contact persons, and running credit ledgers."
            icon={Truck}
            phaseNumber={4}
            features={[
              'Supplier profiles & contact details',
              'Purchase history per supplier',
              'Outstanding dues & payment logging',
            ]}
            dbEntities={['suppliers', 'purchases']}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        );

      case 'customers':
        return (
          <PhaseModulePlaceholder
            tabKey="customers"
            title="Customer Relationship Management (CRM)"
            description="Customer profiles, purchase histories, lifetime spending, average bill values, and store credit balance ledgers."
            icon={Users}
            phaseNumber={5}
            features={[
              'Customer phone directory & lookup',
              'Complete invoice purchase history',
              'Store credit dues & payment tracking',
              'Top customer loyalty rankings',
            ]}
            dbEntities={['customers', 'sales']}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        );

      case 'customer-requests':
        return (
          <PhaseModulePlaceholder
            tabKey="customer-requests"
            title="Customer Requests ('Wanted Items')"
            description="Record clothing items requested by customers that may be out-of-stock or not yet in catalog (product name, size, color, customer phone) to steer purchasing."
            icon={MessageSquarePlus}
            phaseNumber={5}
            features={[
              'Quick request logger during sales floor conversations',
              'Most requested items & sizes intelligence ranking',
              'Status tracking (Pending, Procured, Not Available)',
            ]}
            dbEntities={['customerRequests']}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        );

      case 'staff':
        return <StaffManagementView />;

      case 'finance':
        return <ProfitTableView />;

      case 'bills':
        return (
          <PhaseModulePlaceholder
            tabKey="bills"
            title="Bills & Recurring Rent Tracking"
            description="Track shop rent, room rent, electricity, internet, and supplier payments with due dates, overdue alert badges, and payment logging."
            icon={CalendarClock}
            phaseNumber={7}
            features={[
              'Categorized bills (Shop Rent, Room Rent, TNEB, Internet)',
              'Status tracking: Upcoming, Due Today, Overdue, Paid',
              'Auto alerts integration with Dashboard banner',
            ]}
            dbEntities={['bills', 'expenses']}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        );

      case 'reports':
        return (
          <PhaseModulePlaceholder
            tabKey="reports"
            title="Reports & Analytics Export"
            description="Dedicated reports for Sales, Purchases, Profit & Loss, Expenses, Inventory valuation, Staff attendance, and Customer ledgers with date filters and CSV export."
            icon={BarChart3}
            phaseNumber={8}
            features={[
              'Sales & Invoices Report with itemized breakdown',
              'Profit & Loss statement by date range',
              'Inventory valuation report (cost vs selling)',
              '1-click CSV export for accounting & Excel',
            ]}
            dbEntities={['sales', 'purchases', 'expenses', 'inventoryMovements']}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        );

      case 'insights':
        return (
          <PhaseModulePlaceholder
            tabKey="insights"
            title="MOCCA Business Insights Engine"
            description="Deep automated analytics analyzing best sellers, slow movers, dead stock (>30 days no sale), low stock sizes, high-margin categories, and customer demand trends."
            icon={Lightbulb}
            phaseNumber={8}
            features={[
              'Best sellers vs Slow movers telemetry',
              'Dead stock detection (>30 days zero sales)',
              'Most requested clothing items vs current inventory',
              'Weekly & monthly revenue trend forecasts',
            ]}
            dbEntities={['sales', 'productVariants', 'customerRequests']}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        );

      case 'settings':
        return (
          <PhaseModulePlaceholder
            tabKey="settings"
            title="Store Information & System Settings"
            description="Configure store address, phone, GST number, tax toggles, currency symbol (₹), receipt footers, user roles, database backup export/restore, and reset demo data."
            icon={Settings}
            phaseNumber={9}
            features={[
              'Store name, logo, address, and GST settings',
              'Tax rate & invoice custom footer message',
              '1-click JSON database backup & restore',
              'Reset demo data option for development',
            ]}
            dbEntities={['settings', 'users', 'auditLogs']}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        );

      default:
        return <DashboardView onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-mocca-950 flex flex-col lg:flex-row text-cream selection:bg-gold selection:text-mocca-950">
      {/* Desktop Luxury Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        pendingRequestsCount={pendingRequestsCount}
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
          alertsCount={overdueCount}
        />

        {/* View Content */}
        <main className="flex-1 bg-mocca-950 overflow-y-auto">{renderContent()}</main>

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
      </div>
    </div>
  );
};
