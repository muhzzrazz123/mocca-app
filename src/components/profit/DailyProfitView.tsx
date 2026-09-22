import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useAuth } from '../../context/AuthContext';
import { usePeriod } from '../../context/PeriodContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import type { Sale, Product, ProductVariant, PaymentMethod } from '../../types';
import {
  TrendingUp,
  Receipt,
  Shirt,
  Search,
  Download,
  Trash2,
  Plus,
  AlertTriangle,
  ArrowUpDown,
  Boxes,
  Tag,
  DollarSign,
  Percent,
  CheckCircle2,
  X,
} from 'lucide-react';

export const DailyProfitView: React.FC = () => {
  const { currentUser } = useAuth();
  const { period, startDate, endDate, periodLabel } = usePeriod();

  // Active Sub-Tab: Profit / Sales / Products
  const [activeSubTab, setActiveSubTab] = useState<'profit' | 'sales' | 'products'>('profit');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Delete State
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [deleteSaleReason, setDeleteSaleReason] = useState('Customer cancellation / mistake');

  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Add Product Modal State
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Shirts');
  const [newProdBrand, setNewProdBrand] = useState('MOCCA Signature');
  const [newProdCost, setNewProdCost] = useState<string>('600');
  const [newProdSell, setNewProdSell] = useState<string>('1499');
  const [newProdStock, setNewProdStock] = useState<string>('10');
  const [newProdSize, setNewProdSize] = useState('L');
  const [newProdColor, setNewProdColor] = useState('Black');

  // Live Database Queries
  const sales = useLiveQuery(() => db.sales.toArray(), []) || [];
  const saleItems = useLiveQuery(() => db.saleItems.toArray(), []) || [];
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) || [];
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const variants = useLiveQuery(() => db.productVariants.toArray(), []) || [];

  // Filtered Sales in Date Range
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const sDate = s.date.split('T')[0];
      const inRange = sDate >= startDate && sDate <= endDate;
      if (!inRange) return false;

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

    const periodExpenses = expenses.filter((e) => {
      const eDate = e.date.split('T')[0];
      return eDate >= startDate && eDate <= endDate;
    });
    const totalExpenses = periodExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalGrossProfit - totalExpenses;
    const overallMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCogs,
      totalGrossProfit,
      totalExpenses,
      netProfit,
      overallMargin,
    };
  }, [filteredSales, expenses, startDate, endDate]);

  // Product Profit & Catalog Matrix
  const productCatalogData = useMemo(() => {
    const saleIdSet = new Set(filteredSales.map((s) => s.id));
    const relevantItems = saleItems.filter((i) => i.saleId && saleIdSet.has(i.saleId));

    // Map item sold stats
    const itemStatsMap = new Map<number, { units: number; revenue: number; cost: number; profit: number }>();
    relevantItems.forEach((i) => {
      const existing = itemStatsMap.get(i.productId) || { units: 0, revenue: 0, cost: 0, profit: 0 };
      const itemCost = i.purchasePrice * i.quantity;
      const itemRev = i.total;
      existing.units += i.quantity;
      existing.revenue += itemRev;
      existing.cost += itemCost;
      existing.profit += itemRev - itemCost;
      itemStatsMap.set(i.productId, existing);
    });

    return products.map((prod) => {
      const prodVariants = variants.filter((v) => v.productId === prod.id);
      const totalStock = prodVariants.reduce((acc, v) => acc + (v.currentStock || 0), 0);
      const minCost = prodVariants.length > 0 ? Math.min(...prodVariants.map((v) => v.purchasePrice)) : 0;
      const maxSell = prodVariants.length > 0 ? Math.max(...prodVariants.map((v) => v.sellingPrice)) : 0;
      const stats = itemStatsMap.get(prod.id!) || { units: 0, revenue: 0, cost: 0, profit: 0 };
      const marginPct = stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : maxSell > 0 ? ((maxSell - minCost) / maxSell) * 100 : 0;

      return {
        product: prod,
        variants: prodVariants,
        totalStock,
        minCost,
        maxSell,
        unitsSold: stats.units,
        totalRevenue: stats.revenue,
        grossProfit: stats.profit,
        marginPct,
      };
    }).filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return p.product.name.toLowerCase().includes(q) || p.product.brand.toLowerCase().includes(q) || p.product.sku.toLowerCase().includes(q);
    });
  }, [products, variants, filteredSales, saleItems, searchQuery]);

  // Handlers for Deletion
  const handleConfirmDeleteSale = async () => {
    if (!deletingSale?.id) return;
    await db.voidSaleTransaction(deletingSale.id, deleteSaleReason, currentUser?.name || 'Mashboob');
    setDeletingSale(null);
    setDeleteSaleReason('Customer cancellation / mistake');
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deletingProduct?.id) return;
    await db.deleteProductTransaction(deletingProduct.id, currentUser?.name || 'Mashboob');
    setDeletingProduct(null);
  };

  // Add Product Form Handler
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const prodId = await db.products.add({
      name: newProdName.trim(),
      sku: `MOC-${newProdName.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      barcode: `890100${Date.now().toString().slice(-6)}`,
      categoryId: 1,
      categoryName: newProdCategory,
      brand: newProdBrand,
      minStockLevel: 3,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    await db.productVariants.add({
      productId: Number(prodId),
      sku: `MOC-${newProdName.substring(0, 3).toUpperCase()}-${newProdSize}-${newProdColor}`,
      barcode: `890100${Date.now().toString().slice(-6)}`,
      size: newProdSize,
      color: newProdColor,
      purchasePrice: Number(newProdCost),
      sellingPrice: Number(newProdSell),
      currentStock: Number(newProdStock),
      minStockLevel: 2,
    });

    setIsAddProductOpen(false);
    setNewProdName('');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Type,Invoice / Product,Customer / Brand,Wholesale Cost (INR),Revenue (INR),Gross Profit (INR),Margin %'];
    const rows = filteredSales.map((s) => {
      const margin = s.grandTotal > 0 ? ((s.grossProfit / s.grandTotal) * 100).toFixed(1) : '0';
      return `"Sale","${s.invoiceNo}","${s.customerName}",${s.totalCostOfGoods},${s.grandTotal},${s.grossProfit},"${margin}%"`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MOCCA_Daily_Profit_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-24">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#11212D] p-5 rounded-2xl border border-gray-300 dark:border-[#253745] shadow-sm transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#06141B] dark:text-[#CCD0CF] font-serif">
                Daily Profit, Sales & Products
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                Formula: Profit = Sales − Wholesale Cost
              </span>
            </div>
            <p className="text-xs text-[#4A5C6A] dark:text-[#9BA8AB]">
              Live consolidated profit margins, bill history, and clothing item performance ({periodLabel})
            </p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-emerald-50 hover:border-emerald-500 dark:bg-[#182B3A] dark:hover:bg-[#253745] dark:hover:border-emerald-500 text-[#06141B] dark:text-[#CCD0CF] text-xs font-semibold border border-gray-300 dark:border-[#253745] flex items-center gap-2 transition-all self-start md:self-auto group"
        >
          <Download size={14} className="text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500" /> Export CSV
        </button>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-[#11212D] p-4 rounded-2xl border border-gray-300 dark:border-[#253745] shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-[#4A5C6A] dark:text-[#9BA8AB] uppercase tracking-wider">
            Total Sales Revenue
          </span>
          <p className="text-2xl font-bold text-[#06141B] dark:text-[#CCD0CF]">{formatCurrency(totals.totalRevenue)}</p>
          <span className="text-[10px] text-[#4A5C6A] dark:text-[#9BA8AB]">{filteredSales.length} Invoices generated</span>
        </div>

        <div className="bg-white dark:bg-[#11212D] p-4 rounded-2xl border border-gray-300 dark:border-[#253745] shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider">
            Wholesale Cost (COGS)
          </span>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-300">{formatCurrency(totals.totalCogs)}</p>
          <span className="text-[10px] text-[#4A5C6A] dark:text-[#9BA8AB]">Actual cost of sold apparel</span>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 via-white dark:via-[#11212D] to-emerald-500/5 dark:to-[#182B3A] p-4 rounded-2xl border border-emerald-500/30 shadow-emerald-500/10 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
            Gross Margin Profit
          </span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totals.totalGrossProfit)}</p>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
            {totals.overallMargin.toFixed(1)}% Gross Margin
          </span>
        </div>

        <div className="bg-white dark:bg-[#11212D] p-4 rounded-2xl border border-gray-300 dark:border-[#253745] shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Operating Expenses
          </span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-300">
            {formatCurrency(totals.totalExpenses)}
          </p>
          <span className="text-[10px] text-gray-500 dark:text-mocca-400">Rent, Power, Salaries</span>
        </div>

        <div className="bg-white dark:bg-[#14161D] p-4 rounded-2xl border border-gray-200 dark:border-[#222630] shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Net Store Profit
          </span>
          <p
            className={`text-2xl font-bold ${
              totals.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(totals.netProfit)}
          </p>
          <span className="text-[10px] text-gray-500 dark:text-cream-muted">Bottom-line take home</span>
        </div>
      </div>

      {/* Sub-tabs Selector Bar */}
      <div className="bg-white dark:bg-[#11212D] p-3 rounded-2xl border border-gray-300 dark:border-[#253745] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#182B3A] p-1 rounded-xl border border-gray-200 dark:border-[#253745] text-xs">
          <button
            onClick={() => setActiveSubTab('profit')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeSubTab === 'profit'
                ? 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-sm'
                : 'text-[#4A5C6A] dark:text-[#CCD0CF] hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-gray-200 dark:hover:bg-[#253745]'
            }`}
          >
            <TrendingUp size={14} />
            <span>Profit & Margins</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sales')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeSubTab === 'sales'
                ? 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-sm'
                : 'text-[#4A5C6A] dark:text-[#CCD0CF] hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-gray-200 dark:hover:bg-[#253745]'
            }`}
          >
            <Receipt size={14} />
            <span>Sales History ({filteredSales.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('products')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition-all ${
              activeSubTab === 'products'
                ? 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-sm'
                : 'text-[#4A5C6A] dark:text-[#CCD0CF] hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-gray-200 dark:hover:bg-[#253745]'
            }`}
          >
            <Shirt size={14} />
            <span>Products & Stock ({products.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#182B3A] px-3.5 py-2 rounded-xl border border-gray-300 dark:border-[#253745] text-xs">
          <Search size={14} className="text-emerald-600 dark:text-emerald-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice #, product, or customer..."
            className="bg-transparent text-[#06141B] dark:text-[#CCD0CF] placeholder:text-gray-400 dark:placeholder:text-[#9BA8AB] outline-none text-xs w-56"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: PROFIT & MARGIN ANALYSIS                                          */}
      {/* ========================================================================= */}
      {activeSubTab === 'profit' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#11212D] rounded-2xl border border-gray-300 dark:border-[#253745] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-[#253745]">
              <div>
                <h3 className="text-sm font-bold text-[#06141B] dark:text-[#CCD0CF] uppercase tracking-wider">
                  Daily Gross Profit Analysis by Transaction
                </h3>
                <p className="text-xs text-[#4A5C6A] dark:text-[#9BA8AB]">
                  Every bill automatically calculates profit using its real wholesale purchase cost
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                Avg. Margin: {totals.overallMargin.toFixed(1)}%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#182B3A]/80 border-b border-gray-200 dark:border-[#253745] text-[#4A5C6A] dark:text-[#9BA8AB]">
                    <th className="py-3 px-4 font-bold">Date & Time</th>
                    <th className="py-3 px-4 font-bold">Bill #</th>
                    <th className="py-3 px-4 font-bold">Customer</th>
                    <th className="py-3 px-4 font-bold text-right">Revenue (₹)</th>
                    <th className="py-3 px-4 font-bold text-right text-rose-500">Wholesale Cost (₹)</th>
                    <th className="py-3 px-4 font-bold text-right text-emerald-600 dark:text-emerald-400">Gross Profit (₹)</th>
                    <th className="py-3 px-4 font-bold text-right text-emerald-500">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#1E222D]">
                  {filteredSales.map((s) => {
                    const margin = s.grandTotal > 0 ? ((s.grossProfit / s.grandTotal) * 100).toFixed(1) : '0';
                    return (
                      <tr key={s.id} className="hover:bg-emerald-50/40 dark:hover:bg-[#182B3A]/60 transition-colors">
                        <td className="py-3 px-4 text-[#4A5C6A] dark:text-[#9BA8AB] whitespace-nowrap">
                          {formatDateTime(s.createdAt || s.date)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">#{s.invoiceNo}</td>
                        <td className="py-3 px-4 font-medium text-[#06141B] dark:text-[#CCD0CF]">{s.customerName}</td>
                        <td className="py-3 px-4 text-right font-bold text-[#06141B] dark:text-[#CCD0CF]">
                          {formatCurrency(s.grandTotal)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-500">
                          {formatCurrency(s.totalCostOfGoods)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          +{formatCurrency(s.grossProfit)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-500">{margin}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: SALES RECORDS WITH CASCADING DELETE / VOID BILL                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'sales' && (
        <div className="bg-white dark:bg-[#11212D] rounded-2xl border border-gray-300 dark:border-[#253745] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-[#253745] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#06141B] dark:text-[#CCD0CF] uppercase tracking-wider">
                Sales Invoices & Transactions ({filteredSales.length})
              </h3>
              <p className="text-xs text-[#4A5C6A] dark:text-[#9BA8AB]">
                Need to delete or void a bill? The delete option restores the sold clothing pieces back to inventory.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#182B3A]/80 border-b border-gray-200 dark:border-[#253745] text-[#4A5C6A] dark:text-[#9BA8AB]">
                  <th className="py-3 px-4 font-bold">Date & Time</th>
                  <th className="py-3 px-4 font-bold">Bill #</th>
                  <th className="py-3 px-4 font-bold">Customer</th>
                  <th className="py-3 px-4 font-bold">Payment Method</th>
                  <th className="py-3 px-4 font-bold text-right">Amount (₹)</th>
                  <th className="py-3 px-4 font-bold text-right text-emerald-600 dark:text-emerald-400">Profit (₹)</th>
                  <th className="py-3 px-4 font-bold text-center">Action (Delete)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#253745]">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-emerald-50/40 dark:hover:bg-[#182B3A]/60 transition-colors">
                    <td className="py-3 px-4 text-[#4A5C6A] dark:text-[#9BA8AB] whitespace-nowrap">
                      {formatDateTime(sale.createdAt || sale.date)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">#{sale.invoiceNo}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#06141B] dark:text-[#CCD0CF]">{sale.customerName}</p>
                      {sale.customerPhone && <p className="text-[10px] text-[#4A5C6A] dark:text-[#9BA8AB]">{sale.customerPhone}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#182B3A] text-gray-800 dark:text-cream border border-gray-200 dark:border-[#253745]">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#06141B] dark:text-[#CCD0CF]">
                      {formatCurrency(sale.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(sale.grossProfit)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setDeletingSale(sale)}
                        className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 transition-colors"
                        title="Delete / Void Invoice (Restores Stock)"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredSales.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 text-xs">
                      No invoices recorded for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: PRODUCTS CATALOG & STOCK WITH DELETE OPTION                       */}
      {/* ========================================================================= */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#06141B] dark:text-[#CCD0CF] uppercase tracking-wider">
              Store Apparel Catalog & Stock Levels ({productCatalogData.length})
            </h3>
            <button
              onClick={() => setIsAddProductOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-emerald-500/20 shadow-md flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus size={15} /> + Add New Product
            </button>
          </div>

          <div className="bg-white dark:bg-[#11212D] rounded-2xl border border-gray-300 dark:border-[#253745] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#182B3A]/80 border-b border-gray-200 dark:border-[#253745] text-[#4A5C6A] dark:text-[#9BA8AB]">
                    <th className="py-3.5 px-4 font-bold">Product Name</th>
                    <th className="py-3.5 px-4 font-bold">Category</th>
                    <th className="py-3.5 px-4 font-bold">Sizes & Colors</th>
                    <th className="py-3.5 px-4 font-bold text-right">Wholesale Cost (₹)</th>
                    <th className="py-3.5 px-4 font-bold text-right">Selling Price (₹)</th>
                    <th className="py-3.5 px-4 font-bold text-center">In Stock</th>
                    <th className="py-3.5 px-4 font-bold text-right text-emerald-600 dark:text-emerald-400">Profit Generated</th>
                    <th className="py-3.5 px-4 font-bold text-center">Action (Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#253745]">
                  {productCatalogData.map(({ product, variants: prodVariants, totalStock, minCost, maxSell, grossProfit }) => (
                    <tr key={product.id} className="hover:bg-emerald-50/40 dark:hover:bg-[#182B3A]/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#06141B] dark:text-[#CCD0CF]">{product.name}</p>
                        <p className="text-[10px] text-[#4A5C6A] dark:text-[#9BA8AB] font-mono">
                          {product.brand} • SKU: {product.sku}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                          {product.categoryName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {prodVariants.map((v) => (
                            <span
                              key={v.id}
                              className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${
                                v.currentStock <= 0
                                  ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
                                  : 'bg-gray-100 dark:bg-[#182B3A] text-gray-700 dark:text-[#CCD0CF] border-gray-200 dark:border-[#253745]'
                              }`}
                            >
                              {v.size}/{v.color} ({v.currentStock})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-500">
                        {formatCurrency(minCost)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#06141B] dark:text-[#CCD0CF]">
                        {formatCurrency(maxSell)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                            totalStock <= 0
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                              : totalStock <= 3
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                          }`}
                        >
                          {totalStock} Pcs
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(grossProfit)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setDeletingProduct(product)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 transition-colors"
                          title="Delete Product from Catalog"
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
        </div>
      )}

      {/* Delete / Void Invoice Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingSale}
        title={`Void / Delete Bill #${deletingSale?.invoiceNo}`}
        message={`Are you sure you want to delete this bill of ${formatCurrency(
          deletingSale?.grandTotal
        )}? The items will be automatically restocked into inventory, and gross profit will adjust.`}
        confirmText="Yes, Void & Restock"
        requireReason={true}
        reason={deleteSaleReason}
        onReasonChange={setDeleteSaleReason}
        onConfirm={handleConfirmDeleteSale}
        onCancel={() => setDeletingSale(null)}
      />

      {/* Delete Product Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingProduct}
        title={`Delete Product: ${deletingProduct?.name}`}
        message={`Are you sure you want to remove "${deletingProduct?.name}" and all its size/color variants from your store catalog?`}
        confirmText="Yes, Delete Product"
        onConfirm={handleConfirmDeleteProduct}
        onCancel={() => setDeletingProduct(null)}
      />

      {/* Add Product Modal */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleCreateProduct}
            className="w-full max-w-md bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-[#253745]">
              <h3 className="text-base font-bold text-[#06141B] dark:text-[#CCD0CF] font-serif">Add New Clothing Product</h3>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-[#CCD0CF]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 dark:text-[#9BA8AB] block mb-1">Product Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Linen Mandarin Shirt"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-[#06141B] dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 dark:text-[#9BA8AB] block mb-1">Category:</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-2 py-2 text-[#06141B] dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                  >
                    <option value="Shirts">Shirts</option>
                    <option value="T-Shirts">T-Shirts</option>
                    <option value="Jeans">Jeans</option>
                    <option value="Pants">Pants</option>
                    <option value="Shorts">Shorts</option>
                    <option value="Jackets">Jackets</option>
                    <option value="Boys Wear">Boys Wear</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 dark:text-[#9BA8AB] block mb-1">Brand Line:</label>
                  <select
                    value={newProdBrand}
                    onChange={(e) => setNewProdBrand(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-2 py-2 text-[#06141B] dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                  >
                    <option value="MOCCA Signature">MOCCA Signature</option>
                    <option value="MOCCA Denim Co.">MOCCA Denim Co.</option>
                    <option value="MOCCA Urban Casuals">MOCCA Urban Casuals</option>
                    <option value="MOCCA Junior">MOCCA Junior</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-rose-500 block mb-1">Wholesale Cost (₹):</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-[#06141B] dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">Retail Selling Price (₹):</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newProdSell}
                    onChange={(e) => setNewProdSell(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-[#06141B] dark:text-[#CCD0CF] font-bold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-gray-700 dark:text-[#9BA8AB] block mb-1">Size:</label>
                  <input
                    type="text"
                    value={newProdSize}
                    onChange={(e) => setNewProdSize(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-2 py-2 text-[#06141B] dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 dark:text-[#9BA8AB] block mb-1">Color:</label>
                  <input
                    type="text"
                    value={newProdColor}
                    onChange={(e) => setNewProdColor(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-2 py-2 text-[#06141B] dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 dark:text-[#9BA8AB] block mb-1">Initial Stock:</label>
                  <input
                    type="number"
                    min="0"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-2 py-2 text-[#06141B] dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#182B3A] dark:hover:bg-[#253745] text-gray-700 dark:text-[#CCD0CF] text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-emerald-500/20 shadow-md transition-all active:scale-95"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
