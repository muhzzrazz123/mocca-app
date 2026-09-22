import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import type { ExpenseCategory, PaymentMethod, AttendanceStatus, StaffPosition } from '../../types';
import {
  X,
  PlusCircle,
  Wallet,
  Boxes,
  UserCheck,
  MessageSquarePlus,
  Receipt,
  CheckCircle2,
  DollarSign,
  Calendar,
  Coffee,
  Sparkles,
} from 'lucide-react';

interface DailyEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'expense' | 'stock' | 'attendance' | 'request' | 'closing';
  onNavigateToPos?: () => void;
}

export const DailyEntryModal: React.FC<DailyEntryModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'expense',
  onNavigateToPos,
}) => {
  const { currentUser } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<'expense' | 'stock' | 'attendance' | 'request' | 'closing'>(
    defaultTab
  );

  // Success Toast state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  // ----------------------------------------------------
  // FORM 1: DAILY EXPENSE STATE & PRESETS
  // ----------------------------------------------------
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Refreshments');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseMethod, setExpenseMethod] = useState<PaymentMethod>('Cash');
  const [expenseDescription, setExpenseDescription] = useState('');

  const quickExpensePresets = [
    { title: 'Tea & Evening Snacks', category: 'Refreshments' as ExpenseCategory, defaultAmount: 150 },
    { title: 'Store Packaging Bags', category: 'Packaging' as ExpenseCategory, defaultAmount: 800 },
    { title: 'Staff Lunch / Refreshments', category: 'Refreshments' as ExpenseCategory, defaultAmount: 350 },
    { title: 'Transport / Courier Parcel', category: 'Transport' as ExpenseCategory, defaultAmount: 250 },
    { title: 'Store Cleaning & Maintenance', category: 'Maintenance' as ExpenseCategory, defaultAmount: 200 },
  ];

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount || Number(expenseAmount) <= 0) return;

    await db.expenses.add({
      title: expenseTitle.trim(),
      category: expenseCategory,
      amount: Number(expenseAmount),
      date: todayStr,
      paymentMethod: expenseMethod,
      description: expenseDescription.trim() || `Daily shop expense entered by ${currentUser?.name || 'Owner'}`,
      createdAt: new Date().toISOString(),
    });

    await db.auditLogs.add({
      action: 'DAILY_EXPENSE_ADDED',
      category: 'FINANCE',
      details: `Daily expense "${expenseTitle}" of ₹${expenseAmount} (${expenseCategory}) logged.`,
      user: currentUser?.name || 'Owner',
      timestamp: new Date().toISOString(),
    });

    showSuccess(`Expense "₹${expenseAmount} - ${expenseTitle}" recorded successfully!`);
    setExpenseTitle('');
    setExpenseAmount('');
    setExpenseDescription('');
  };

  // ----------------------------------------------------
  // FORM 2: QUICK DAILY STOCK INTAKE STATE
  // ----------------------------------------------------
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const variants = useLiveQuery(() => db.productVariants.toArray(), []) || [];

  const [selectedVariantId, setSelectedVariantId] = useState<number | ''>('');
  const [stockAddQty, setStockAddQty] = useState<number>(5);
  const [stockReason, setStockReason] = useState('New parcel received today');

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId || stockAddQty <= 0) return;

    const variant = await db.productVariants.get(Number(selectedVariantId));
    if (!variant) return;

    const product = await db.products.get(variant.productId);

    // Update variant stock
    await db.productVariants.update(variant.id!, {
      currentStock: variant.currentStock + Number(stockAddQty),
    });

    // Record inventory movement
    await db.inventoryMovements.add({
      date: todayStr,
      productId: variant.productId,
      productName: product?.name || 'Product',
      variantId: variant.id!,
      variantInfo: `${variant.size} / ${variant.color}`,
      quantity: Number(stockAddQty),
      action: 'PURCHASE',
      reason: stockReason.trim() || 'Daily stock arrival',
      user: currentUser?.name || 'Owner',
      createdAt: new Date().toISOString(),
    });

    await db.auditLogs.add({
      action: 'STOCK_ADDED',
      category: 'INVENTORY',
      details: `Added +${stockAddQty} pcs of ${product?.name} (${variant.size} / ${variant.color}).`,
      user: currentUser?.name || 'Owner',
      timestamp: new Date().toISOString(),
    });

    showSuccess(`Added +${stockAddQty} units to ${product?.name} (${variant.size} / ${variant.color})!`);
    setStockAddQty(5);
  };

  // ----------------------------------------------------
  // FORM 3: QUICK ATTENDANCE STATE
  // ----------------------------------------------------
  const staffList = useLiveQuery(() => db.staff.toArray(), []) || [];
  const todayAttendance = useLiveQuery(() => db.attendance.where('date').equals(todayStr).toArray(), [todayStr]) || [];

  const handleQuickMarkAttendance = async (staffId: number, staffName: string, status: AttendanceStatus) => {
    const existing = await db.attendance.where({ staffId, date: todayStr }).first();
    if (existing) {
      await db.attendance.update(existing.id!, { status });
    } else {
      await db.attendance.add({
        staffId,
        staffName,
        date: todayStr,
        status,
        checkIn: status === 'Present' || status === 'Half Day' ? '10:00 AM' : undefined,
      });
    }
    showSuccess(`Marked ${staffName} as ${status} today.`);
  };

  // ----------------------------------------------------
  // FORM 4: CUSTOMER REQUEST STATE
  // ----------------------------------------------------
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custProduct, setCustProduct] = useState('');
  const [custCategory, setCustCategory] = useState('Shirts');
  const [custSize, setCustSize] = useState('L');
  const [custColor, setCustColor] = useState('Black');
  const [custNotes, setCustNotes] = useState('');

  const handleSaveCustomerRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custProduct.trim()) return;

    await db.customerRequests.add({
      customerName: custName.trim() || 'Walk-in Customer',
      customerPhone: custPhone.trim() || 'Not Provided',
      requestedProduct: custProduct.trim(),
      category: custCategory,
      size: custSize,
      color: custColor,
      date: todayStr,
      status: 'Pending',
      notes: custNotes.trim() || 'Requested on shop floor today',
      createdAt: new Date().toISOString(),
    });

    showSuccess(`Customer request for "${custProduct} (${custSize}/${custColor})" logged!`);
    setCustProduct('');
    setCustNotes('');
  };

  // ----------------------------------------------------
  // FORM 5: DAILY DAY-END CASH RECONCILIATION
  // ----------------------------------------------------
  const todaySales = useLiveQuery(
    () => db.sales.filter((s) => s.date.startsWith(todayStr)).toArray(),
    [todayStr]
  ) || [];

  const todayExpenses = useLiveQuery(
    () => db.expenses.filter((e) => e.date.startsWith(todayStr)).toArray(),
    [todayStr]
  ) || [];

  const [openingCash, setOpeningCash] = useState<number>(2000);
  const [countedCash, setCountedCash] = useState<number>(0);

  const cashSalesToday = todaySales
    .filter((s) => s.paymentMethod === 'Cash' || s.amountPaid > 0)
    .reduce((acc, s) => acc + (s.paymentMethod === 'Cash' ? s.grandTotal : s.amountPaid), 0);

  const cashExpensesToday = todayExpenses
    .filter((e) => e.paymentMethod === 'Cash')
    .reduce((acc, e) => acc + e.amount, 0);

  const expectedCashInDrawer = openingCash + cashSalesToday - cashExpensesToday;
  const cashDifference = countedCash > 0 ? countedCash - expectedCashInDrawer : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#11212D] border border-[#253745] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 lg:p-5 border-b border-[#253745] flex items-center justify-between bg-[#06141B]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <PlusCircle size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#CCD0CF] font-serif">Daily Store Operations Entry</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Today: {todayStr}
                </span>
              </div>
              <p className="text-xs text-[#9BA8AB]">
                Add daily transactions, expenses, stock, and attendance without leaving your screen
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#182B3A]">
            <X size={20} />
          </button>
        </div>

        {/* Success Toast */}
        {successMessage && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-5 py-2.5 text-xs text-emerald-300 font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Sub-tabs Navigation */}
        <div className="flex items-center gap-1.5 p-3 border-b border-[#253745] bg-[#06141B]/40 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'expense'
                ? 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-sm'
                : 'text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#182B3A]'
            }`}
          >
            <Wallet size={15} />
            <span>+ Daily Expense</span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'stock'
                ? 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-sm'
                : 'text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#182B3A]'
            }`}
          >
            <Boxes size={15} />
            <span>+ Received Stock</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'attendance'
                ? 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-sm'
                : 'text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#182B3A]'
            }`}
          >
            <UserCheck size={15} />
            <span>Today's Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab('request')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'request'
                ? 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-sm'
                : 'text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#182B3A]'
            }`}
          >
            <MessageSquarePlus size={15} />
            <span>+ Customer Request</span>
          </button>

          <button
            onClick={() => setActiveTab('closing')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
              activeTab === 'closing'
                ? 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-sm'
                : 'text-[#9BA8AB] hover:text-[#CCD0CF] hover:bg-[#182B3A]'
            }`}
          >
            <DollarSign size={15} />
            <span>Cash Drawer Balance</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* ================================================================= */}
          {/* TAB 1: DAILY EXPENSE ENTRY                                        */}
          {/* ================================================================= */}
          {activeTab === 'expense' && (
            <form onSubmit={handleSaveExpense} className="space-y-4">
              {/* Quick Presets for Shop Routine */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9BA8AB] block mb-2">
                  ⚡ 1-Click Common Daily Expenses:
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickExpensePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setExpenseTitle(preset.title);
                        setExpenseCategory(preset.category);
                        setExpenseAmount(String(preset.defaultAmount));
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-[#182B3A] hover:bg-[#253745] text-xs font-semibold text-[#CCD0CF] border border-[#253745] hover:border-emerald-500 flex items-center gap-1.5 transition-all"
                    >
                      <Coffee size={13} className="text-emerald-400" />
                      <span>{preset.title}</span>
                      <span className="text-[10px] text-emerald-400 font-bold">₹{preset.defaultAmount}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-[#9BA8AB] block mb-1">Expense Title / Item:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Evening staff tea & snacks"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    className="w-full bg-[#182B3A] border border-[#253745] rounded-xl px-3 py-2 text-[#CCD0CF] outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#9BA8AB] block mb-1">Amount Spent (₹):</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 150"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full bg-[#182B3A] border border-[#253745] rounded-xl px-3 py-2 text-[#CCD0CF] font-bold text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-[#9BA8AB] block mb-1">Category:</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-[#182B3A] border border-[#253745] rounded-xl px-3 py-2 text-[#CCD0CF] outline-none focus:border-emerald-500"
                  >
                    <option value="Refreshments">Refreshments & Tea</option>
                    <option value="Packaging">Packaging & Shopping Bags</option>
                    <option value="Transport">Transport & Auto / Courier</option>
                    <option value="Maintenance">Shop Cleaning & Maintenance</option>
                    <option value="Electricity">Electricity / Generator Fuel</option>
                    <option value="Shop Rent">Shop Rent</option>
                    <option value="Room Rent">Staff Room Rent</option>
                    <option value="Internet">Internet / Phone</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#9BA8AB] block mb-1">Paid From:</label>
                  <select
                    value={expenseMethod}
                    onChange={(e) => setExpenseMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-[#182B3A] border border-[#253745] rounded-xl px-3 py-2 text-[#CCD0CF] outline-none focus:border-emerald-500"
                  >
                    <option value="Cash">Cash Counter Drawer</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Card">Bank Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#9BA8AB] block mb-1 text-xs">Notes (Optional):</label>
                <input
                  type="text"
                  placeholder="Optional detail or vendor name"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full bg-[#182B3A] border border-[#253745] rounded-xl px-3 py-2 text-[#CCD0CF] text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-emerald-500/20 shadow-md flex items-center gap-2 transition-all active:scale-95"
                >
                  <CheckCircle2 size={16} /> Save Daily Expense
                </button>
              </div>
            </form>
          )}

          {/* ================================================================= */}
          {/* TAB 2: QUICK STOCK INTAKE (PARCEL ARRIVED)                        */}
          {/* ================================================================= */}
          {activeTab === 'stock' && (
            <form onSubmit={handleSaveStock} className="space-y-4">
              <div className="p-3 bg-[#182B3A] rounded-xl border border-[#253745] text-xs text-[#9BA8AB]">
                📦 Record new apparel received today from mills/suppliers to immediately increase stock for billing.
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-[#9BA8AB] block mb-1">
                    Select Apparel Variant Received:
                  </label>
                  <select
                    required
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(Number(e.target.value))}
                    className="w-full bg-[#182B3A] border border-[#253745] rounded-xl px-3 py-2.5 text-[#CCD0CF] outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Choose Product & Size/Color --</option>
                    {variants.map((v) => {
                      const prod = products.find((p) => p.id === v.productId);
                      return (
                        <option key={v.id} value={v.id}>
                          {prod?.name} ({v.size} / {v.color}) — Currently {v.currentStock} in stock — SKU: {v.sku}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#9BA8AB] block mb-1">
                      Quantity Received (+ Pieces):
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={stockAddQty}
                      onChange={(e) => setStockAddQty(Number(e.target.value))}
                      className="w-full bg-[#182B3A] border border-[#253745] rounded-xl px-3 py-2 text-[#CCD0CF] font-bold text-sm outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#9BA8AB] block mb-1">Intake Reason / Note:</label>
                    <input
                      type="text"
                      value={stockReason}
                      onChange={(e) => setStockReason(e.target.value)}
                      placeholder="e.g. Surat parcel delivery"
                      className="w-full bg-[#182B3A] border border-[#253745] rounded-xl px-3 py-2 text-[#CCD0CF] outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedVariantId}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-emerald-500/20 shadow-md flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                >
                  <Boxes size={16} /> Update Inventory Stock
                </button>
              </div>
            </form>
          )}

          {/* ================================================================= */}
          {/* TAB 3: TODAY'S ATTENDANCE QUICK CHECK                             */}
          {/* ================================================================= */}
          {activeTab === 'attendance' && (
            <div className="space-y-3">
              <div className="text-xs text-[#9BA8AB] flex items-center justify-between">
                <span>Mark shift attendance for staff on duty today ({todayStr}):</span>
                <span className="text-emerald-400 font-semibold">{staffList.length} Total Staff</span>
              </div>

              <div className="divide-y divide-[#253745] bg-[#182B3A] rounded-xl border border-[#253745] overflow-hidden">
                {staffList.map((staff) => {
                  const todayRecord = todayAttendance.find((a) => a.staffId === staff.id);
                  const currentStatus = todayRecord?.status || 'Unmarked';

                  return (
                    <div key={staff.id} className="p-3.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#CCD0CF]">{staff.name}</h4>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#11212D] text-emerald-400 border border-[#253745]">
                            {staff.position}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#9BA8AB]">
                          Daily Rate: ₹{Math.round(staff.basicSalary / 30)}/day
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickMarkAttendance(staff.id!, staff.name, 'Present')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            currentStatus === 'Present'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-[#11212D] text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickMarkAttendance(staff.id!, staff.name, 'Half Day')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            currentStatus === 'Half Day'
                              ? 'bg-amber-500 text-white'
                              : 'bg-[#11212D] text-amber-400 hover:bg-amber-500/20'
                          }`}
                        >
                          ½ Cut
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickMarkAttendance(staff.id!, staff.name, 'Absent')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            currentStatus === 'Absent'
                              ? 'bg-rose-600 text-white'
                              : 'bg-[#11212D] text-rose-400 hover:bg-rose-500/20'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: CUSTOMER PRODUCT REQUEST                                  */}
          {/* ================================================================= */}
          {activeTab === 'request' && (
            <form onSubmit={handleSaveCustomerRequest} className="space-y-4 text-xs">
              <div className="p-3 bg-[#182B3A] rounded-xl border border-[#253745] text-[#9BA8AB]">
                💬 Record clothes customer wanted today that are currently out-of-stock or not in store to guide your next purchase.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#9BA8AB] block mb-1">Customer Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh / Walk-in"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full bg-[#182B3A] border border-[#253745] rounded-xl px-3 py-2 text-[#CCD0CF] outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#9BA8AB] block mb-1">Customer Phone:</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98401..."
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full bg-[#182B3A] border border-[#253745] rounded-xl px-3 py-2 text-[#CCD0CF] outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#9BA8AB] block mb-1">Requested Apparel Item:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Washed Black Baggy Jeans / Oversized Anime Tee"
                  value={custProduct}
                  onChange={(e) => setCustProduct(e.target.value)}
                  className="w-full bg-[#182B3A] border border-[#253745] rounded-xl px-3 py-2 text-[#CCD0CF] outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#9BA8AB] block mb-1">Category:</label>
                  <select
                    value={custCategory}
                    onChange={(e) => setCustCategory(e.target.value)}
                    className="w-full bg-[#182B3A] border border-[#253745] rounded-xl px-2 py-2 text-[#CCD0CF] outline-none focus:border-emerald-500"
                  >
                    <option value="Shirts">Shirts</option>
                    <option value="T-Shirts">T-Shirts</option>
                    <option value="Jeans">Jeans</option>
                    <option value="Pants">Pants</option>
                    <option value="Boys Wear">Boys Wear</option>
                    <option value="Jackets">Jackets</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#9BA8AB] block mb-1">Size:</label>
                  <input
                    type="text"
                    value={custSize}
                    onChange={(e) => setCustSize(e.target.value)}
                    placeholder="e.g. 34 / XL"
                    className="w-full bg-[#182B3A] border border-[#253745] rounded-xl px-2 py-2 text-[#CCD0CF] outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#9BA8AB] block mb-1">Color Preference:</label>
                  <input
                    type="text"
                    value={custColor}
                    onChange={(e) => setCustColor(e.target.value)}
                    placeholder="e.g. Washed Black"
                    className="w-full bg-[#182B3A] border border-[#253745] rounded-xl px-2 py-2 text-[#CCD0CF] outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-emerald-500/20 shadow-md flex items-center gap-2 transition-all active:scale-95"
                >
                  <CheckCircle2 size={16} /> Log Customer Request
                </button>
              </div>
            </form>
          )}

          {/* ================================================================= */}
          {/* TAB 5: DAILY CASH RECONCILIATION / DAY CLOSING                    */}
          {/* ================================================================= */}
          {activeTab === 'closing' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#182B3A] rounded-xl border border-[#253745] text-[#9BA8AB]">
                💰 End-of-Day cash reconciliation: compare physical cash in drawer with today's logged transactions.
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-[#182B3A] border border-[#253745]">
                  <span className="text-[10px] text-[#9BA8AB] block">Opening Cash:</span>
                  <input
                    type="number"
                    value={openingCash}
                    onChange={(e) => setOpeningCash(Number(e.target.value) || 0)}
                    className="w-full bg-transparent text-[#CCD0CF] font-bold text-sm outline-none border-b border-[#253745] mt-1"
                  />
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 block">Today's Cash Sales:</span>
                  <p className="text-base font-bold text-emerald-300 mt-1">
                    +{formatCurrency(cashSalesToday)}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                  <span className="text-[10px] text-rose-400 block">Today's Cash Expenses:</span>
                  <p className="text-base font-bold text-rose-300 mt-1">
                    -{formatCurrency(cashExpensesToday)}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 block font-semibold">Expected In Drawer:</span>
                  <p className="text-base font-bold text-emerald-300 mt-1">
                    {formatCurrency(expectedCashInDrawer)}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#182B3A] border border-[#253745] space-y-3">
                <div>
                  <label className="font-bold text-[#CCD0CF] block mb-1">
                    Physical Cash Counted at Closing (₹):
                  </label>
                  <input
                    type="number"
                    placeholder="Enter total cash counted in drawer"
                    value={countedCash || ''}
                    onChange={(e) => setCountedCash(Number(e.target.value) || 0)}
                    className="w-full bg-[#11212D] border border-[#253745] rounded-xl px-3 py-2.5 text-[#CCD0CF] font-bold text-base outline-none focus:border-emerald-500"
                  />
                </div>

                {countedCash > 0 && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between font-bold ${
                      cashDifference === 0
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                        : cashDifference > 0
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                        : 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                    }`}
                  >
                    <span>
                      {cashDifference === 0
                        ? '✓ Perfect Cash Balance'
                        : cashDifference > 0
                        ? 'Cash Surplus (Over)'
                        : 'Cash Shortage (Deficit)'}:
                    </span>
                    <span>
                      {cashDifference > 0 ? `+${formatCurrency(cashDifference)}` : formatCurrency(cashDifference)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#253745] bg-[#06141B] flex items-center justify-between text-xs text-[#9BA8AB]">
          <span>MOCCA Gents & Boys • Daily Operations Hub</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#182B3A] hover:bg-[#253745] text-[#CCD0CF] font-semibold border border-[#253745] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
