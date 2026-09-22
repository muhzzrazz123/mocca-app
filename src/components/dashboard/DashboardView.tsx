import React, { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { usePeriod } from '../../context/PeriodContext';
import { useAuth } from '../../context/AuthContext';
import { KpiCard } from './KpiCard';
import { AlertsSection, type DashboardAlert } from './AlertsSection';
import { MoccaInsights, type InsightItem } from './MoccaInsights';
import { ChartsSection } from './ChartsSection';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import type { NavItemKey } from '../layout/Sidebar';
import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Boxes,
  Clock,
  ArrowUpRight,
  Wallet,
  AlertOctagon,
  Percent,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: NavItemKey) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { startDate, endDate, periodLabel, period } = usePeriod();
  const { canViewFinancials, role } = useAuth();

  // Reactive DB queries
  const sales = useLiveQuery(() => db.sales.toArray(), []);
  const saleItems = useLiveQuery(() => db.saleItems.toArray(), []);
  const expenses = useLiveQuery(() => db.expenses.toArray(), []);
  const bills = useLiveQuery(() => db.bills.toArray(), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  const variants = useLiveQuery(() => db.productVariants.toArray(), []);
  const categories = useLiveQuery(() => db.categories.toArray(), []);
  const attendances = useLiveQuery(() => db.attendance.toArray(), []);
  const customerRequests = useLiveQuery(() => db.customerRequests.toArray(), []);
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []);
  const customers = useLiveQuery(() => db.customers.toArray(), []);

  // Compute all metrics dynamically based on active period
  const metrics = useMemo(() => {
    if (!sales || !expenses || !variants || !products) {
      return null;
    }

    // Filter sales within period
    const periodSales = sales.filter((s) => {
      const saleDate = s.date.split('T')[0];
      return saleDate >= startDate && saleDate <= endDate;
    });

    // Sales metrics
    const totalSales = periodSales.reduce((acc, s) => acc + s.grandTotal, 0);
    const totalBills = periodSales.length;
    const totalCogs = periodSales.reduce((acc, s) => acc + (s.totalCostOfGoods || 0), 0);
    const grossProfit = totalSales - totalCogs;

    // Filter expenses within period
    const periodExpenses = expenses.filter((e) => {
      const expDate = e.date.split('T')[0];
      return expDate >= startDate && expDate <= endDate;
    });
    const totalExpenses = periodExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = grossProfit - totalExpenses;

    // Items sold in period
    const periodSaleIds = new Set(periodSales.map((s) => s.id));
    const periodItems = (saleItems || []).filter(
      (item) => item.saleId && periodSaleIds.has(item.saleId)
    );
    const itemsSoldCount = periodItems.reduce((acc, item) => acc + item.quantity, 0);

    // Current Stock Value (live across all inventory)
    let stockValueCost = 0;
    let stockValueRetail = 0;
    variants.forEach((v) => {
      stockValueCost += (v.currentStock || 0) * (v.purchasePrice || 0);
      stockValueRetail += (v.currentStock || 0) * (v.sellingPrice || 0);
    });

    // Outstanding dues
    const customerCreditDues = (customers || []).reduce((acc, c) => acc + (c.creditBalance || 0), 0);
    const supplierDues = (suppliers || []).reduce((acc, s) => acc + (s.balanceDue || 0), 0);
    const outstandingTotal = customerCreditDues + supplierDues;

    // Payment method breakdown
    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;
    let creditTotal = 0;

    periodSales.forEach((s) => {
      if (s.paymentMethod === 'Cash') cashTotal += s.grandTotal;
      else if (s.paymentMethod === 'UPI') upiTotal += s.grandTotal;
      else if (s.paymentMethod === 'Card') cardTotal += s.grandTotal;
      else if (s.paymentMethod === 'Credit' || s.balanceDue > 0) {
        creditTotal += s.balanceDue;
        cashTotal += s.amountPaid;
      } else {
        upiTotal += s.grandTotal;
      }
    });

    // Top Selling Products
    const productSoldMap = new Map<number, { name: string; category: string; units: number; revenue: number; profit: number }>();
    periodItems.forEach((item) => {
      const existing = productSoldMap.get(item.productId) || {
        name: item.productName,
        category: item.brand,
        units: 0,
        revenue: 0,
        profit: 0,
      };
      existing.units += item.quantity;
      existing.revenue += item.total;
      existing.profit += item.total - item.purchasePrice * item.quantity;
      productSoldMap.set(item.productId, existing);
    });

    const topProducts = Array.from(productSoldMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        category: data.category,
        unitsSold: data.units,
        revenue: data.revenue,
        grossProfit: data.profit,
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold);

    // Sales by Category
    const categoryMap = new Map<string, { amount: number; units: number }>();
    (categories || []).forEach((c) => categoryMap.set(c.name, { amount: 0, units: 0 }));

    periodItems.forEach((item) => {
      // Find product to determine category
      const prod = products.find((p) => p.id === item.productId);
      const catName = prod?.categoryName || 'Other';
      const existing = categoryMap.get(catName) || { amount: 0, units: 0 };
      existing.amount += item.total;
      existing.units += item.quantity;
      categoryMap.set(catName, existing);
    });

    const categoryData = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        units: data.units,
      }))
      .filter((c) => c.amount > 0 || period === 'Today');

    // Trend Data: Group by Date in range
    const trendMap = new Map<string, { sales: number; profit: number }>();
    periodSales.forEach((s) => {
      const dateKey = s.date.split('T')[0];
      const existing = trendMap.get(dateKey) || { sales: 0, profit: 0 };
      existing.sales += s.grandTotal;
      existing.profit += s.grossProfit || 0;
      trendMap.set(dateKey, existing);
    });

    // Sort trend dates
    const trendData = Array.from(trendMap.entries())
      .sort(([d1], [d2]) => d1.localeCompare(d2))
      .map(([date, data]) => ({
        date: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(
          new Date(date)
        ),
        sales: data.sales,
        profit: data.profit,
      }));

    // If trend has 0 or 1 item, add today's placeholder
    if (trendData.length === 0) {
      trendData.push({
        date: 'Today',
        sales: totalSales,
        profit: grossProfit,
      });
    }

    return {
      totalSales,
      totalBills,
      itemsSoldCount,
      grossProfit,
      netProfit,
      stockValueCost,
      stockValueRetail,
      totalExpenses,
      outstandingTotal,
      cashTotal,
      upiTotal,
      cardTotal,
      creditTotal,
      topProducts,
      categoryData,
      trendData,
    };
  }, [
    sales,
    saleItems,
    expenses,
    variants,
    products,
    categories,
    suppliers,
    customers,
    startDate,
    endDate,
    period,
  ]);

  // Generate Dynamic Alerts
  const alerts: DashboardAlert[] = useMemo(() => {
    if (!variants || !products || !bills || !attendances) return [];

    const list: DashboardAlert[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Out of stock products
    const outOfStockVariants = variants.filter((v) => v.currentStock <= 0);
    if (outOfStockVariants.length > 0) {
      list.push({
        id: 'out-of-stock',
        type: 'danger',
        category: 'STOCK',
        title: `${outOfStockVariants.length} Variant(s) Out of Stock`,
        description: `Items like ${outOfStockVariants[0].sku} have hit 0 stock. Restock needed immediately.`,
        actionTab: 'daily-profit',
        actionLabel: 'View Inventory',
      });
    }

    // 2. Low stock products
    const lowStockVariants = variants.filter(
      (v) => v.currentStock > 0 && v.currentStock <= v.minStockLevel
    );
    if (lowStockVariants.length > 0) {
      list.push({
        id: 'low-stock',
        type: 'warning',
        category: 'STOCK',
        title: `${lowStockVariants.length} Products Low in Stock`,
        description: `Size ${lowStockVariants[0].size} (${lowStockVariants[0].color}) has only ${lowStockVariants[0].currentStock} left.`,
        actionTab: 'daily-profit',
        actionLabel: 'Restock',
      });
    }

    // 3. Overdue & Due Today Bills
    const overdueBills = bills.filter(
      (b) => b.status === 'Overdue' || (b.dueDate < todayStr && b.status !== 'Paid')
    );
    if (overdueBills.length > 0) {
      list.push({
        id: 'overdue-bills',
        type: 'danger',
        category: 'BILL',
        title: `${overdueBills.length} Bill(s) Overdue`,
        description: `${overdueBills[0].title} (₹${formatNumber(overdueBills[0].amount)}) requires urgent payment.`,
        actionTab: 'accounts',
        actionLabel: 'Pay Bills',
      });
    }

    // 4. Rent & Upcoming Bills (within 3 days)
    const upcomingRent = bills.find(
      (b) =>
        (b.category === 'Shop Rent' || b.category === 'Room Rent') &&
        b.status !== 'Paid' &&
        b.dueDate >= todayStr
    );
    if (upcomingRent) {
      list.push({
        id: 'rent-due',
        type: 'warning',
        category: 'BILL',
        title: `${upcomingRent.title} Due Soon`,
        description: `Due on ${upcomingRent.dueDate} (₹${formatNumber(upcomingRent.amount)}).`,
        actionTab: 'accounts',
        actionLabel: 'View Rent',
      });
    }

    // 5. Staff Absent Today
    const todayAbsents = attendances.filter(
      (a) => a.date === todayStr && (a.status === 'Absent' || a.status === 'Leave')
    );
    if (todayAbsents.length > 0) {
      list.push({
        id: 'staff-absent',
        type: 'info',
        category: 'STAFF',
        title: `${todayAbsents.length} Staff Absent / On Leave Today`,
        description: `${todayAbsents.map((s) => s.staffName).join(', ')} recorded absent today.`,
        actionTab: 'staff',
        actionLabel: 'Attendance',
      });
    }

    return list;
  }, [variants, products, bills, attendances]);

  // Generate Dynamic MOCCA Insights from Real Data
  const insights: InsightItem[] = useMemo(() => {
    if (!metrics || !variants || !customerRequests) return [];

    const items: InsightItem[] = [];

    // 1. Best Selling Insight
    if (metrics.topProducts.length > 0) {
      const top = metrics.topProducts[0];
      items.push({
        id: 'top-seller',
        type: 'bestseller',
        title: 'Top Seller Momentum',
        text: `${top.name} generated the highest demand with ${top.unitsSold} units sold (${formatCurrency(
          top.revenue
        )}).`,
        metric: `${top.unitsSold} units`,
      });
    }

    // 2. High Margin Category
    if (metrics.categoryData.length > 0) {
      const sortedByRev = [...metrics.categoryData].sort((a, b) => b.amount - a.amount);
      if (sortedByRev[0].amount > 0) {
        items.push({
          id: 'top-cat',
          type: 'profit',
          title: 'Leading Apparel Line',
          text: `${sortedByRev[0].category} is your highest revenue driver in ${periodLabel}, contributing ${formatCurrency(
            sortedByRev[0].amount
          )}.`,
          metric: formatCurrency(sortedByRev[0].amount),
        });
      }
    }

    // 3. Customer Requests Insight
    if (customerRequests.length > 0) {
      const pendingReqs = customerRequests.filter((r) => r.status === 'Pending');
      if (pendingReqs.length > 0) {
        items.push({
          id: 'cust-demand',
          type: 'request',
          title: 'High Customer Demand',
          text: `"${pendingReqs[0].requestedProduct} (${pendingReqs[0].size})" is frequently requested by customers. Consider stocking soon.`,
          metric: `${pendingReqs.length} Requests`,
        });
      }
    }

    // 4. Low Stock Size Pattern
    const lowSizes = variants.filter((v) => v.currentStock <= v.minStockLevel);
    if (lowSizes.length > 0) {
      const sizeCounts: Record<string, number> = {};
      lowSizes.forEach((v) => {
        sizeCounts[v.size] = (sizeCounts[v.size] || 0) + 1;
      });
      const mostCommonLowSize = Object.entries(sizeCounts).sort((a, b) => b[1] - a[1])[0];
      if (mostCommonLowSize) {
        items.push({
          id: 'size-low',
          type: 'stock',
          title: 'Size Inventory Alert',
          text: `Size ${mostCommonLowSize[0]} is running low across ${mostCommonLowSize[1]} clothing variant(s).`,
          metric: `Size ${mostCommonLowSize[0]}`,
        });
      }
    }

    // 5. Gross Margin Health
    if (metrics.totalSales > 0 && canViewFinancials) {
      const marginPercent = ((metrics.grossProfit / metrics.totalSales) * 100).toFixed(1);
      items.push({
        id: 'margin-health',
        type: 'profit',
        title: 'Gross Margin Performance',
        text: `Your shop is operating at a healthy ${marginPercent}% gross margin based on actual wholesale cost of goods.`,
        metric: `${marginPercent}% Margin`,
      });
    }

    return items;
  }, [metrics, variants, customerRequests, periodLabel, canViewFinancials]);

  if (!metrics) {
    return (
      <div className="p-8 text-center text-mocca-400">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p>Loading real-time retail telemetry...</p>
      </div>
    );
  }

  // Payment method chart data
  const paymentChartData = [
    { name: 'UPI', value: metrics.upiTotal, color: '#D4AF37' },
    { name: 'Cash', value: metrics.cashTotal, color: '#34D399' },
    { name: 'Card', value: metrics.cardTotal, color: '#60A5FA' },
    { name: 'Credit', value: metrics.creditTotal, color: '#F87171' },
  ].filter((p) => p.value > 0);

  // Fallback if no payments yet
  if (paymentChartData.length === 0) {
    paymentChartData.push({ name: 'UPI', value: 1, color: '#D4AF37' });
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-24 lg:pb-12">
      {/* Period Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0E1015] p-4 lg:p-5 rounded-2xl border border-gray-300 dark:border-[#1E222D] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-black">
            <ShoppingBag size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-black dark:text-cream font-serif">
              Performance Snapshot: {periodLabel}
            </h2>
            <p className="text-xs text-gray-700 dark:text-mocca-400 font-medium">
              Showing consolidated live store transactions from {startDate} to {endDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          {canViewFinancials && (
            <button
              onClick={() => onNavigate('daily-profit')}
              className="px-3.5 py-1.5 rounded-xl bg-gold/20 hover:bg-gold/30 text-black dark:text-gold border border-gold/50 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <TrendingUp size={14} /> View Profit & Sales
            </button>
          )}
          <span className="text-gray-700 dark:text-mocca-400 hidden sm:inline font-medium">Total Catalog Stock:</span>
          <span className="font-black text-black dark:text-cream bg-gray-100 dark:bg-mocca-850 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-mocca-700">
            {variants?.reduce((acc, v) => acc + (v.currentStock || 0), 0) || 0} Pieces
          </span>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <KpiCard
          title={`${period} Sales`}
          value={formatCurrency(metrics.totalSales)}
          subtitle={`${metrics.totalBills} Bills generated`}
          icon={IndianRupee}
          highlight={true}
          badgeText="Active"
          badgeType="gold"
        />

        {/* Items Sold */}
        <KpiCard
          title="Items Sold"
          value={`${formatNumber(metrics.itemsSoldCount)} Pcs`}
          subtitle={`Avg. ${metrics.totalBills > 0 ? (metrics.itemsSoldCount / metrics.totalBills).toFixed(1) : 0} items/bill`}
          icon={ShoppingBag}
          badgeText="Volume"
          badgeType="positive"
        />

        {/* Gross Profit (Cashier protected) */}
        {canViewFinancials ? (
          <KpiCard
            title="Gross Profit"
            value={formatCurrency(metrics.grossProfit)}
            subtitle="Sales minus Cost of Goods"
            icon={TrendingUp}
            badgeText={
              metrics.totalSales > 0
                ? `${((metrics.grossProfit / metrics.totalSales) * 100).toFixed(0)}% Margin`
                : '0%'
            }
            badgeType="positive"
          />
        ) : (
          <KpiCard
            title="Completed Bills"
            value={`${metrics.totalBills} Invoices`}
            subtitle="Registered today"
            icon={Receipt}
            badgeText="POS"
            badgeType="neutral"
          />
        )}

        {/* Net Profit (Cashier protected) */}
        {canViewFinancials ? (
          <KpiCard
            title="Net Profit"
            value={formatCurrency(metrics.netProfit)}
            subtitle={`After ${formatCurrency(metrics.totalExpenses)} expenses`}
            icon={ArrowUpRight}
            badgeText={metrics.netProfit >= 0 ? 'Profitable' : 'Deficit'}
            badgeType={metrics.netProfit >= 0 ? 'positive' : 'negative'}
          />
        ) : (
          <KpiCard
            title="Average Bill Value"
            value={formatCurrency(
              metrics.totalBills > 0 ? metrics.totalSales / metrics.totalBills : 0
            )}
            subtitle="Per customer transaction"
            icon={IndianRupee}
            badgeText="Avg"
            badgeType="gold"
          />
        )}
      </div>

      {/* Secondary Financial & Operational Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Stock Value */}
        <KpiCard
          title="Current Stock Value"
          value={formatCurrency(metrics.stockValueCost)}
          subtitle={`Retail Value: ${formatCurrency(metrics.stockValueRetail)}`}
          icon={Boxes}
          extraInfo="At Purchase Cost"
        />

        {/* Operating Expenses */}
        {canViewFinancials ? (
          <KpiCard
            title={`${period} Expenses`}
            value={formatCurrency(metrics.totalExpenses)}
            subtitle="Rent, Power, Tea & Packaging"
            icon={Wallet}
            badgeText="Operating"
            badgeType="neutral"
          />
        ) : (
          <KpiCard
            title="Customer Dues"
            value={formatCurrency(metrics.creditTotal)}
            subtitle="Credit sales pending"
            icon={Clock}
            badgeType="negative"
          />
        )}

        {/* Outstanding Dues */}
        <KpiCard
          title="Outstanding Balances"
          value={formatCurrency(metrics.outstandingTotal)}
          subtitle="Customer credit + Supplier dues"
          icon={Clock}
          badgeText={metrics.outstandingTotal > 0 ? 'Pending' : 'Settled'}
          badgeType={metrics.outstandingTotal > 0 ? 'negative' : 'positive'}
        />

        {/* Top Payment Channel */}
        <KpiCard
          title="Top Payment Mode"
          value={formatCurrency(Math.max(metrics.upiTotal, metrics.cashTotal, metrics.cardTotal))}
          subtitle={
            metrics.upiTotal >= metrics.cashTotal ? 'UPI (Digital)' : 'Cash Counter'
          }
          icon={Wallet}
          badgeText="Leading"
          badgeType="gold"
        />
      </div>

      {/* Live System Alerts */}
      <AlertsSection alerts={alerts} onNavigate={onNavigate} />

      {/* Dynamic MOCCA Insights Engine */}
      <MoccaInsights insights={insights} />

      {/* Visual Analytics Charts */}
      <ChartsSection
        trendData={metrics.trendData}
        categoryData={metrics.categoryData}
        paymentData={paymentChartData}
        topProducts={metrics.topProducts}
        canViewProfit={canViewFinancials}
      />
    </div>
  );
};
