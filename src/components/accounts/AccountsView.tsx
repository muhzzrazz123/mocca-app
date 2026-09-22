import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import type { Expense, Bill, ExpenseCategory, PaymentMethod, BillStatus } from '../../types';
import {
  Wallet,
  CalendarClock,
  DollarSign,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Coffee,
  X,
  CreditCard,
} from 'lucide-react';

export const AccountsView: React.FC = () => {
  const { currentUser } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<'cashbook' | 'expenses' | 'bills'>('cashbook');

  // Deletion States
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);

  // New Expense Modal State
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Refreshments');
  const [expMethod, setExpMethod] = useState<PaymentMethod>('Cash');
  const [expNotes, setExpNotes] = useState('');

  // New Bill Modal State
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [billTitle, setBillTitle] = useState('');
  const [billAmount, setBillAmount] = useState<string>('');
  const [billDueDate, setBillDueDate] = useState(todayStr);
  const [billCategory, setBillCategory] = useState<ExpenseCategory>('Shop Rent');
  const [billNotes, setBillNotes] = useState('');

  // Cash Drawer State
  const [openingCash, setOpeningCash] = useState<number>(2000);
  const [countedCash, setCountedCash] = useState<number>(0);

  // Live Database Queries
  const expenses = useLiveQuery(() => db.expenses.toArray(), []) || [];
  const bills = useLiveQuery(() => db.bills.toArray(), []) || [];
  const sales = useLiveQuery(() => db.sales.toArray(), []) || [];

  // Cash Calculations Today
  const todaySales = sales.filter((s) => s.date.startsWith(todayStr));
  const todayExpenses = expenses.filter((e) => e.date.startsWith(todayStr));

  const cashSalesToday = todaySales
    .filter((s) => s.paymentMethod === 'Cash' || s.amountPaid > 0)
    .reduce((acc, s) => acc + (s.paymentMethod === 'Cash' ? s.grandTotal : s.amountPaid), 0);

  const upiSalesToday = todaySales
    .filter((s) => s.paymentMethod === 'UPI')
    .reduce((acc, s) => acc + s.grandTotal, 0);

  const cardSalesToday = todaySales
    .filter((s) => s.paymentMethod === 'Card')
    .reduce((acc, s) => acc + s.grandTotal, 0);

  const cashExpensesToday = todayExpenses
    .filter((e) => e.paymentMethod === 'Cash')
    .reduce((acc, e) => acc + e.amount, 0);

  const expectedCashInDrawer = openingCash + cashSalesToday - cashExpensesToday;
  const cashDiscrepancy = countedCash > 0 ? countedCash - expectedCashInDrawer : 0;

  // Handlers
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle.trim() || !expAmount) return;

    await db.expenses.add({
      title: expTitle.trim(),
      amount: Number(expAmount),
      category: expCategory,
      date: todayStr,
      paymentMethod: expMethod,
      description: expNotes.trim(),
      createdAt: new Date().toISOString(),
    });

    setIsAddExpenseOpen(false);
    setExpTitle('');
    setExpAmount('');
    setExpNotes('');
  };

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billTitle.trim() || !billAmount) return;

    await db.bills.add({
      title: billTitle.trim(),
      amount: Number(billAmount),
      dueDate: billDueDate,
      category: billCategory,
      status: 'Upcoming',
      notes: billNotes.trim(),
      createdAt: new Date().toISOString(),
    });

    setIsAddBillOpen(false);
    setBillTitle('');
    setBillAmount('');
  };

  const handleConfirmDeleteExpense = async () => {
    if (!deletingExpense?.id) return;
    await db.deleteExpenseTransaction(deletingExpense.id, currentUser?.name || 'Mashboob');
    setDeletingExpense(null);
  };

  const handleConfirmDeleteBill = async () => {
    if (!deletingBill?.id) return;
    await db.deleteBillTransaction(deletingBill.id, currentUser?.name || 'Mashboob');
    setDeletingBill(null);
  };

  const handleMarkBillPaid = async (bill: Bill) => {
    await db.bills.update(bill.id!, {
      status: 'Paid',
      paidDate: todayStr,
      paymentMethod: 'Bank Transfer',
    });

    // Also record into expenses
    await db.expenses.add({
      title: `Bill Paid: ${bill.title}`,
      category: bill.category,
      amount: bill.amount,
      date: todayStr,
      paymentMethod: 'Bank Transfer',
      description: `Bill paid on ${todayStr}`,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-24">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#12141A] p-5 rounded-2xl border border-gray-200 dark:border-[#222630] shadow-sm transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold shadow-gold-glow">
            <Wallet size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-cream font-serif">
              Store Accounts & Financial Book
            </h2>
            <p className="text-xs text-gray-500 dark:text-cream-muted">
              Daily cash drawer reconciliation, operating shop expenses, and recurring bills & rent
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#0E1015] p-1 rounded-xl border border-gray-200 dark:border-[#222630] text-xs">
          <button
            onClick={() => setActiveTab('cashbook')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'cashbook'
                ? 'bg-gold text-mocca-950 shadow-gold-glow'
                : 'text-gray-600 dark:text-cream-muted hover:text-gray-900 dark:hover:text-cream hover:bg-gray-200 dark:hover:bg-[#1A1D26]'
            }`}
          >
            <DollarSign size={14} />
            <span>Cash Drawer (Today)</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'expenses'
                ? 'bg-gold text-mocca-950 shadow-gold-glow'
                : 'text-gray-600 dark:text-cream-muted hover:text-gray-900 dark:hover:text-cream hover:bg-gray-200 dark:hover:bg-[#1A1D26]'
            }`}
          >
            <Wallet size={14} />
            <span>Expenses ({expenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bills')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'bills'
                ? 'bg-gold text-mocca-950 shadow-gold-glow'
                : 'text-gray-600 dark:text-cream-muted hover:text-gray-900 dark:hover:text-cream hover:bg-gray-200 dark:hover:bg-[#1A1D26]'
            }`}
          >
            <CalendarClock size={14} />
            <span>Bills & Rent ({bills.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY CASH DRAWER & RECONCILIATION                                */}
      {/* ========================================================================= */}
      {activeTab === 'cashbook' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#14161D] p-5 rounded-2xl border border-gray-200 dark:border-[#222630] shadow-sm space-y-2">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-mocca-400 uppercase tracking-wider block">
                Morning Opening Float
              </span>
              <input
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(Number(e.target.value) || 0)}
                className="text-2xl font-bold text-gray-900 dark:text-cream bg-transparent border-b border-gray-300 dark:border-[#2C3240] outline-none w-32 focus:border-gold"
              />
              <span className="text-[10px] text-gray-400 dark:text-mocca-400 block">Cash in register at 10 AM</span>
            </div>

            <div className="bg-white dark:bg-[#14161D] p-5 rounded-2xl border border-gray-200 dark:border-[#222630] shadow-sm space-y-2">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                + Today's Cash Sales
              </span>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(cashSalesToday)}
              </p>
              <span className="text-[10px] text-gray-400 dark:text-mocca-400 block">From retail cash bills</span>
            </div>

            <div className="bg-white dark:bg-[#14161D] p-5 rounded-2xl border border-gray-200 dark:border-[#222630] shadow-sm space-y-2">
              <span className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 uppercase tracking-wider block">
                − Cash Paid Expenses
              </span>
              <p className="text-2xl font-bold text-rose-500 dark:text-rose-400">
                -{formatCurrency(cashExpensesToday)}
              </p>
              <span className="text-[10px] text-gray-400 dark:text-mocca-400 block">Tea, packaging, courier</span>
            </div>

            <div className="bg-gradient-to-br from-gold/15 via-white dark:via-[#14161D] to-gold/5 dark:to-[#1A1D26] p-5 rounded-2xl border border-gold/40 shadow-gold-glow space-y-2">
              <span className="text-[11px] font-bold text-gold uppercase tracking-wider block">
                Expected In Drawer
              </span>
              <p className="text-2xl font-bold text-gold">{formatCurrency(expectedCashInDrawer)}</p>
              <span className="text-[10px] text-gray-600 dark:text-cream-muted block font-medium">Opening + Sales − Expenses</span>
            </div>
          </div>

          {/* Physical Cash Counted at Closing */}
          <div className="bg-white dark:bg-[#14161D] p-6 rounded-2xl border border-gray-200 dark:border-[#222630] shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-cream uppercase tracking-wider">
              Night Closing Cash Reconciliation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-cream-muted block mb-1.5">
                  Actual Physical Cash Counted (₹):
                </label>
                <input
                  type="number"
                  placeholder="e.g. 14500"
                  value={countedCash || ''}
                  onChange={(e) => setCountedCash(Number(e.target.value) || 0)}
                  className="w-full bg-gray-50 dark:bg-[#0E1015] border border-gray-200 dark:border-[#2C3240] rounded-xl px-4 py-3 text-lg font-bold text-gray-900 dark:text-cream outline-none focus:border-gold"
                />
              </div>

              {countedCash > 0 && (
                <div
                  className={`p-4 rounded-xl border text-sm font-bold flex items-center justify-between ${
                    cashDiscrepancy === 0
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                      : cashDiscrepancy > 0
                      ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-400'
                      : 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  <div>
                    <span className="block text-xs uppercase tracking-wider font-semibold">
                      {cashDiscrepancy === 0
                        ? '✓ Perfect Cash Balance'
                        : cashDiscrepancy > 0
                        ? 'Cash Surplus (Over in Register)'
                        : 'Cash Shortage (Deficit)'}
                    </span>
                    <span className="text-lg">
                      {cashDiscrepancy > 0 ? `+${formatCurrency(cashDiscrepancy)}` : formatCurrency(cashDiscrepancy)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Non-Cash Revenue Today */}
            <div className="pt-4 border-t border-gray-100 dark:border-[#1E222D] flex items-center gap-6 text-xs text-gray-500 dark:text-cream-muted">
              <div>
                UPI Received Today: <strong className="text-gold font-bold">{formatCurrency(upiSalesToday)}</strong>
              </div>
              <div>
                Card Payments: <strong className="text-blue-500 font-bold">{formatCurrency(cardSalesToday)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OPERATING EXPENSES WITH DELETE OPTION                              */}
      {/* ========================================================================= */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-cream uppercase tracking-wider">
              Operating Shop Expenses ({expenses.length})
            </h3>
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gold hover:bg-gold-light text-mocca-950 text-xs font-bold shadow-gold-glow flex items-center gap-1.5 transition-all"
            >
              <Plus size={15} /> + Add Expense
            </button>
          </div>

          <div className="bg-white dark:bg-[#14161D] rounded-2xl border border-gray-200 dark:border-[#222630] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#0E1015]/80 border-b border-gray-200 dark:border-[#1E222D] text-gray-500 dark:text-mocca-400">
                    <th className="py-3 px-4 font-bold">Date</th>
                    <th className="py-3 px-4 font-bold">Expense Title / Vendor</th>
                    <th className="py-3 px-4 font-bold">Category</th>
                    <th className="py-3 px-4 font-bold">Payment Mode</th>
                    <th className="py-3 px-4 font-bold text-right text-rose-500">Amount (₹)</th>
                    <th className="py-3 px-4 font-bold text-center">Action (Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#1E222D]">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-[#1A1D26]/50 transition-colors">
                      <td className="py-3.5 px-4 text-gray-600 dark:text-cream-muted whitespace-nowrap">
                        {formatDate(exp.date)}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-gray-900 dark:text-cream">{exp.title}</p>
                        {exp.description && <p className="text-[10px] text-gray-400">{exp.description}</p>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1A1D26] text-gold border border-gray-200 dark:border-[#2C3240]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 dark:text-cream-muted">{exp.paymentMethod}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-500">
                        -{formatCurrency(exp.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setDeletingExpense(exp)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 transition-colors"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SHOP BILLS & RECURRING RENT WITH DELETE OPTION                    */}
      {/* ========================================================================= */}
      {activeTab === 'bills' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-cream uppercase tracking-wider">
              Shop Bills, Showroom Rent & Utilities ({bills.length})
            </h3>
            <button
              onClick={() => setIsAddBillOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gold hover:bg-gold-light text-mocca-950 text-xs font-bold shadow-gold-glow flex items-center gap-1.5 transition-all"
            >
              <Plus size={15} /> + Add Bill / Rent
            </button>
          </div>

          <div className="bg-white dark:bg-[#14161D] rounded-2xl border border-gray-200 dark:border-[#222630] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#0E1015]/80 border-b border-gray-200 dark:border-[#1E222D] text-gray-500 dark:text-mocca-400">
                    <th className="py-3 px-4 font-bold">Bill Title / Purpose</th>
                    <th className="py-3 px-4 font-bold">Category</th>
                    <th className="py-3 px-4 font-bold">Due Date</th>
                    <th className="py-3 px-4 font-bold text-right">Amount (₹)</th>
                    <th className="py-3 px-4 font-bold text-center">Status</th>
                    <th className="py-3 px-4 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#1E222D]">
                  {bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50 dark:hover:bg-[#1A1D26]/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-cream">{bill.title}</td>
                      <td className="py-3.5 px-4 text-gray-500 dark:text-cream-muted">{bill.category}</td>
                      <td className="py-3.5 px-4 font-mono text-gray-600 dark:text-cream-muted">{formatDate(bill.dueDate)}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-gray-900 dark:text-cream">
                        {formatCurrency(bill.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            bill.status === 'Paid'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                              : bill.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'
                              : 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                          }`}
                        >
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {bill.status !== 'Paid' && (
                            <button
                              onClick={() => handleMarkBillPaid(bill)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] border border-emerald-300 dark:border-emerald-500/30"
                            >
                              Pay Now
                            </button>
                          )}
                          <button
                            onClick={() => setDeletingBill(bill)}
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 transition-colors"
                            title="Delete Bill"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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

      {/* Delete Bill Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingBill}
        title="Delete Bill / Rent"
        message={`Are you sure you want to delete the bill "${deletingBill?.title}" of ${formatCurrency(
          deletingBill?.amount
        )}?`}
        confirmText="Yes, Delete Bill"
        onConfirm={handleConfirmDeleteBill}
        onCancel={() => setDeletingBill(null)}
      />

      {/* Add Expense Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleSaveExpense}
            className="w-full max-w-md bg-white dark:bg-[#14161D] border border-gray-200 dark:border-gold/40 rounded-2xl p-6 shadow-luxury space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#222630]">
              <h3 className="text-base font-bold text-gray-900 dark:text-cream font-serif">Record Operating Expense</h3>
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(false)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-cream"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 dark:text-cream-muted block mb-1">Expense Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Evening staff tea & snacks"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0E1015] border border-gray-200 dark:border-[#2C3240] rounded-xl px-3 py-2 text-gray-900 dark:text-cream outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 dark:text-cream-muted block mb-1">Amount (₹):</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 150"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#0E1015] border border-gray-200 dark:border-[#2C3240] rounded-xl px-3 py-2 text-gray-900 dark:text-cream font-bold outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 dark:text-cream-muted block mb-1">Category:</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-gray-50 dark:bg-[#0E1015] border border-gray-200 dark:border-[#2C3240] rounded-xl px-2 py-2 text-gray-900 dark:text-cream outline-none focus:border-gold"
                  >
                    <option value="Refreshments">Refreshments & Tea</option>
                    <option value="Packaging">Packaging Bags</option>
                    <option value="Transport">Transport & Auto</option>
                    <option value="Maintenance">Shop Cleaning</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Shop Rent">Shop Rent</option>
                    <option value="Room Rent">Staff Room Rent</option>
                    <option value="Internet">Internet</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 dark:text-cream-muted block mb-1">Payment Method:</label>
                <select
                  value={expMethod}
                  onChange={(e) => setExpMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-gray-50 dark:bg-[#0E1015] border border-gray-200 dark:border-[#2C3240] rounded-xl px-3 py-2 text-gray-900 dark:text-cream outline-none focus:border-gold"
                >
                  <option value="Cash">Cash Drawer</option>
                  <option value="UPI">UPI / GPay</option>
                  <option value="Card">Bank Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#1E222D] text-gray-700 dark:text-cream-muted text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold to-gold-600 text-mocca-950 font-bold text-xs shadow-gold-glow"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Bill Modal */}
      {isAddBillOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleSaveBill}
            className="w-full max-w-md bg-white dark:bg-[#14161D] border border-gray-200 dark:border-gold/40 rounded-2xl p-6 shadow-luxury space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#222630]">
              <h3 className="text-base font-bold text-gray-900 dark:text-cream font-serif">Add Upcoming Bill / Rent</h3>
              <button
                type="button"
                onClick={() => setIsAddBillOpen(false)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-cream"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 dark:text-cream-muted block mb-1">Bill Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Showroom Rent (October)"
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0E1015] border border-gray-200 dark:border-[#2C3240] rounded-xl px-3 py-2 text-gray-900 dark:text-cream outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 dark:text-cream-muted block mb-1">Amount (₹):</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="45000"
                    value={billAmount}
                    onChange={(e) => setBillAmount(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#0E1015] border border-gray-200 dark:border-[#2C3240] rounded-xl px-3 py-2 text-gray-900 dark:text-cream font-bold outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 dark:text-cream-muted block mb-1">Due Date:</label>
                  <input
                    type="date"
                    required
                    value={billDueDate}
                    onChange={(e) => setBillDueDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#0E1015] border border-gray-200 dark:border-[#2C3240] rounded-xl px-2 py-2 text-gray-900 dark:text-cream outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 dark:text-cream-muted block mb-1">Category:</label>
                <select
                  value={billCategory}
                  onChange={(e) => setBillCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-gray-50 dark:bg-[#0E1015] border border-gray-200 dark:border-[#2C3240] rounded-xl px-3 py-2 text-gray-900 dark:text-cream outline-none focus:border-gold"
                >
                  <option value="Shop Rent">Shop Rent</option>
                  <option value="Room Rent">Room Rent</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Internet">Internet</option>
                  <option value="Supplier Payments">Supplier Payments</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAddBillOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#1E222D] text-gray-700 dark:text-cream-muted text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold to-gold-600 text-mocca-950 font-bold text-xs shadow-gold-glow"
              >
                Save Bill
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
