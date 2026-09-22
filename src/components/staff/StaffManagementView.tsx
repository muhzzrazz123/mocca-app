import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type {
  Staff,
  StaffAttendance,
  AttendanceStatus,
  SalaryRecord,
  StaffPosition,
  PaymentMethod,
} from '../../types';
import {
  UserCheck,
  Calendar,
  IndianRupee,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Printer,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Receipt,
  FileText,
  Briefcase,
  Trash2,
  X,
  Search,
  Edit3,
  ReceiptText,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';

export const StaffManagementView: React.FC = () => {
  const { canViewFinancials, role, currentUser } = useAuth();

  // Active Subtab: salary | invoices | daily | monthly | directory
  const [activeSubTab, setActiveSubTab] = useState<
    'salary' | 'invoices' | 'daily' | 'monthly' | 'directory'
  >('salary');

  // Selected Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Live DB Queries
  const staffList = useLiveQuery(() => db.staff.toArray(), []) || [];
  const attendanceList = useLiveQuery(() => db.attendance.toArray(), []) || [];
  const salaryRecords = useLiveQuery(() => db.salaryRecords.toArray(), []) || [];

  // Working days in selected month (defaults to 30)
  const [workingDaysInMonth, setWorkingDaysInMonth] = useState<number>(30);

  // Overtime / Bonus / Advance state overrides per staff for the month
  const [salaryAdjustments, setSalaryAdjustments] = useState<
    Record<number, { overtime: number; bonus: number; advance: number; deductions: number }>
  >({});

  // Pay Slip / Invoice Modal State
  const [activeSlip, setActiveSlip] = useState<SalaryRecord | null>(null);

  // Add Staff Modal State
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    phone: '',
    position: 'Sales Staff' as StaffPosition,
    basicSalary: 16000,
    workingHours: '10:00 AM - 09:00 PM',
    notes: '',
  });

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Payment Confirmation Modal State
  const [payingSalaryFor, setPayingSalaryFor] = useState<{
    staff: Staff;
    salaryData: SalaryRecord;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Delete Confirmation States
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
  const [deletingSalaryRecord, setDeletingSalaryRecord] = useState<SalaryRecord | null>(null);

  // Invoices Tab Filters
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceMonthFilter, setInvoiceMonthFilter] = useState('ALL');

  // Direct Quick Payment Modal State
  const [isDirectPayOpen, setIsDirectPayOpen] = useState(false);
  const [directPayStaffId, setDirectPayStaffId] = useState<number | ''>('');
  const [directPayAmount, setDirectPayAmount] = useState<number>(0);
  const [directPayBasic, setDirectPayBasic] = useState<number>(0);
  const [directPayMethod, setDirectPayMethod] = useState<PaymentMethod>('Bank Transfer');
  const [directPayRef, setDirectPayRef] = useState('');
  const [directPayNotes, setDirectPayNotes] = useState('');

  // Handle Delete Staff
  const handleConfirmDeleteStaff = async () => {
    if (!deletingStaff?.id) return;
    await db.deleteStaffTransaction(deletingStaff.id, currentUser?.name || 'Mashboob (Store Owner)');
    setDeletingStaff(null);
  };

  // Handle Delete Salary Payment Record
  const handleConfirmDeleteSalaryRecord = async () => {
    if (!deletingSalaryRecord?.id) return;
    await db.deleteSalaryPaymentTransaction(
      deletingSalaryRecord.id,
      currentUser?.name || 'Mashboob (Store Owner)'
    );
    setDeletingSalaryRecord(null);
  };

  // ----------------------------------------------------
  // ATTENDANCE HELPERS
  // ----------------------------------------------------
  const handleMarkAttendance = async (
    staffId: number,
    staffName: string,
    status: AttendanceStatus
  ) => {
    const existing = await db.attendance
      .where({ staffId, date: selectedDate })
      .first();

    if (existing) {
      await db.attendance.update(existing.id!, {
        status,
        checkIn: status === 'Present' || status === 'Half Day' ? (existing.checkIn || '10:00 AM') : undefined,
      });
    } else {
      await db.attendance.add({
        staffId,
        staffName,
        date: selectedDate,
        status,
        checkIn: status === 'Present' || status === 'Half Day' ? '10:00 AM' : undefined,
      });
    }
  };

  // ----------------------------------------------------
  // SALARY & ATTENDANCE CUT CALCULATOR
  // ----------------------------------------------------
  const payrollCalculations = useMemo(() => {
    return staffList.map((staff) => {
      const staffMonthAttendance = attendanceList.filter((att) => {
        return att.staffId === staff.id && att.date.startsWith(selectedMonth);
      });

      let presentDays = 0;
      let halfDays = 0;
      let absentDays = 0;
      let leaveDays = 0;
      let holidayDays = 0;

      staffMonthAttendance.forEach((att) => {
        if (att.status === 'Present') presentDays += 1;
        else if (att.status === 'Half Day') halfDays += 1;
        else if (att.status === 'Absent') absentDays += 1;
        else if (att.status === 'Leave') leaveDays += 1;
        else if (att.status === 'Holiday') holidayDays += 1;
      });

      const basicSalary = staff.basicSalary || 0;
      const dailyRate = Math.round(basicSalary / (workingDaysInMonth || 30));

      const attendanceCutAmount = Math.round(
        (absentDays + leaveDays) * dailyRate + halfDays * (dailyRate * 0.5)
      );

      const earnedBase = Math.max(0, basicSalary - attendanceCutAmount);

      const adj = salaryAdjustments[staff.id!] || {
        overtime: 0,
        bonus: 0,
        advance: 0,
        deductions: 0,
      };

      const finalSalary = Math.max(
        0,
        earnedBase + (adj.overtime || 0) + (adj.bonus || 0) - (adj.advance || 0) - (adj.deductions || 0)
      );

      const existingPaidRecord = salaryRecords.find(
        (rec) => rec.staffId === staff.id && rec.month === selectedMonth && rec.status === 'Paid'
      );

      const record: SalaryRecord = {
        id: existingPaidRecord?.id,
        invoiceNo: existingPaidRecord?.invoiceNo,
        staffId: staff.id!,
        staffName: staff.name,
        month: selectedMonth,
        basicSalary,
        workingDays: workingDaysInMonth,
        presentDays,
        halfDays,
        absentDays,
        leaveDays,
        dailyRate,
        attendanceCutAmount,
        overtimeAmount: adj.overtime || 0,
        bonusAmount: adj.bonus || 0,
        advanceAmount: adj.advance || 0,
        deductionAmount: adj.deductions || 0,
        finalSalary,
        status: existingPaidRecord ? 'Paid' : 'Pending',
        paidAmount: existingPaidRecord ? existingPaidRecord.paidAmount : 0,
        paymentDate: existingPaidRecord?.paymentDate,
        paymentMethod: existingPaidRecord?.paymentMethod,
        transactionRef: existingPaidRecord?.transactionRef,
        paidBy: existingPaidRecord?.paidBy || 'Mashboob (Store Owner)',
        notes: existingPaidRecord?.notes,
        createdAt: existingPaidRecord?.createdAt || new Date().toISOString(),
      };

      return {
        staff,
        record,
        earnedBase,
        isPaid: !!existingPaidRecord,
      };
    });
  }, [staffList, attendanceList, salaryRecords, selectedMonth, workingDaysInMonth, salaryAdjustments]);

  // Execute Salary Payment with auto invoice number and cascade
  const handleExecutePayment = async () => {
    if (!payingSalaryFor) return;

    const { staff, salaryData } = payingSalaryFor;

    const paymentResult = await db.executeSalaryPayment(
      {
        ...salaryData,
        status: 'Paid',
        paidAmount: salaryData.finalSalary,
        paymentDate: todayStr,
        paymentMethod,
        transactionRef: paymentRef,
        notes: paymentNotes || `Salary paid for ${selectedMonth} with attendance cuts applied.`,
        createdAt: new Date().toISOString(),
      },
      currentUser?.name || 'Mashboob (Store Owner)'
    );

    // Automatically pop open official printable invoice voucher!
    const generatedRecord: SalaryRecord = {
      ...salaryData,
      id: paymentResult.id,
      invoiceNo: paymentResult.invoiceNo,
      status: 'Paid',
      paidAmount: salaryData.finalSalary,
      paymentDate: todayStr,
      paymentMethod,
      transactionRef: paymentRef,
      notes: paymentNotes,
      paidBy: currentUser?.name || 'Mashboob (Store Owner)',
      createdAt: new Date().toISOString(),
    };

    setPayingSalaryFor(null);
    setPaymentRef('');
    setPaymentNotes('');
    setActiveSlip(generatedRecord);
  };

  // Create New Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name.trim() || !newStaff.phone.trim()) return;

    await db.staff.add({
      name: newStaff.name.trim(),
      phone: newStaff.phone.trim(),
      position: newStaff.position,
      basicSalary: Number(newStaff.basicSalary),
      workingHours: newStaff.workingHours,
      status: 'Active',
      joiningDate: todayStr,
      notes: newStaff.notes,
      createdAt: new Date().toISOString(),
    });

    setIsAddStaffOpen(false);
    setNewStaff({
      name: '',
      phone: '',
      position: 'Sales Staff',
      basicSalary: 16000,
      workingHours: '10:00 AM - 09:00 PM',
      notes: '',
    });
  };

  // Update Existing Staff
  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editingStaff.id || !editingStaff.name.trim()) return;

    await db.staff.update(editingStaff.id, {
      name: editingStaff.name.trim(),
      phone: editingStaff.phone.trim(),
      position: editingStaff.position,
      basicSalary: Number(editingStaff.basicSalary),
      workingHours: editingStaff.workingHours,
      status: editingStaff.status,
      notes: editingStaff.notes,
    });

    setEditingStaff(null);
  };

  // Direct Quick Payment Execution
  const handleExecuteDirectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPayStaffId) return;

    const staff = staffList.find((s) => s.id === Number(directPayStaffId));
    if (!staff) return;

    const basic = directPayBasic || staff.basicSalary;
    const finalAmount = directPayAmount || basic;

    const paymentResult = await db.executeSalaryPayment(
      {
        staffId: staff.id!,
        staffName: staff.name,
        month: selectedMonth,
        basicSalary: basic,
        workingDays: 30,
        presentDays: 30,
        halfDays: 0,
        absentDays: 0,
        leaveDays: 0,
        dailyRate: Math.round(basic / 30),
        attendanceCutAmount: 0,
        overtimeAmount: 0,
        bonusAmount: 0,
        advanceAmount: 0,
        deductionAmount: 0,
        finalSalary: finalAmount,
        status: 'Paid',
        paidAmount: finalAmount,
        paymentDate: todayStr,
        paymentMethod: directPayMethod,
        transactionRef: directPayRef,
        notes: directPayNotes || `Direct salary disbursement for ${selectedMonth}`,
        createdAt: new Date().toISOString(),
      },
      currentUser?.name || 'Mashboob (Store Owner)'
    );

    setIsDirectPayOpen(false);
    setDirectPayStaffId('');
    setDirectPayAmount(0);
    setDirectPayRef('');
    setDirectPayNotes('');

    // Open voucher
    setActiveSlip({
      id: paymentResult.id,
      invoiceNo: paymentResult.invoiceNo,
      staffId: staff.id!,
      staffName: staff.name,
      month: selectedMonth,
      basicSalary: basic,
      workingDays: 30,
      presentDays: 30,
      halfDays: 0,
      absentDays: 0,
      leaveDays: 0,
      dailyRate: Math.round(basic / 30),
      attendanceCutAmount: 0,
      overtimeAmount: 0,
      bonusAmount: 0,
      advanceAmount: 0,
      deductionAmount: 0,
      finalSalary: finalAmount,
      status: 'Paid',
      paidAmount: finalAmount,
      paymentDate: todayStr,
      paymentMethod: directPayMethod,
      transactionRef: directPayRef,
      notes: directPayNotes,
      paidBy: currentUser?.name || 'Mashboob (Store Owner)',
      createdAt: new Date().toISOString(),
    });
  };

  // Filtered Invoices List
  const filteredInvoices = useMemo(() => {
    return salaryRecords
      .filter((r) => r.status === 'Paid')
      .filter((r) => {
        if (invoiceMonthFilter !== 'ALL' && r.month !== invoiceMonthFilter) return false;
        if (!invoiceSearchQuery.trim()) return true;
        const q = invoiceSearchQuery.toLowerCase();
        return (
          r.staffName.toLowerCase().includes(q) ||
          (r.invoiceNo && r.invoiceNo.toLowerCase().includes(q)) ||
          (r.paymentMethod && r.paymentMethod.toLowerCase().includes(q)) ||
          (r.transactionRef && r.transactionRef.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || ''));
  }, [salaryRecords, invoiceMonthFilter, invoiceSearchQuery]);

  // Aggregate Metrics for Invoices Tab
  const totalSalaryDisbursed = useMemo(() => {
    return salaryRecords
      .filter((r) => r.status === 'Paid')
      .reduce((sum, r) => sum + (r.paidAmount || r.finalSalary || 0), 0);
  }, [salaryRecords]);

  const totalAttendanceCutSavings = useMemo(() => {
    return salaryRecords
      .filter((r) => r.status === 'Paid')
      .reduce((sum, r) => sum + (r.attendanceCutAmount || 0), 0);
  }, [salaryRecords]);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-24 text-[#06141B] dark:text-[#CCD0CF]">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#11212D] p-5 rounded-2xl border border-gray-300 dark:border-[#253745] shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Briefcase size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-[#06141B] dark:text-[#CCD0CF] font-serif">
                Staff, Attendance & Salaries
              </h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40">
                {staffList.length} Active Staff
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-[#9BA8AB]">
              Staff profiles, attendance cuts, salary disbursements & official payment vouchers
            </p>
          </div>
        </div>

        {/* Global Action: + Add Staff Member (Accessible anywhere!) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddStaffOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-emerald-500/20 transition-all active:scale-95"
            title="Add a new staff member name and profile"
          >
            <Plus size={16} />
            <span>+ Add Staff</span>
          </button>
        </div>
      </div>

      {/* Subtabs Pill Switcher */}
      <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 dark:bg-[#06141B] p-1.5 rounded-xl border border-gray-200 dark:border-[#253745] text-xs">
        <button
          onClick={() => setActiveSubTab('salary')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeSubTab === 'salary'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-md'
              : 'text-gray-600 dark:text-[#9BA8AB] hover:text-[#06141B] dark:hover:text-[#CCD0CF] hover:bg-gray-200 dark:hover:bg-[#182B3A]'
          }`}
        >
          <IndianRupee size={15} />
          <span>Salary Calculator</span>
        </button>

        <button
          onClick={() => setActiveSubTab('invoices')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeSubTab === 'invoices'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-md'
              : 'text-gray-600 dark:text-[#9BA8AB] hover:text-[#06141B] dark:hover:text-[#CCD0CF] hover:bg-gray-200 dark:hover:bg-[#182B3A]'
          }`}
        >
          <ReceiptText size={15} />
          <span>Salary Invoices & Payments ({salaryRecords.filter((r) => r.status === 'Paid').length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('daily')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeSubTab === 'daily'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-md'
              : 'text-gray-600 dark:text-[#9BA8AB] hover:text-[#06141B] dark:hover:text-[#CCD0CF] hover:bg-gray-200 dark:hover:bg-[#182B3A]'
          }`}
        >
          <UserCheck size={15} />
          <span>Daily Attendance</span>
        </button>

        <button
          onClick={() => setActiveSubTab('monthly')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeSubTab === 'monthly'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-md'
              : 'text-gray-600 dark:text-[#9BA8AB] hover:text-[#06141B] dark:hover:text-[#CCD0CF] hover:bg-gray-200 dark:hover:bg-[#182B3A]'
          }`}
        >
          <Calendar size={15} />
          <span>Monthly Sheet</span>
        </button>

        <button
          onClick={() => setActiveSubTab('directory')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeSubTab === 'directory'
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-md'
              : 'text-gray-600 dark:text-[#9BA8AB] hover:text-[#06141B] dark:hover:text-[#CCD0CF] hover:bg-gray-200 dark:hover:bg-[#182B3A]'
          }`}
        >
          <Users size={15} />
          <span>Staff Names & Directory ({staffList.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: SALARY INVOICES & PAYMENTS HISTORY (NEW!)                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top KPI Metrics for Invoices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] p-5 rounded-2xl shadow-sm">
              <span className="text-xs text-gray-500 dark:text-[#9BA8AB] font-semibold">Total Salary Disbursed</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(totalSalaryDisbursed)}
              </p>
              <span className="text-[11px] text-gray-400 mt-1 block">Lifetime verified payouts</span>
            </div>

            <div className="bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] p-5 rounded-2xl shadow-sm">
              <span className="text-xs text-gray-500 dark:text-[#9BA8AB] font-semibold">Salary Invoices Issued</span>
              <p className="text-2xl font-black text-[#06141B] dark:text-[#CCD0CF] mt-1">
                {filteredInvoices.length} Vouchers
              </p>
              <span className="text-[11px] text-gray-400 mt-1 block">With official voucher IDs</span>
            </div>

            <div className="bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] p-5 rounded-2xl shadow-sm">
              <span className="text-xs text-gray-500 dark:text-[#9BA8AB] font-semibold">Attendance Cuts Deducted</span>
              <p className="text-2xl font-black text-rose-500 dark:text-rose-400 mt-1">
                {formatCurrency(totalAttendanceCutSavings)}
              </p>
              <span className="text-[11px] text-gray-400 mt-1 block">Store payroll savings</span>
            </div>

            <div className="bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs text-gray-500 dark:text-[#9BA8AB] font-semibold">Quick Payment Action</span>
                <p className="text-xs text-gray-500 dark:text-[#9BA8AB] mt-1">
                  Disburse advance or direct salary
                </p>
              </div>
              <button
                onClick={() => setIsDirectPayOpen(true)}
                className="mt-2 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus size={14} /> + Record Direct Payment
              </button>
            </div>
          </div>

          {/* Filters & Search Bar */}
          <div className="bg-white dark:bg-[#11212D] p-4 rounded-2xl border border-gray-300 dark:border-[#253745] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by staff name, invoice # (SAL-...), or method..."
                  value={invoiceSearchQuery}
                  onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl pl-9 pr-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-[#9BA8AB]">Filter Month:</span>
              <select
                value={invoiceMonthFilter}
                onChange={(e) => setInvoiceMonthFilter(e.target.value)}
                className="bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] text-gray-900 dark:text-[#CCD0CF] px-3 py-1.5 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Months</option>
                <option value="2026-09">September 2026</option>
                <option value="2026-08">August 2026</option>
                <option value="2026-07">July 2026</option>
              </select>
            </div>
          </div>

          {/* Invoices & Payment Ledger Table */}
          <div className="bg-white dark:bg-[#11212D] rounded-2xl border border-gray-300 dark:border-[#253745] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-[#06141B] text-gray-600 dark:text-[#9BA8AB] uppercase tracking-wider font-semibold border-b border-gray-300 dark:border-[#253745]">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4 text-right">Basic Wage</th>
                    <th className="py-3 px-4 text-right">Attendance Cut</th>
                    <th className="py-3 px-4 text-right">Net Paid</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-[#253745]">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-gray-500 dark:text-[#9BA8AB]">
                        <Receipt size={32} className="mx-auto mb-2 text-gray-400" />
                        <p className="font-semibold text-sm">No salary invoices found</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Pay staff from the Salary Calculator or record a direct payment above.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="hover:bg-gray-50 dark:hover:bg-[#182B3A]/60 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {inv.invoiceNo || `SAL-${inv.month.replace('-', '')}-${String(inv.id).padStart(3, '0')}`}
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-[#CCD0CF]">
                          {inv.paymentDate || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#06141B] dark:text-[#CCD0CF] block">
                            {inv.staffName}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-[#CCD0CF] font-medium">
                          {inv.month}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-700 dark:text-[#CCD0CF]">
                          {formatCurrency(inv.basicSalary)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-rose-500">
                          {inv.attendanceCutAmount > 0 ? `-${formatCurrency(inv.attendanceCutAmount)}` : '₹0'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatCurrency(inv.paidAmount || inv.finalSalary)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#182B3A] text-gray-700 dark:text-[#CCD0CF] text-[10px] font-semibold border border-gray-200 dark:border-[#253745]">
                            {inv.paymentMethod || 'Bank Transfer'}
                          </span>
                          {inv.transactionRef && (
                            <span className="block text-[10px] text-gray-400 font-mono truncate max-w-[120px]">
                              {inv.transactionRef}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 font-bold uppercase">
                            <Check size={10} /> Paid
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setActiveSlip(inv)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-emerald-50 dark:bg-[#182B3A] dark:hover:bg-emerald-950/40 text-gray-700 dark:text-[#CCD0CF] hover:text-emerald-600 border border-gray-200 dark:border-[#253745] transition-colors"
                              title="View & Print Official Salary Invoice"
                            >
                              <FileText size={15} />
                            </button>
                            <button
                              onClick={() => setDeletingSalaryRecord(inv)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 dark:bg-[#182B3A] dark:hover:bg-rose-950/40 text-gray-400 hover:text-rose-500 border border-gray-200 dark:border-[#253745] transition-colors"
                              title="Delete / Void Payment Voucher"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: SALARY MANAGEMENT & ATTENDANCE CUTS                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'salary' && (
        <div className="space-y-6">
          {/* Controls Bar: Month Picker & Formula Explanation */}
          <div className="bg-white dark:bg-[#11212D] p-4 lg:p-5 rounded-2xl border border-gray-300 dark:border-[#253745] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-[#9BA8AB]">Payroll Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] text-gray-900 dark:text-[#CCD0CF] px-3 py-1.5 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-[#9BA8AB]">Month Working Days:</span>
                <input
                  type="number"
                  min="20"
                  max="31"
                  value={workingDaysInMonth}
                  onChange={(e) => setWorkingDaysInMonth(Number(e.target.value) || 30)}
                  className="bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] text-gray-900 dark:text-[#CCD0CF] px-2 py-1 rounded-lg text-xs w-16 text-center font-bold outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-gray-500 dark:text-[#9BA8AB]">Days</span>
              </div>
            </div>

            {/* Attendance Cut Formula Banner */}
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs text-rose-600 dark:text-rose-300">
              <AlertTriangle size={15} className="shrink-0 text-rose-500" />
              <span>
                <strong>Attendance Salary Cut Rule Active:</strong> Daily Wage = Basic ÷ Working Days.
                Full day cut for Absent/Leave, half cut for Half Day.
              </span>
            </div>
          </div>

          {/* Salary Records Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {payrollCalculations.map(({ staff, record, earnedBase, isPaid }) => {
              const currentAdj = salaryAdjustments[staff.id!] || {
                overtime: 0,
                bonus: 0,
                advance: 0,
                deductions: 0,
              };

              const updateAdj = (key: 'overtime' | 'bonus' | 'advance' | 'deductions', val: number) => {
                setSalaryAdjustments((prev) => ({
                  ...prev,
                  [staff.id!]: {
                    ...currentAdj,
                    [key]: val,
                  },
                }));
              };

              return (
                <div
                  key={staff.id}
                  className={`rounded-2xl p-5 border transition-all ${
                    isPaid
                      ? 'bg-white/80 dark:bg-[#11212D]/80 border-emerald-500/30 shadow-sm'
                      : 'bg-white dark:bg-[#11212D] border-gray-300 dark:border-[#253745] hover:border-emerald-500/50 shadow-md'
                  }`}
                >
                  {/* Staff Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-gray-200 dark:border-[#253745]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#06141B] dark:text-[#CCD0CF]">{staff.name}</h3>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#182B3A] text-emerald-600 dark:text-emerald-400 border border-gray-200 dark:border-[#253745]">
                          {staff.position}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-[#9BA8AB] mt-0.5">{staff.phone}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                          isPaid
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
                        }`}
                      >
                        {isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </div>
                  </div>

                  {/* Attendance Breakdown Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 border-b border-gray-200 dark:border-[#253745] text-center text-xs">
                    <div className="bg-gray-50 dark:bg-[#182B3A] p-2 rounded-xl border border-gray-200 dark:border-[#253745]">
                      <span className="text-[10px] text-gray-500 dark:text-[#9BA8AB] block">Present</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                        {record.presentDays} Days
                      </strong>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#182B3A] p-2 rounded-xl border border-gray-200 dark:border-[#253745]">
                      <span className="text-[10px] text-gray-500 dark:text-[#9BA8AB] block">Half Days</span>
                      <strong className="text-amber-600 dark:text-amber-400 text-sm font-bold">
                        {record.halfDays} Days
                      </strong>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#182B3A] p-2 rounded-xl border border-gray-200 dark:border-[#253745]">
                      <span className="text-[10px] text-gray-500 dark:text-[#9BA8AB] block">Leaves</span>
                      <strong className="text-purple-600 dark:text-purple-400 text-sm font-bold">
                        {record.leaveDays} Days
                      </strong>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#182B3A] p-2 rounded-xl border border-gray-200 dark:border-[#253745]">
                      <span className="text-[10px] text-gray-500 dark:text-[#9BA8AB] block">Absent</span>
                      <strong className="text-rose-600 dark:text-rose-400 text-sm font-bold">
                        {record.absentDays} Days
                      </strong>
                    </div>
                  </div>

                  {/* Wage Calculation Formula Details */}
                  <div className="py-3 space-y-2 border-b border-gray-200 dark:border-[#253745] text-xs">
                    <div className="flex justify-between items-center text-gray-600 dark:text-[#CCD0CF]">
                      <span>Basic Monthly Salary:</span>
                      <span className="font-semibold">{formatCurrency(staff.basicSalary)}</span>
                    </div>

                    <div className="flex justify-between items-center text-gray-600 dark:text-[#CCD0CF]">
                      <span>Daily Wage Rate (Basic ÷ {workingDaysInMonth}):</span>
                      <span className="font-semibold">₹{record.dailyRate}/day</span>
                    </div>

                    {record.attendanceCutAmount > 0 && (
                      <div className="flex justify-between items-center text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-2 py-1 rounded-lg">
                        <span>
                          Attendance Salary Cut ({record.absentDays + record.leaveDays} full days + {record.halfDays} half days):
                        </span>
                        <span>-{formatCurrency(record.attendanceCutAmount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Overtime, Bonus, Advance Adjustments */}
                  <div className="py-3 border-b border-gray-200 dark:border-[#253745] space-y-2">
                    <div className="text-[11px] font-semibold text-gray-500 dark:text-[#9BA8AB] uppercase tracking-wider">
                      Adjustments & Allowances (₹)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-emerald-600 dark:text-emerald-400 block mb-1 font-medium">
                          + Overtime (₹)
                        </label>
                        <input
                          type="number"
                          disabled={isPaid}
                          placeholder="0"
                          value={currentAdj.overtime || ''}
                          onChange={(e) => updateAdj('overtime', Number(e.target.value) || 0)}
                          className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-lg px-2 py-1 text-gray-900 dark:text-[#CCD0CF] text-xs outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-emerald-600 dark:text-emerald-400 block mb-1 font-medium">
                          + Bonus (₹)
                        </label>
                        <input
                          type="number"
                          disabled={isPaid}
                          placeholder="0"
                          value={currentAdj.bonus || ''}
                          onChange={(e) => updateAdj('bonus', Number(e.target.value) || 0)}
                          className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-lg px-2 py-1 text-gray-900 dark:text-[#CCD0CF] text-xs outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-rose-600 dark:text-rose-400 block mb-1 font-medium">
                          - Advance Paid (₹)
                        </label>
                        <input
                          type="number"
                          disabled={isPaid}
                          placeholder="0"
                          value={currentAdj.advance || ''}
                          onChange={(e) => updateAdj('advance', Number(e.target.value) || 0)}
                          className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-lg px-2 py-1 text-gray-900 dark:text-[#CCD0CF] text-xs outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-rose-600 dark:text-rose-400 block mb-1 font-medium">
                          - Deductions (₹)
                        </label>
                        <input
                          type="number"
                          disabled={isPaid}
                          placeholder="0"
                          value={currentAdj.deductions || ''}
                          onChange={(e) => updateAdj('deductions', Number(e.target.value) || 0)}
                          className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-lg px-2 py-1 text-gray-900 dark:text-[#CCD0CF] text-xs outline-none focus:border-emerald-500 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Final Net Calculation & Actions */}
                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-gray-500 dark:text-[#9BA8AB] block">Final Net Payable:</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(record.finalSalary)}
                        </span>
                        {record.attendanceCutAmount > 0 && (
                          <span className="text-[11px] text-rose-600 dark:text-rose-400">
                            (Cut applied: -{formatCurrency(record.attendanceCutAmount)})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveSlip(record)}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#182B3A] hover:bg-gray-200 dark:hover:bg-[#253745] text-gray-700 dark:text-[#CCD0CF] text-xs font-semibold border border-gray-200 dark:border-[#253745] flex items-center gap-1.5"
                      >
                        <FileText size={14} /> View Invoice
                      </button>

                      {!isPaid && (
                        <button
                          onClick={() => setPayingSalaryFor({ staff, salaryData: record })}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={15} /> Pay Salary
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: DAILY ATTENDANCE                                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'daily' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#11212D] p-4 rounded-2xl border border-gray-300 dark:border-[#253745] flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-emerald-500" />
              <span className="text-xs font-semibold text-gray-500 dark:text-[#9BA8AB]">Mark Attendance For Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] text-gray-900 dark:text-[#CCD0CF] px-3 py-1.5 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 cursor-pointer"
              />
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#182B3A] text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-gray-200 dark:border-[#253745] hover:bg-gray-200 dark:hover:bg-[#253745]"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Present
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Half Day
              </span>
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Absent (Salary Cut)
              </span>
              <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Leave (Salary Cut)
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#11212D] rounded-2xl border border-gray-300 dark:border-[#253745] overflow-hidden shadow-md divide-y divide-gray-200 dark:divide-[#253745]">
            {staffList.map((staff) => {
              const todayAtt = attendanceList.find(
                (a) => a.staffId === staff.id && a.date === selectedDate
              );
              const status: AttendanceStatus | 'Unmarked' = todayAtt?.status || 'Unmarked';

              return (
                <div
                  key={staff.id}
                  className="p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-[#182B3A]/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-[#06141B] dark:text-[#CCD0CF]">{staff.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#182B3A] text-emerald-600 dark:text-emerald-400 border border-gray-200 dark:border-[#253745] uppercase font-semibold">
                          {staff.position}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-[#9BA8AB]">
                        {staff.phone} • Basic: {formatCurrency(staff.basicSalary)} (₹
                        {Math.round(staff.basicSalary / 30)}/day)
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleMarkAttendance(staff.id!, staff.name, 'Present')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        status === 'Present'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-[#182B3A] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-gray-200 dark:border-[#253745]'
                      }`}
                    >
                      ✓ Present
                    </button>

                    <button
                      onClick={() => handleMarkAttendance(staff.id!, staff.name, 'Half Day')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        status === 'Half Day'
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-[#182B3A] text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-gray-200 dark:border-[#253745]'
                      }`}
                    >
                      ½ Half Day (50% Cut)
                    </button>

                    <button
                      onClick={() => handleMarkAttendance(staff.id!, staff.name, 'Absent')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        status === 'Absent'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-[#182B3A] text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-gray-200 dark:border-[#253745]'
                      }`}
                    >
                      ✗ Absent (100% Cut)
                    </button>

                    <button
                      onClick={() => handleMarkAttendance(staff.id!, staff.name, 'Leave')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        status === 'Leave'
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-[#182B3A] text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 border border-gray-200 dark:border-[#253745]'
                      }`}
                    >
                      Leave (Unpaid)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 4: MONTHLY SHEET                                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'monthly' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#11212D] p-4 rounded-2xl border border-gray-300 dark:border-[#253745] flex items-center justify-between shadow-sm">
            <span className="text-xs font-semibold text-gray-500 dark:text-[#9BA8AB]">Select Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] text-gray-900 dark:text-[#CCD0CF] px-3 py-1.5 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
            />
          </div>

          <div className="bg-white dark:bg-[#11212D] rounded-2xl border border-gray-300 dark:border-[#253745] overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 dark:bg-[#06141B] text-gray-600 dark:text-[#9BA8AB] uppercase tracking-wider font-semibold border-b border-gray-300 dark:border-[#253745]">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Present</th>
                  <th className="py-3 px-4 text-center">Half Day</th>
                  <th className="py-3 px-4 text-center">Leave</th>
                  <th className="py-3 px-4 text-center">Absent</th>
                  <th className="py-3 px-4 text-right">Attendance Cut</th>
                  <th className="py-3 px-4 text-right">Calculated Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-[#253745]">
                {payrollCalculations.map(({ staff, record }) => (
                  <tr key={staff.id} className="hover:bg-gray-50 dark:hover:bg-[#182B3A]/50">
                    <td className="py-3 px-4 font-bold text-[#06141B] dark:text-[#CCD0CF]">{staff.name}</td>
                    <td className="py-3 px-4 text-gray-500">{staff.position}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{record.presentDays}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-500">{record.halfDays}</td>
                    <td className="py-3 px-4 text-center font-bold text-purple-500">{record.leaveDays}</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-500">{record.absentDays}</td>
                    <td className="py-3 px-4 text-right text-rose-500 font-bold">
                      {record.attendanceCutAmount > 0 ? `-${formatCurrency(record.attendanceCutAmount)}` : '₹0'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 text-sm">
                      {formatCurrency(record.finalSalary)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 5: STAFF DIRECTORY & NAME MANAGEMENT                              */}
      {/* ========================================================================= */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#06141B] dark:text-[#CCD0CF]">
              Active Store Personnel ({staffList.length})
            </h3>
            <button
              onClick={() => setIsAddStaffOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-emerald-500/20 transition-all"
            >
              <Plus size={16} /> Add New Staff Name
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className="bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] p-5 rounded-2xl space-y-3 relative group hover:border-emerald-500/50 transition-all shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-[#06141B] dark:text-[#CCD0CF] group-hover:text-emerald-500 transition-colors">
                      {staff.name}
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#182B3A] text-emerald-600 dark:text-emerald-400 border border-gray-200 dark:border-[#253745]">
                      {staff.position}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Edit Staff Button */}
                    <button
                      onClick={() => setEditingStaff(staff)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-[#182B3A] transition-colors"
                      title="Edit Staff Name / Details"
                    >
                      <Edit3 size={15} />
                    </button>
                    {/* Delete Staff Button */}
                    <button
                      onClick={() => setDeletingStaff(staff)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-[#182B3A] transition-colors"
                      title="Delete Staff Member"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-gray-500 dark:text-[#9BA8AB] border-t border-gray-200 dark:border-[#253745] pt-2">
                  <p>
                    <strong className="text-gray-700 dark:text-[#CCD0CF]">Phone:</strong> {staff.phone}
                  </p>
                  <p>
                    <strong className="text-gray-700 dark:text-[#CCD0CF]">Hours:</strong> {staff.workingHours}
                  </p>
                  <p>
                    <strong className="text-gray-700 dark:text-[#CCD0CF]">Basic Salary:</strong>{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {formatCurrency(staff.basicSalary)}
                    </span>{' '}
                    (₹{Math.round(staff.basicSalary / 30)}/day)
                  </p>
                  {staff.notes && (
                    <p className="text-[11px] text-gray-400 italic">
                      Note: {staff.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PAY SALARY CONFIRMATION & AUTO INVOICE GENERATION                  */}
      {/* ========================================================================= */}
      {payingSalaryFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-[#253745]">
              <div className="flex items-center gap-2">
                <IndianRupee size={18} className="text-emerald-500" />
                <h3 className="text-base font-bold text-[#06141B] dark:text-[#CCD0CF] font-serif">
                  Disburse Salary & Issue Invoice
                </h3>
              </div>
              <button
                onClick={() => setPayingSalaryFor(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-[#CCD0CF]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#182B3A] space-y-2 border border-gray-200 dark:border-[#253745]">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-[#9BA8AB]">Staff Member:</span>
                  <span className="font-bold text-[#06141B] dark:text-[#CCD0CF]">{payingSalaryFor.staff.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-[#9BA8AB]">Period:</span>
                  <span className="font-bold text-[#06141B] dark:text-[#CCD0CF]">{selectedMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-[#9BA8AB]">Basic Monthly:</span>
                  <span className="font-bold text-[#06141B] dark:text-[#CCD0CF]">
                    {formatCurrency(payingSalaryFor.salaryData.basicSalary)}
                  </span>
                </div>
                {payingSalaryFor.salaryData.attendanceCutAmount > 0 && (
                  <div className="flex justify-between text-rose-500 dark:text-rose-400 font-bold">
                    <span>
                      Attendance Salary Cut ({payingSalaryFor.salaryData.absentDays + payingSalaryFor.salaryData.leaveDays} days leave/absent):
                    </span>
                    <span>-{formatCurrency(payingSalaryFor.salaryData.attendanceCutAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-[#253745] text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Net Salary Payable:</span>
                  <span>{formatCurrency(payingSalaryFor.salaryData.finalSalary)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1.5">
                  Payment Method:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Cash Counter</option>
                </select>
              </div>

              {/* Reference ID */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1.5">
                  Transaction / UTR Reference ID:
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI-9840293847 or Cheque #123"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1.5">
                  Remarks / Notes:
                </label>
                <input
                  type="text"
                  placeholder="Optional note"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-700 dark:text-emerald-300">
                ✓ Auto-generates official <strong>Salary Invoice</strong> & updates <strong>Store Expenses</strong>.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setPayingSalaryFor(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#253745] text-gray-700 dark:text-[#CCD0CF] hover:bg-gray-200 dark:hover:bg-[#182B3A] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePayment}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold shadow-md"
              >
                Confirm & Issue Invoice (₹{payingSalaryFor.salaryData.finalSalary})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DIRECT QUICK SALARY DISBURSEMENT                                   */}
      {/* ========================================================================= */}
      {isDirectPayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleExecuteDirectPayment}
            className="w-full max-w-md bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-[#253745]">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-emerald-500" />
                <h3 className="text-base font-bold text-[#06141B] dark:text-[#CCD0CF] font-serif">
                  Record Direct Salary Payment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDirectPayOpen(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-[#CCD0CF]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1">
                  Select Staff Member:
                </label>
                <select
                  required
                  value={directPayStaffId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setDirectPayStaffId(id);
                    const s = staffList.find((st) => st.id === id);
                    if (s) {
                      setDirectPayBasic(s.basicSalary);
                      setDirectPayAmount(s.basicSalary);
                    }
                  }}
                  className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Staff --</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.position}) — Basic: ₹{s.basicSalary}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1">
                  Payment Amount (₹):
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  value={directPayAmount || ''}
                  onChange={(e) => setDirectPayAmount(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] font-bold text-emerald-600 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1">
                    Payment Method:
                  </label>
                  <select
                    value={directPayMethod}
                    onChange={(e) => setDirectPayMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1">
                    Reference / UTR:
                  </label>
                  <input
                    type="text"
                    placeholder="Optional UTR"
                    value={directPayRef}
                    onChange={(e) => setDirectPayRef(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1">
                  Notes / Description:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Advance settlement or full salary"
                  value={directPayNotes}
                  onChange={(e) => setDirectPayNotes(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDirectPayOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#253745] text-gray-700 dark:text-[#CCD0CF] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
              >
                Disburse & Generate Invoice
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: OFFICIAL MOCCA SALARY INVOICE & DISBURSEMENT VOUCHER               */}
      {/* ========================================================================= */}
      {activeSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white print:text-black">
            {/* Voucher Official Header */}
            <div className="text-center pb-4 border-b border-gray-200 dark:border-[#253745] relative">
              <img
                src="/mocca-logo.png"
                alt="MOCCA"
                className="w-14 h-14 rounded-full mx-auto object-cover ring-2 ring-emerald-500 shadow-md mb-2"
              />
              <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-serif tracking-wider">
                MOCCA GENTS & BOYS COLLECTIONS
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-[#9BA8AB] uppercase tracking-widest mt-0.5">
                Luxury Apparel & Formal Wear • Store Owner: Mashboob
              </p>
              <div className="mt-2 inline-block px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                Staff Salary Invoice & Disbursement Voucher
              </div>
            </div>

            {/* Voucher Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-gray-50 dark:bg-[#182B3A] border border-gray-200 dark:border-[#253745] text-xs">
              <div>
                <span className="text-[10px] text-gray-500 dark:text-[#9BA8AB] block">Voucher / Invoice #:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {activeSlip.invoiceNo || `SAL-${activeSlip.month.replace('-', '')}-${String(activeSlip.id || 1).padStart(3, '0')}`}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 dark:text-[#9BA8AB] block">Date of Issue:</span>
                <span className="font-bold text-[#06141B] dark:text-[#CCD0CF]">
                  {activeSlip.paymentDate || todayStr}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 dark:text-[#9BA8AB] block">Payment Method:</span>
                <span className="font-bold text-[#06141B] dark:text-[#CCD0CF]">
                  {activeSlip.paymentMethod || 'Bank Transfer'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 dark:text-[#9BA8AB] block">Status:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  ✓ {activeSlip.status}
                </span>
              </div>
            </div>

            {/* Employee Information */}
            <div className="grid grid-cols-2 gap-2 text-xs py-2 border-b border-gray-200 dark:border-[#253745]">
              <div>
                <span className="text-gray-500 dark:text-[#9BA8AB]">Employee Name:</span>
                <p className="font-bold text-base text-[#06141B] dark:text-[#CCD0CF]">{activeSlip.staffName}</p>
                {activeSlip.transactionRef && (
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    UTR/Ref: {activeSlip.transactionRef}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-gray-500 dark:text-[#9BA8AB]">Pay Period / Month:</span>
                <p className="font-bold text-[#06141B] dark:text-[#CCD0CF]">{activeSlip.month}</p>
                <p className="text-[10px] text-gray-400">Disbursed by: {activeSlip.paidBy || 'Mashboob'}</p>
              </div>
            </div>

            {/* Itemized Attendance & Earnings Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-[#253745]">
                <span className="text-gray-500 dark:text-[#9BA8AB]">Basic Monthly Salary:</span>
                <span className="font-semibold text-[#06141B] dark:text-[#CCD0CF]">{formatCurrency(activeSlip.basicSalary)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-[#253745]">
                <span className="text-gray-500 dark:text-[#9BA8AB]">Daily Rate (÷ {activeSlip.workingDays || 30} days):</span>
                <span className="font-semibold text-[#06141B] dark:text-[#CCD0CF]">₹{activeSlip.dailyRate} / day</span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-[#253745] text-emerald-600 dark:text-emerald-400">
                <span>Working Days Attended (Present):</span>
                <span className="font-bold">{activeSlip.presentDays} Days</span>
              </div>

              {activeSlip.halfDays > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-200 dark:border-[#253745] text-amber-600 dark:text-amber-400">
                  <span>Half Days (50% wage applied):</span>
                  <span>{activeSlip.halfDays} Days</span>
                </div>
              )}

              {/* Attendance Salary Cut Line */}
              <div className="flex justify-between py-1.5 border-b border-gray-200 dark:border-[#253745] text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-2 rounded-lg">
                <span>
                  Attendance Cut ({activeSlip.absentDays + activeSlip.leaveDays} days absent/leaves):
                </span>
                <span>-{formatCurrency(activeSlip.attendanceCutAmount)}</span>
              </div>

              {activeSlip.overtimeAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-200 dark:border-[#253745] text-emerald-600 dark:text-emerald-400">
                  <span>+ Overtime Allowance:</span>
                  <span>+{formatCurrency(activeSlip.overtimeAmount)}</span>
                </div>
              )}

              {activeSlip.bonusAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-200 dark:border-[#253745] text-emerald-600 dark:text-emerald-400">
                  <span>+ Festival / Sales Bonus:</span>
                  <span>+{formatCurrency(activeSlip.bonusAmount)}</span>
                </div>
              )}

              {activeSlip.advanceAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-200 dark:border-[#253745] text-rose-600 dark:text-rose-400">
                  <span>- Advance Salary Drawn:</span>
                  <span>-{formatCurrency(activeSlip.advanceAmount)}</span>
                </div>
              )}

              {activeSlip.deductionAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-gray-200 dark:border-[#253745] text-rose-600 dark:text-rose-400">
                  <span>- Other Deductions:</span>
                  <span>-{formatCurrency(activeSlip.deductionAmount)}</span>
                </div>
              )}

              {/* Net Disbursed Box */}
              <div className="flex justify-between items-center py-3 text-base font-bold text-emerald-600 dark:text-emerald-400 border-t-2 border-emerald-500/40 bg-emerald-500/10 px-3 rounded-xl mt-2">
                <span>Net Salary Disbursed:</span>
                <span className="text-xl font-black">{formatCurrency(activeSlip.finalSalary || activeSlip.paidAmount)}</span>
              </div>

              {activeSlip.notes && (
                <p className="text-[11px] text-gray-500 italic pt-1">
                  Note: {activeSlip.notes}
                </p>
              )}
            </div>

            {/* Official Signatures Box for Print */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs text-gray-600 dark:text-[#9BA8AB] border-t border-gray-200 dark:border-[#253745]">
              <div>
                <div className="border-b border-gray-400 dark:border-gray-600 pb-1 mb-1 font-bold text-[#06141B] dark:text-[#CCD0CF]">
                  Mashboob (Store Owner)
                </div>
                <span className="text-[10px]">Authorized Signatory</span>
              </div>
              <div>
                <div className="border-b border-gray-400 dark:border-gray-600 pb-1 mb-1 font-bold text-[#06141B] dark:text-[#CCD0CF]">
                  {activeSlip.staffName}
                </div>
                <span className="text-[10px]">Employee Signature</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-gray-200 dark:border-[#253745] flex items-center justify-between no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#182B3A] text-[#06141B] dark:text-[#CCD0CF] hover:bg-gray-200 dark:hover:bg-[#253745] text-xs font-semibold flex items-center gap-2 border border-gray-300 dark:border-[#253745]"
              >
                <Printer size={15} /> Print Official Invoice
              </button>

              <button
                onClick={() => setActiveSlip(null)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW STAFF MEMBER NAME                                         */}
      {/* ========================================================================= */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleCreateStaff}
            className="w-full max-w-md bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-[#253745]">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-emerald-500" />
                <h3 className="text-base font-bold text-[#06141B] dark:text-[#CCD0CF] font-serif">
                  Add New Staff Member
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-[#CCD0CF]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1">
                  Full Name of Staff:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arun Kumar, Vignesh, Karthik"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1">
                  Phone Number:
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 98401 00000"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1">
                    Position / Role:
                  </label>
                  <select
                    value={newStaff.position}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, position: e.target.value as StaffPosition })
                    }
                    className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                  >
                    <option value="Sales Staff">Sales Staff</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Manager">Manager</option>
                    <option value="Helper">Helper</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1">
                    Basic Salary (₹/month):
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={newStaff.basicSalary}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, basicSalary: Number(e.target.value) })
                    }
                    className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1">
                  Working Hours:
                </label>
                <input
                  type="text"
                  placeholder="10:00 AM - 09:00 PM"
                  value={newStaff.workingHours}
                  onChange={(e) => setNewStaff({ ...newStaff, workingHours: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1">
                  Additional Notes (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. In charge of men shirts section"
                  value={newStaff.notes}
                  onChange={(e) => setNewStaff({ ...newStaff, notes: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#253745] text-gray-700 dark:text-[#CCD0CF] hover:bg-gray-200 dark:hover:bg-[#182B3A] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
              >
                Save Staff Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT STAFF DETAILS                                                */}
      {/* ========================================================================= */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleUpdateStaff}
            className="w-full max-w-md bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-[#253745]">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-emerald-500" />
                <h3 className="text-base font-bold text-[#06141B] dark:text-[#CCD0CF] font-serif">
                  Edit Staff: {editingStaff.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-[#CCD0CF]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1">
                  Full Name:
                </label>
                <input
                  type="text"
                  required
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1">
                  Phone Number:
                </label>
                <input
                  type="text"
                  required
                  value={editingStaff.phone}
                  onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1">
                    Position:
                  </label>
                  <select
                    value={editingStaff.position}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, position: e.target.value as StaffPosition })
                    }
                    className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                  >
                    <option value="Sales Staff">Sales Staff</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Manager">Manager</option>
                    <option value="Helper">Helper</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1">
                    Basic Salary (₹/month):
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={editingStaff.basicSalary}
                    onChange={(e) =>
                      setEditingStaff({ ...editingStaff, basicSalary: Number(e.target.value) })
                    }
                    className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1">
                  Working Hours:
                </label>
                <input
                  type="text"
                  value={editingStaff.workingHours}
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, workingHours: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-[#CCD0CF] block mb-1">
                  Status:
                </label>
                <select
                  value={editingStaff.status}
                  onChange={(e) =>
                    setEditingStaff({ ...editingStaff, status: e.target.value as any })
                  }
                  className="w-full bg-gray-50 dark:bg-[#182B3A] border border-gray-300 dark:border-[#253745] rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-[#CCD0CF] outline-none focus:border-emerald-500"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#253745] text-gray-700 dark:text-[#CCD0CF] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Staff Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingStaff}
        title={`Delete Staff Member: ${deletingStaff?.name}`}
        message={`Are you sure you want to remove ${deletingStaff?.name} (${deletingStaff?.position}) from the system? All associated attendance records and historical salary slips for this employee will also be removed.`}
        confirmText="Yes, Delete Staff"
        onConfirm={handleConfirmDeleteStaff}
        onCancel={() => setDeletingStaff(null)}
      />

      {/* Delete Salary Payment Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deletingSalaryRecord}
        title={`Delete Salary Invoice: ${deletingSalaryRecord?.invoiceNo || `#${deletingSalaryRecord?.id}`}`}
        message={`Are you sure you want to void this salary payment of ₹${deletingSalaryRecord?.finalSalary || deletingSalaryRecord?.paidAmount} for ${deletingSalaryRecord?.staffName}? This will automatically remove the corresponding entry from Store Expenses and recalculate Net Profit.`}
        confirmText="Yes, Void Payment"
        onConfirm={handleConfirmDeleteSalaryRecord}
        onCancel={() => setDeletingSalaryRecord(null)}
      />
    </div>
  );
};
