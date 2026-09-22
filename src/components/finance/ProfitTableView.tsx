import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useAuth } from '../../context/AuthContext';
import { usePeriod } from '../../context/PeriodContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import type { Sale, SaleItem, Expense, PaymentMethod } from '../../types';
import {
  TrendingUp,
  DollarSign,
  Download,
  Trash2,
  Search,
  ArrowUpDown,
  FileSpreadsheet,
  AlertCircle,
  Percent,
  Boxes,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles,
  Receipt,
  Wallet,
} from 'lucide-react';

export const ProfitTableView: React.FC = () => {
  const { currentUser, role } = useAuth();
  const { period, setPeriod, startDate, endDate, periodLabel } = usePeriod();

  // Active View Tab
  const [profitTab, setProfitTab] = useState<'invoices' | 'products' | 'expenses'>('invoices');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [minMarginFilter, setMinMarginFilter] = useState<number>(0);

  // Deletion Modal State
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [deleteSaleReason, setDeleteSaleReason] = useState('Customer cancellation');

  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Live Database Subscriptions
  const sales = useLiveQuery(() => db.sales.toArray(), []) || [];
  const saleItems = useLiveQuery(() => db.saleItems.toArray(), []) || [];
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) || [];
  const products = useLiveQuery(() => db.products.toArray(), []) || [];

  // Filtered Sales within Period
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const sDate = s.date.split('T')[0];
      const inDateRange = sDate >= startDate && sDate <= endDate;
      if (!inDateRange) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.invoiceNo.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        (s.customerPhone && s.customerPhone.includes(q))
      );
    });
  }, [sales, startDate, endDate, searchQuery]);

  // Overall Financial Aggregates
  const totals = useMemo(() => {
    let totalRevenue = 0;
    let totalCogs = 0;
    let totalGrossProfit = 0;

    filteredSales.forEach((s) => {
      totalRevenue += s.grandTotal;
      totalCogs += s.totalCostOfGoods || 0;
      totalGrossProfit += s.grossProfit || 0;
    });

    // Expenses in period
    const periodExpenses = expenses.filter((e) => {
      const eDate = e.date.split('T')[0];
      return eDate >= startDate && eDate <= endDate;
    });
    const totalExpenseAmount = periodExpenses.reduce((acc, e) => acc + e.amount, 0);
    const totalNetProfit = totalGrossProfit - totalExpenseAmount;
    const overallMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCogs,
      totalGrossProfit,
      totalExpenseAmount,
      totalNetProfit,
      overallMargin,
    };
  }, [filteredSales, expenses, startDate, endDate]);

  // Product-wise Profit Aggregation
  const productProfitData = useMemo(() => {
    const saleIdSet = new Set(filteredSales.map((s) => s.id));
    const relevantItems = saleItems.filter((item) => item.saleId && saleIdSet.has(item.saleId));

    const map = new Map<
      number,
      {
        name: string;
        brand: string;
        units: number;
        cost: number;
        revenue: number;
        profit: number;
      }
    >();

    relevantItems.forEach((item) => {
      const existing = map.get(item.productId) || {
        name: item.productName,
        brand: item.brand,
        units: 0,
        cost: 0,
        revenue: 0,
        profit: 0,
      };

      const itemCost = item.purchasePrice * item.quantity;
      const itemRev = item.total;
      const itemProfit = itemRev - itemCost;

      existing.units += item.quantity;
      existing.cost += itemCost;
      existing.revenue += itemRev;
      existing.profit += itemProfit;
      map.set(item.productId, existing);
    });

    return Array.from(map.entries())
      .map(([id, d]) => {
        const marginPct = d.revenue > 0 ? (d.profit / d.revenue) * 100 : 0;
        return {
          productId: id,
          name: d.name,
          brand: d.brand,
          unitsSold: d.units,
          totalCost: d.cost,
          totalRevenue: d.revenue,
          grossProfit: d.profit,
          marginPct,
        };
      })
      .sort((a, b) => b.grossProfit - a.grossProfit);
  }, [filteredSales, saleItems]);

  // Handlers for Deletion
  const handleConfirmDeleteSale = async () => {
    if (!deletingSale?.id) return;
    await db.voidSaleTransaction(
      deletingSale.id,
      deleteSaleReason,
      currentUser?.name || 'Store Owner'
    );
    setDeletingSale(null);
    setDeleteSaleReason('Customer cancellation');
  };

  const handleConfirmDeleteExpense = async () => {
    if (!deletingExpense?.id) return;
    await db.deleteExpenseTransaction(deletingExpense.id, currentUser?.name || 'Store Owner');
    setDeletingExpense(null);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (profitTab === 'invoices') {
      const headers = ['Invoice No,Date,Customer,Payment Method,Revenue (INR),Cost COGS (INR),Gross Profit (INR),Margin %'];
      const rows = filteredSales.map((s) => {
        const margin = s.grandTotal > 0 ? ((s.grossProfit / s.grandTotal) * 100).toFixed(1) : '0';
        return `"${s.invoiceNo}","${s.date}","${s.customerName}","${s.paymentMethod}",${s.grandTotal},${s.totalCostOfGoods},${s.grossProfit},"${margin}%"`;
      });
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `MOCCA_Invoice_Profit_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Product,Brand,Units Sold,Wholesale Cost (INR),Revenue (INR),Gross Profit (INR),Margin %'];
      const rows = productProfitData.map((p) => {
        return `"${p.name}","${p.brand}",${p.unitsSold},${p.totalCost},${p.totalRevenue},${p.grossProfit},"${p.marginPct.toFixed(1)}%"`;
      });
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `MOCCA_Product_Profit_${startDate}_to_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-24 text-[#06141B] dark:text-[#CCD0CF]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#11212D] p-5 rounded-2xl border border-gray-300 dark:border-[#253745] shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#06141B] dark:text-[#CCD0CF] font-serif">
                Itemized Profit & Loss Ledger
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40">
                Formula: Profit = Revenue - COGS
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-[#9BA8AB]">
              Live profit margins computed from real wholesale purchase prices ({periodLabel})
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#182B3A] hover:bg-gray-200 dark:hover:bg-[#253745] text-[#06141B] dark:text-[#CCD0CF] text-xs font-semibold border border-gray-300 dark:border-[#253745] flex items-center gap-2 transition-colors"
          >
            <Download size={14} className="text-emerald-500" /> Export to CSV
          </button>
        </div>
      </div>

      {/* KPI Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-[#11212D] p-4 rounded-xl border border-gray-300 dark:border-[#253745] space-y-1 shadow-sm">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-[#9BA8AB] uppercase tracking-wider">
            Total Revenue
          </span>
          <p className="text-2xl font-bold text-[#06141B] dark:text-[#CCD0CF]">{formatCurrency(totals.totalRevenue)}</p>
          <span className="text-[10px] text-gray-500 dark:text-[#9BA8AB]">{filteredSales.length} Invoices</span>
        </div>

        <div className="bg-white dark:bg-[#11212D] p-4 rounded-xl border border-gray-300 dark:border-[#253745] space-y-1 shadow-sm">
          <span className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider">
            Cost of Goods (COGS)
          </span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-300">{formatCurrency(totals.totalCogs)}</p>
          <span className="text-[10px] text-gray-500 dark:text-[#9BA8AB]">Wholesale cost of sold items</span>
        </div>

        <div className="bg-white dark:bg-[#11212D] p-4 rounded-xl border border-emerald-500/40 space-y-1 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Gross Profit
          </span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totals.totalGrossProfit)}</p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {totals.overallMargin.toFixed(1)}% Gross Margin
          </span>
        </div>

        <div className="bg-white dark:bg-[#11212D] p-4 rounded-xl border border-gray-300 dark:border-[#253745] space-y-1 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Operating Expenses
          </span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-300">
            {formatCurrency(totals.totalExpenseAmount)}
          </p>
          <span className="text-[10px] text-gray-500 dark:text-[#9BA8AB]">Rent, Power, Salaries</span>
        </div>

        <div className="bg-white dark:bg-[#11212D] p-4 rounded-xl border border-gray-300 dark:border-[#253745] space-y-1 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Net Store Profit
          </span>
          <p
            className={`text-2xl font-bold ${
              totals.totalNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(totals.totalNetProfit)}
          </p>
          <span className="text-[10px] text-gray-500 dark:text-[#9BA8AB]">Gross Profit − Operating Expenses</span>
        </div>
      </div>

      {/* Tabs Switcher & Search Bar */}
      <div className="bg-white dark:bg-[#11212D] p-3.5 rounded-2xl border border-gray-300 dark:border-[#253745] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#06141B] p-1 rounded-xl border border-gray-200 dark:border-[#253745] text-xs">
          <button
            onClick={() => setProfitTab('invoices')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              profitTab === 'invoices'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-md'
                : 'text-gray-600 dark:text-[#9BA8AB] hover:text-[#06141B] dark:hover:text-[#CCD0CF] hover:bg-gray-200 dark:hover:bg-[#182B3A]'
            }`}
          >
            <Receipt size={14} />
            <span>Invoice-by-Invoice Profit ({filteredSales.length})</span>
          </button>

          <button
            onClick={() => setProfitTab('products')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              profitTab === 'products'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-md'
                : 'text-gray-600 dark:text-[#9BA8AB] hover:text-[#06141B] dark:hover:text-[#CCD0CF] hover:bg-gray-200 dark:hover:bg-[#182B3A]'
            }`}
          >
            <Boxes size={14} />
            <span>Product Profitability ({productProfitData.length})</span>
          </button>

          <button
            onClick={() => setProfitTab('expenses')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              profitTab === 'expenses'
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-md'
                : 'text-gray-600 dark:text-[#9BA8AB] hover:text-[#06141B] dark:hover:text-[#CCD0CF] hover:bg-gray-200 dark:hover:bg-[#182B3A]'
            }`}
          >
            <Wallet size={14} />
            <span>Operating Expenses ({expenses.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#182B3A] px-3 py-1.5 rounded-xl border border-gray-300 dark:border-[#253745] text-xs">
          <Search size={14} className="text-emerald-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter invoice #, customer name..."
            className="bg-transparent text-gray-900 dark:text-[#CCD0CF] placeholder:text-gray-400 dark:placeholder:text-[#9BA8AB] outline-none text-xs w-48"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INVOICE-BY-INVOICE PROFIT TABLE WITH DELETE / VOID BILL            */}
      {/* ========================================================================= */}
      {profitTab === 'invoices' && (
        <div className="bg-white dark:bg-[#11212D] rounded-2xl border border-gray-300 dark:border-[#253745] overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#182B3A] border-b border-gray-200 dark:border-[#253745] text-gray-500 dark:text-[#9BA8AB]">
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Date & Time</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Invoice #</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Customer</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Mode</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right">
                    Gross Revenue (₹)
                  </th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right text-rose-500 dark:text-rose-400">
                    Cost / COGS (₹)
                  </th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right text-emerald-600 dark:text-emerald-400">
                    Gross Profit (₹)
                  </th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right text-emerald-600 dark:text-emerald-400">
                    Margin %
                  </th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-center">
                    Action (Delete)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#253745]">
                {filteredSales.map((sale) => {
                  const marginPct =
                    sale.grandTotal > 0 ? (sale.grossProfit / sale.grandTotal) * 100 : 0;

                  return (
                    <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-[#182B3A]/50 transition-colors group">
                      <td className="py-3.5 px-4 font-medium text-gray-500 dark:text-[#9BA8AB] whitespace-nowrap">
                        {formatDateTime(sale.createdAt || sale.date)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        #{sale.invoiceNo}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#06141B] dark:text-[#CCD0CF]">{sale.customerName}</p>
                        {sale.customerPhone && (
                          <p className="text-[10px] text-gray-500 dark:text-[#9BA8AB]">{sale.customerPhone}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#182B3A] text-[#06141B] dark:text-[#CCD0CF] border border-gray-200 dark:border-[#253745]">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#06141B] dark:text-[#CCD0CF]">
                        {formatCurrency(sale.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(sale.totalCostOfGoods)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(sale.grossProfit)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {marginPct.toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setDeletingSale(sale)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-400 border border-rose-500/30 transition-colors"
                          title="Void / Delete Bill (Restores Stock)"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-500 dark:text-[#9BA8AB] text-xs">
                      No invoices found for the selected period "{periodLabel}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PRODUCT-WISE PROFITABILITY TABLE                                   */}
      {/* ========================================================================= */}
      {profitTab === 'products' && (
        <div className="bg-white dark:bg-[#11212D] rounded-2xl border border-gray-300 dark:border-[#253745] overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#182B3A] border-b border-gray-200 dark:border-[#253745] text-gray-500 dark:text-[#9BA8AB]">
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Product</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Brand</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-center">
                    Units Sold
                  </th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right text-rose-500 dark:text-rose-400">
                    Total Wholesale Cost (₹)
                  </th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right text-[#06141B] dark:text-[#CCD0CF]">
                    Total Revenue (₹)
                  </th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right text-emerald-600 dark:text-emerald-400">
                    Gross Profit (₹)
                  </th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right text-emerald-600 dark:text-emerald-400">
                    Profit Margin %
                  </th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-center">
                    Profitability Rating
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#253745]">
                {productProfitData.map((prod) => (
                  <tr key={prod.productId} className="hover:bg-gray-50 dark:hover:bg-[#182B3A]/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#06141B] dark:text-[#CCD0CF]">{prod.name}</td>
                    <td className="py-3.5 px-4 text-gray-500 dark:text-[#9BA8AB]">{prod.brand}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#06141B] dark:text-[#CCD0CF]">
                      {prod.unitsSold} Pcs
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-500 dark:text-rose-400">
                      {formatCurrency(prod.totalCost)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#06141B] dark:text-[#CCD0CF]">
                      {formatCurrency(prod.totalRevenue)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(prod.grossProfit)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {prod.marginPct.toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {prod.marginPct >= 50 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40">
                          ★ High Margin
                        </span>
                      ) : prod.marginPct >= 30 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40">
                          Normal Margin
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40">
                          Low Margin
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {productProfitData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500 dark:text-[#9BA8AB] text-xs">
                      No product sales recorded in the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: OPERATING EXPENSES WITH DELETE OPTION                              */}
      {/* ========================================================================= */}
      {profitTab === 'expenses' && (
        <div className="bg-white dark:bg-[#11212D] rounded-2xl border border-gray-300 dark:border-[#253745] overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#182B3A] border-b border-gray-200 dark:border-[#253745] text-gray-500 dark:text-[#9BA8AB]">
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Date</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Title / Purpose</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Category</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider">Payment Mode</th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-right text-rose-500 dark:text-rose-400">
                    Amount (₹)
                  </th>
                  <th className="py-3.5 px-4 font-bold uppercase tracking-wider text-center">
                    Action (Delete)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#253745]">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-[#182B3A]/50 transition-colors">
                    <td className="py-3.5 px-4 text-gray-500 dark:text-[#9BA8AB] whitespace-nowrap">
                      {formatDate(exp.date)}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#06141B] dark:text-[#CCD0CF]">{exp.title}</p>
                      {exp.description && (
                        <p className="text-[10px] text-gray-500 dark:text-[#9BA8AB]">{exp.description}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#182B3A] text-emerald-600 dark:text-emerald-400 border border-gray-200 dark:border-[#253745]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 dark:text-[#9BA8AB]">{exp.paymentMethod}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-500 dark:text-rose-400">
                      -{formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setDeletingExpense(exp)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-400 border border-rose-500/30 transition-colors"
                        title="Delete Expense Record"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete / Void Sale Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingSale}
        title={`Void / Delete Invoice #${deletingSale?.invoiceNo}`}
        message={`Are you sure you want to delete this invoice of ${formatCurrency(
          deletingSale?.grandTotal
        )}? The sold items will be automatically restocked into inventory, and gross profit will be adjusted.`}
        confirmText="Yes, Void & Restock"
        requireReason={true}
        reason={deleteSaleReason}
        onReasonChange={setDeleteSaleReason}
        onConfirm={handleConfirmDeleteSale}
        onCancel={() => setDeletingSale(null)}
      />

      {/* Delete Expense Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingExpense}
        title="Delete Expense Record"
        message={`Are you sure you want to delete the expense "${deletingExpense?.title}" of ${formatCurrency(
          deletingExpense?.amount
        )}? Net Profit will be recalculated immediately.`}
        confirmText="Yes, Delete Expense"
        onConfirm={handleConfirmDeleteExpense}
        onCancel={() => setDeletingExpense(null)}
      />
    </div>
  );
};
