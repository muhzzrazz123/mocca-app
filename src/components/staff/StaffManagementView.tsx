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
  Sparkles,
  AlertTriangle,
  Receipt,
  FileText,
  DollarSign,
  Briefcase,
  X,
} from 'lucide-react';

export const StaffManagementView: React.FC = () => {
  const { canViewFinancials, role, currentUser } = useAuth();

  // Active Subtab
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'monthly' | 'salary' | 'directory'>('salary');

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

  // Pay Slip Modal State
  const [activeSlip, setActiveSlip] = useState<SalaryRecord | null>(null);

  // New Staff Modal State
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    phone: '',
    position: 'Sales Staff' as StaffPosition,
    basicSalary: 16000,
    workingHours: '10:00 AM - 09:00 PM',
  });

  // Payment Confirmation Modal State
  const [payingSalaryFor, setPayingSalaryFor] = useState<{
    staff: Staff;
    salaryData: SalaryRecord;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [paymentNotes, setPaymentNotes] = useState('');

  // ----------------------------------------------------
  // ATTENDANCE HELPERS
  // ----------------------------------------------------
  const handleMarkAttendance = async (
    staffId: number,
    staffName: string,
    status: AttendanceStatus
  ) => {
    // Check if attendance already exists for this staff on selectedDate
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
      // Find all attendance records for this staff in selectedMonth
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

      // Calculate Per-Day Wage
      const basicSalary = staff.basicSalary || 0;
      const dailyRate = Math.round(basicSalary / (workingDaysInMonth || 30));

      // Salary Cut calculation for absent and leave days:
      // Absent days: 100% daily rate cut per day
      // Leave days: 100% daily rate cut per day (unpaid leave)
      // Half days: 50% daily rate cut per day
      const attendanceCutAmount = Math.round(
        (absentDays + leaveDays) * dailyRate + halfDays * (dailyRate * 0.5)
      );

      // Base salary earned after attendance salary cut
      const earnedBase = Math.max(0, basicSalary - attendanceCutAmount);

      // Adjustments (Overtime, Bonus, Advance, Other Deductions)
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

      // Check if already paid in DB
      const existingPaidRecord = salaryRecords.find(
        (rec) => rec.staffId === staff.id && rec.month === selectedMonth && rec.status === 'Paid'
      );

      const record: SalaryRecord = {
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
        notes: existingPaidRecord?.notes,
        createdAt: new Date().toISOString(),
      };

      return {
        staff,
        record,
        earnedBase,
        isPaid: !!existingPaidRecord,
      };
    });
  }, [staffList, attendanceList, salaryRecords, selectedMonth, workingDaysInMonth, salaryAdjustments]);

  // Execute Salary Payment
  const handleExecutePayment = async () => {
    if (!payingSalaryFor) return;

    const { staff, salaryData } = payingSalaryFor;

    // 1. Add/Update Salary Record in DB
    const finalRecord: SalaryRecord = {
      ...salaryData,
      status: 'Paid',
      paidAmount: salaryData.finalSalary,
      paymentDate: todayStr,
      paymentMethod,
      notes: paymentNotes || `Salary paid for ${selectedMonth} with attendance cuts applied.`,
      createdAt: new Date().toISOString(),
    };

    const existingRecord = await db.salaryRecords
      .where({ staffId: staff.id!, month: selectedMonth })
      .first();

    if (existingRecord) {
      await db.salaryRecords.update(existingRecord.id!, finalRecord);
    } else {
      await db.salaryRecords.add(finalRecord);
    }

    // 2. Cascade: Add to Expenses so Financial Net Profit & Dashboard update automatically!
    await db.expenses.add({
      title: `Staff Salary: ${staff.name} (${selectedMonth})`,
      category: 'Staff Salary',
      amount: salaryData.finalSalary,
      date: todayStr,
      paymentMethod,
      description: `Basic: ₹${salaryData.basicSalary}, Leave/Absent Cut: -₹${salaryData.attendanceCutAmount} (${salaryData.absentDays + salaryData.leaveDays} days absent, ${salaryData.halfDays} half days), Net Paid: ₹${salaryData.finalSalary}`,
      createdAt: new Date().toISOString(),
    });

    // 3. Add to Audit Log
    await db.auditLogs.add({
      action: 'SALARY_PAID',
      category: 'STAFF',
      details: `Paid ₹${salaryData.finalSalary} to ${staff.name} for ${selectedMonth} via ${paymentMethod} (Attendance cut: ₹${salaryData.attendanceCutAmount}).`,
      user: currentUser?.name || 'Store Owner',
      timestamp: new Date().toISOString(),
    });

    setPayingSalaryFor(null);
    setPaymentNotes('');
  };

  // Add New Staff
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
      createdAt: new Date().toISOString(),
    });

    setIsAddStaffOpen(false);
    setNewStaff({
      name: '',
      phone: '',
      position: 'Sales Staff',
      basicSalary: 16000,
      workingHours: '10:00 AM - 09:00 PM',
    });
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-24">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-mocca-900/80 p-5 rounded-2xl border border-mocca-750">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gold/15 border border-gold/40 flex items-center justify-center text-gold shadow-gold-glow">
            <Briefcase size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-cream font-serif">
              Staff, Attendance & Automated Salary
            </h2>
            <p className="text-xs text-cream-muted">
              Auto-calculate salaries with per-day salary cuts on absent and leave days
            </p>
          </div>
        </div>

        {/* Subtabs Pill Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-mocca-950 p-1.5 rounded-xl border border-mocca-750 text-xs">
          <button
            onClick={() => setActiveSubTab('salary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeSubTab === 'salary'
                ? 'bg-gold text-mocca-950 shadow-gold-glow'
                : 'text-cream-muted hover:text-cream hover:bg-mocca-850'
            }`}
          >
            <IndianRupee size={15} />
            <span>Salary & Attendance Cuts</span>
          </button>

          <button
            onClick={() => setActiveSubTab('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeSubTab === 'daily'
                ? 'bg-gold text-mocca-950 shadow-gold-glow'
                : 'text-cream-muted hover:text-cream hover:bg-mocca-850'
            }`}
          >
            <UserCheck size={15} />
            <span>Daily Attendance</span>
          </button>

          <button
            onClick={() => setActiveSubTab('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeSubTab === 'monthly'
                ? 'bg-gold text-mocca-950 shadow-gold-glow'
                : 'text-cream-muted hover:text-cream hover:bg-mocca-850'
            }`}
          >
            <Calendar size={15} />
            <span>Monthly Sheet</span>
          </button>

          <button
            onClick={() => setActiveSubTab('directory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeSubTab === 'directory'
                ? 'bg-gold text-mocca-950 shadow-gold-glow'
                : 'text-cream-muted hover:text-cream hover:bg-mocca-850'
            }`}
          >
            <Users size={15} />
            <span>Staff Directory ({staffList.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB: SALARY MANAGEMENT & ATTENDANCE CUTS                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'salary' && (
        <div className="space-y-6">
          {/* Controls Bar: Month Picker & Formula Explanation */}
          <div className="bg-mocca-900 p-4 lg:p-5 rounded-2xl border border-mocca-750 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-mocca-400">Payroll Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-mocca-850 border border-mocca-700 text-cream px-3 py-1.5 rounded-xl text-xs font-bold outline-none focus:border-gold"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-mocca-400">Month Working Days:</span>
                <input
                  type="number"
                  min="20"
                  max="31"
                  value={workingDaysInMonth}
                  onChange={(e) => setWorkingDaysInMonth(Number(e.target.value) || 30)}
                  className="bg-mocca-850 border border-mocca-700 text-cream px-2 py-1 rounded-lg text-xs w-16 text-center font-bold outline-none focus:border-gold"
                />
                <span className="text-[11px] text-mocca-400">Days</span>
              </div>
            </div>

            {/* Attendance Cut Formula Banner */}
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs text-rose-300">
              <AlertTriangle size={15} className="shrink-0 text-rose-400" />
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
                      ? 'bg-mocca-900/90 border-emerald-500/30'
                      : 'bg-mocca-900 border-mocca-750 hover:border-gold/50 shadow-lg'
                  }`}
                >
                  {/* Staff Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-mocca-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-cream">{staff.name}</h3>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-mocca-800 text-gold border border-mocca-700">
                          {staff.position}
                        </span>
                      </div>
                      <p className="text-xs text-mocca-400 mt-0.5">{staff.phone}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                          isPaid
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        }`}
                      >
                        {isPaid ? 'PAID' : 'PENDING'}
                      </span>

                      <button
                        onClick={() => setActiveSlip(record)}
                        className="p-1.5 rounded-lg bg-mocca-800 hover:bg-mocca-750 text-cream-muted hover:text-cream border border-mocca-700"
                        title="View Pay Slip"
                      >
                        <FileText size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Salary & Attendance Breakdown Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-b border-mocca-800/80 text-xs">
                    <div className="p-2 rounded-xl bg-mocca-850">
                      <span className="text-[11px] text-mocca-400">Basic Monthly:</span>
                      <p className="text-sm font-bold text-cream">{formatCurrency(staff.basicSalary)}</p>
                      <span className="text-[10px] text-mocca-400">₹{record.dailyRate}/day</span>
                    </div>

                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[11px] text-emerald-400">Present Days:</span>
                      <p className="text-sm font-bold text-emerald-300">
                        {record.presentDays} Days
                      </p>
                      <span className="text-[10px] text-emerald-400/80">
                        {record.halfDays > 0 ? `+ ${record.halfDays} half days` : 'Full shifts'}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
                      <span className="text-[11px] text-rose-400 font-bold">Leave / Absent:</span>
                      <p className="text-sm font-bold text-rose-300">
                        {record.absentDays + record.leaveDays} Days
                      </p>
                      <span className="text-[10px] text-rose-400 font-bold">
                        Salary Cut: -{formatCurrency(record.attendanceCutAmount)}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-gold/10 border border-gold/30">
                      <span className="text-[11px] text-gold font-bold">Earned Base:</span>
                      <p className="text-sm font-bold text-gold">{formatCurrency(earnedBase)}</p>
                      <span className="text-[10px] text-cream-muted">After leave cut</span>
                    </div>
                  </div>

                  {/* Overtime, Bonus, Advance & Deduction Inputs */}
                  <div className="py-3 border-b border-mocca-800/80 space-y-2">
                    <div className="text-[11px] font-semibold text-mocca-400 uppercase tracking-wider">
                      Adjustments & Allowances (₹)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-emerald-400 block mb-1 font-medium">
                          + Overtime (₹)
                        </label>
                        <input
                          type="number"
                          disabled={isPaid}
                          placeholder="0"
                          value={currentAdj.overtime || ''}
                          onChange={(e) => updateAdj('overtime', Number(e.target.value) || 0)}
                          className="w-full bg-mocca-850 border border-mocca-700 rounded-lg px-2 py-1 text-cream text-xs outline-none focus:border-gold disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-emerald-400 block mb-1 font-medium">
                          + Bonus (₹)
                        </label>
                        <input
                          type="number"
                          disabled={isPaid}
                          placeholder="0"
                          value={currentAdj.bonus || ''}
                          onChange={(e) => updateAdj('bonus', Number(e.target.value) || 0)}
                          className="w-full bg-mocca-850 border border-mocca-700 rounded-lg px-2 py-1 text-cream text-xs outline-none focus:border-gold disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-rose-400 block mb-1 font-medium">
                          - Advance Paid (₹)
                        </label>
                        <input
                          type="number"
                          disabled={isPaid}
                          placeholder="0"
                          value={currentAdj.advance || ''}
                          onChange={(e) => updateAdj('advance', Number(e.target.value) || 0)}
                          className="w-full bg-mocca-850 border border-mocca-700 rounded-lg px-2 py-1 text-cream text-xs outline-none focus:border-gold disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-rose-400 block mb-1 font-medium">
                          - Other Deductions (₹)
                        </label>
                        <input
                          type="number"
                          disabled={isPaid}
                          placeholder="0"
                          value={currentAdj.deductions || ''}
                          onChange={(e) => updateAdj('deductions', Number(e.target.value) || 0)}
                          className="w-full bg-mocca-850 border border-mocca-700 rounded-lg px-2 py-1 text-cream text-xs outline-none focus:border-gold disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Final Net Calculation & Actions */}
                  <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] text-mocca-400 block">Final Net Payable:</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-gold">
                          {formatCurrency(record.finalSalary)}
                        </span>
                        {record.attendanceCutAmount > 0 && (
                          <span className="text-[11px] text-rose-400">
                            (Cut applied: -{formatCurrency(record.attendanceCutAmount)})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveSlip(record)}
                        className="px-3 py-1.5 rounded-xl bg-mocca-800 hover:bg-mocca-750 text-cream text-xs font-semibold border border-mocca-700 flex items-center gap-1.5"
                      >
                        <FileText size={14} /> View Slip
                      </button>

                      {!isPaid && (
                        <button
                          onClick={() => setPayingSalaryFor({ staff, salaryData: record })}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-mocca-950 text-xs font-bold shadow-gold-glow flex items-center gap-1.5"
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
      {/* SUBTAB: DAILY ATTENDANCE                                                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'daily' && (
        <div className="space-y-6">
          {/* Date Picker Bar */}
          <div className="bg-mocca-900 p-4 rounded-2xl border border-mocca-750 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-gold" />
              <span className="text-xs font-semibold text-mocca-400">Mark Attendance For Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-mocca-850 border border-mocca-700 text-cream px-3 py-1.5 rounded-xl text-xs font-bold outline-none focus:border-gold cursor-pointer"
              />
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="px-2.5 py-1 rounded-lg bg-mocca-800 text-[11px] font-semibold text-gold border border-mocca-700"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Present
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Half Day
              </span>
              <span className="flex items-center gap-1 text-rose-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Absent (Salary Cut)
              </span>
              <span className="flex items-center gap-1 text-purple-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Leave (Salary Cut)
              </span>
            </div>
          </div>

          {/* Staff Attendance Marking List */}
          <div className="bg-mocca-900 rounded-2xl border border-mocca-750 overflow-hidden shadow-lg divide-y divide-mocca-800">
            {staffList.map((staff) => {
              // Current attendance record for this staff on selectedDate
              const todayAtt = attendanceList.find(
                (a) => a.staffId === staff.id && a.date === selectedDate
              );
              const status: AttendanceStatus | 'Unmarked' = todayAtt?.status || 'Unmarked';

              return (
                <div
                  key={staff.id}
                  className="p-4 lg:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-mocca-850/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center font-bold text-sm shrink-0">
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-cream">{staff.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-mocca-800 text-gold border border-mocca-700 uppercase font-semibold">
                          {staff.position}
                        </span>
                      </div>
                      <p className="text-xs text-mocca-400">
                        {staff.phone} • Basic: {formatCurrency(staff.basicSalary)} (₹
                        {Math.round(staff.basicSalary / 30)}/day)
                      </p>
                    </div>
                  </div>

                  {/* Status Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleMarkAttendance(staff.id!, staff.name, 'Present')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        status === 'Present'
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-mocca-800 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                      }`}
                    >
                      ✓ Present
                    </button>

                    <button
                      onClick={() => handleMarkAttendance(staff.id!, staff.name, 'Half Day')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        status === 'Half Day'
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                          : 'bg-mocca-800 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
                      }`}
                    >
                      ½ Half Day (50% Cut)
                    </button>

                    <button
                      onClick={() => handleMarkAttendance(staff.id!, staff.name, 'Absent')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        status === 'Absent'
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                          : 'bg-mocca-800 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                      }`}
                    >
                      ✕ Absent (1 Day Cut)
                    </button>

                    <button
                      onClick={() => handleMarkAttendance(staff.id!, staff.name, 'Leave')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        status === 'Leave'
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                          : 'bg-mocca-800 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30'
                      }`}
                    >
                      Leave (Salary Cut)
                    </button>

                    <button
                      onClick={() => handleMarkAttendance(staff.id!, staff.name, 'Holiday')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        status === 'Holiday'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-mocca-800 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30'
                      }`}
                    >
                      Holiday (Paid)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB: MONTHLY ATTENDANCE SHEET                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'monthly' && (
        <div className="space-y-4">
          <div className="bg-mocca-900 p-4 rounded-2xl border border-mocca-750 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-gold" />
              <span className="text-xs font-semibold text-mocca-400">View Month Sheet:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-mocca-850 border border-mocca-700 text-cream px-3 py-1.5 rounded-xl text-xs font-bold outline-none focus:border-gold"
              />
            </div>
            <span className="text-xs text-mocca-400">Monthly Day-by-Day Matrix</span>
          </div>

          <div className="bg-mocca-900 rounded-2xl border border-mocca-750 p-5 overflow-x-auto shadow-lg">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-mocca-800 text-mocca-400">
                  <th className="pb-3 pr-4 font-bold uppercase tracking-wider">Staff Name</th>
                  <th className="pb-3 px-2 text-center font-bold">Present</th>
                  <th className="pb-3 px-2 text-center font-bold">Half</th>
                  <th className="pb-3 px-2 text-center font-bold text-rose-400">Absent</th>
                  <th className="pb-3 px-2 text-center font-bold text-purple-400">Leave</th>
                  <th className="pb-3 px-2 text-right font-bold text-rose-400">Salary Cut (₹)</th>
                  <th className="pb-3 px-2 text-right font-bold text-gold">Earned Net (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mocca-800/60">
                {payrollCalculations.map(({ staff, record, earnedBase }) => (
                  <tr key={staff.id} className="hover:bg-mocca-850/40 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="font-bold text-cream">{staff.name}</p>
                      <p className="text-[10px] text-mocca-400">{staff.position}</p>
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-emerald-400">
                      {record.presentDays}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-amber-400">
                      {record.halfDays}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-rose-400">
                      {record.absentDays}
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-purple-400">
                      {record.leaveDays}
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-rose-400">
                      -{formatCurrency(record.attendanceCutAmount)}
                    </td>
                    <td className="py-3 px-2 text-right font-bold text-gold">
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
      {/* SUBTAB: STAFF DIRECTORY                                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cream">
              Active Store Personnel ({staffList.length})
            </h3>
            <button
              onClick={() => setIsAddStaffOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gold hover:bg-gold-light text-mocca-950 text-xs font-bold flex items-center gap-1.5 shadow-gold-glow transition-all"
            >
              <Plus size={16} /> Add New Staff
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className="bg-mocca-900 border border-mocca-750 p-5 rounded-2xl space-y-3 relative group hover:border-gold/50 transition-all shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-cream group-hover:text-gold transition-colors">
                      {staff.name}
                    </h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-mocca-800 text-gold border border-mocca-700">
                      {staff.position}
                    </span>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Active" />
                </div>

                <div className="space-y-1 text-xs text-mocca-400 border-t border-mocca-800/80 pt-2">
                  <p>
                    <strong className="text-cream-muted">Phone:</strong> {staff.phone}
                  </p>
                  <p>
                    <strong className="text-cream-muted">Hours:</strong> {staff.workingHours}
                  </p>
                  <p>
                    <strong className="text-cream-muted">Basic Salary:</strong>{' '}
                    <span className="text-gold font-bold">
                      {formatCurrency(staff.basicSalary)}
                    </span>{' '}
                    (₹{Math.round(staff.basicSalary / 30)}/day)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PAY SALARY CONFIRMATION WITH AUTO EXPENSE LOGGING                 */}
      {/* ========================================================================= */}
      {payingSalaryFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-mocca-900 border border-gold/40 rounded-2xl p-6 shadow-luxury space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-mocca-750">
              <div className="flex items-center gap-2">
                <IndianRupee size={18} className="text-gold" />
                <h3 className="text-base font-bold text-cream font-serif">Confirm Salary Payment</h3>
              </div>
              <button
                onClick={() => setPayingSalaryFor(null)}
                className="text-mocca-400 hover:text-cream"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-mocca-850 space-y-2 border border-mocca-750">
                <div className="flex justify-between">
                  <span className="text-mocca-400">Staff Member:</span>
                  <span className="font-bold text-cream">{payingSalaryFor.staff.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mocca-400">Period:</span>
                  <span className="font-bold text-cream">{selectedMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mocca-400">Basic Monthly:</span>
                  <span className="font-bold text-cream">
                    {formatCurrency(payingSalaryFor.salaryData.basicSalary)}
                  </span>
                </div>
                {payingSalaryFor.salaryData.attendanceCutAmount > 0 && (
                  <div className="flex justify-between text-rose-400 font-bold">
                    <span>
                      Attendance Salary Cut ({payingSalaryFor.salaryData.absentDays + payingSalaryFor.salaryData.leaveDays} days leave/absent):
                    </span>
                    <span>-{formatCurrency(payingSalaryFor.salaryData.attendanceCutAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-mocca-700 text-sm font-bold text-gold">
                  <span>Net Salary Payable:</span>
                  <span>{formatCurrency(payingSalaryFor.salaryData.finalSalary)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-semibold text-cream-muted block mb-1.5">
                  Payment Method:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-mocca-850 border border-mocca-700 rounded-xl px-3 py-2 text-xs text-cream outline-none focus:border-gold"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Cash Counter</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-cream-muted block mb-1.5">
                  Remarks / Transaction ID:
                </label>
                <input
                  type="text"
                  placeholder="Optional reference note"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-mocca-850 border border-mocca-700 rounded-xl px-3 py-2 text-xs text-cream outline-none focus:border-gold"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300">
                ✓ Will automatically record into <strong>Store Operating Expenses</strong> & recalculate Net Profit in real-time.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setPayingSalaryFor(null)}
                className="px-4 py-2 rounded-xl bg-mocca-800 text-cream-muted hover:text-cream text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePayment}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold to-gold-600 hover:from-gold-light hover:to-gold text-mocca-950 text-xs font-bold shadow-gold-glow"
              >
                Confirm & Pay ₹{payingSalaryFor.salaryData.finalSalary}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PROFESSIONAL MOCCA SALARY PAY SLIP                                 */}
      {/* ========================================================================= */}
      {activeSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-mocca-900 border border-gold/40 rounded-2xl p-6 shadow-luxury space-y-4 max-h-[90vh] overflow-y-auto print:border-none print:shadow-none print:p-0">
            {/* Pay Slip Header */}
            <div className="text-center pb-4 border-b border-mocca-750">
              <img
                src="/mocca-logo.png"
                alt="MOCCA"
                className="w-14 h-14 rounded-full mx-auto object-cover ring-1 ring-gold shadow-gold-glow mb-2"
              />
              <h3 className="text-base font-bold text-gold font-serif tracking-wider">
                MOCCA GENTS & BOYS COLLECTIONS
              </h3>
              <p className="text-[11px] uppercase tracking-widest text-cream-muted">
                Staff Salary & Attendance Slip • {activeSlip.month}
              </p>
            </div>

            {/* Staff Details */}
            <div className="grid grid-cols-2 gap-2 text-xs py-2 border-b border-mocca-800">
              <div>
                <span className="text-mocca-400">Employee:</span>
                <p className="font-bold text-cream">{activeSlip.staffName}</p>
              </div>
              <div className="text-right">
                <span className="text-mocca-400">Pay Period:</span>
                <p className="font-bold text-cream">{activeSlip.month}</p>
              </div>
            </div>

            {/* Itemized Attendance & Earnings Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-mocca-850">
                <span className="text-cream-muted">Basic Monthly Salary:</span>
                <span className="font-semibold text-cream">{formatCurrency(activeSlip.basicSalary)}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-mocca-850">
                <span className="text-cream-muted">Daily Rate (÷ {activeSlip.workingDays} days):</span>
                <span className="font-semibold text-cream">₹{activeSlip.dailyRate} / day</span>
              </div>

              <div className="flex justify-between py-1 border-b border-mocca-850 text-emerald-400">
                <span>Present Days:</span>
                <span className="font-bold">{activeSlip.presentDays} Days</span>
              </div>

              {activeSlip.halfDays > 0 && (
                <div className="flex justify-between py-1 border-b border-mocca-850 text-amber-400">
                  <span>Half Days (50% wage):</span>
                  <span>{activeSlip.halfDays} Days</span>
                </div>
              )}

              {/* Attendance Salary Cut Line */}
              <div className="flex justify-between py-1.5 border-b border-mocca-800 text-rose-400 font-bold bg-rose-500/10 px-2 rounded-lg">
                <span>
                  Attendance Cut ({activeSlip.absentDays + activeSlip.leaveDays} days leave/absent):
                </span>
                <span>-{formatCurrency(activeSlip.attendanceCutAmount)}</span>
              </div>

              {activeSlip.overtimeAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-mocca-850 text-emerald-400">
                  <span>+ Overtime Allowance:</span>
                  <span>+{formatCurrency(activeSlip.overtimeAmount)}</span>
                </div>
              )}

              {activeSlip.bonusAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-mocca-850 text-emerald-400">
                  <span>+ Festival / Sales Bonus:</span>
                  <span>+{formatCurrency(activeSlip.bonusAmount)}</span>
                </div>
              )}

              {activeSlip.advanceAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-mocca-850 text-rose-400">
                  <span>- Advance Salary Drawn:</span>
                  <span>-{formatCurrency(activeSlip.advanceAmount)}</span>
                </div>
              )}

              {activeSlip.deductionAmount > 0 && (
                <div className="flex justify-between py-1 border-b border-mocca-850 text-rose-400">
                  <span>- Other Deductions:</span>
                  <span>-{formatCurrency(activeSlip.deductionAmount)}</span>
                </div>
              )}

              {/* Net Payable Total */}
              <div className="flex justify-between py-3 text-base font-bold text-gold border-t-2 border-gold/40">
                <span>Net Salary Payable:</span>
                <span>{formatCurrency(activeSlip.finalSalary)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-mocca-800 flex items-center justify-between no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-mocca-800 text-cream hover:bg-mocca-750 text-xs font-semibold flex items-center gap-2 border border-mocca-700"
              >
                <Printer size={15} /> Print Slip
              </button>

              <button
                onClick={() => setActiveSlip(null)}
                className="px-4 py-2 rounded-xl bg-gold text-mocca-950 font-bold text-xs shadow-gold-glow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW STAFF                                                     */}
      {/* ========================================================================= */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleCreateStaff}
            className="w-full max-w-md bg-mocca-900 border border-gold/40 rounded-2xl p-6 shadow-luxury space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-mocca-750">
              <h3 className="text-base font-bold text-cream font-serif">Add New Staff Member</h3>
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="text-mocca-400 hover:text-cream"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-semibold text-cream-muted block mb-1">
                  Full Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full bg-mocca-850 border border-mocca-700 rounded-xl px-3 py-2 text-xs text-cream outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-cream-muted block mb-1">
                  Phone Number:
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 98401 00000"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full bg-mocca-850 border border-mocca-700 rounded-xl px-3 py-2 text-xs text-cream outline-none focus:border-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-cream-muted block mb-1">
                    Position:
                  </label>
                  <select
                    value={newStaff.position}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, position: e.target.value as StaffPosition })
                    }
                    className="w-full bg-mocca-850 border border-mocca-700 rounded-xl px-3 py-2 text-xs text-cream outline-none focus:border-gold"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Sales Staff">Sales Staff</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Helper">Helper</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-cream-muted block mb-1">
                    Basic Salary (₹/month):
                  </label>
                  <input
                    type="number"
                    required
                    min="5000"
                    value={newStaff.basicSalary}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, basicSalary: Number(e.target.value) })
                    }
                    className="w-full bg-mocca-850 border border-mocca-700 rounded-xl px-3 py-2 text-xs text-cream outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-cream-muted block mb-1">
                  Working Hours:
                </label>
                <input
                  type="text"
                  placeholder="10:00 AM - 09:00 PM"
                  value={newStaff.workingHours}
                  onChange={(e) => setNewStaff({ ...newStaff, workingHours: e.target.value })}
                  className="w-full bg-mocca-850 border border-mocca-700 rounded-xl px-3 py-2 text-xs text-cream outline-none focus:border-gold"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="px-4 py-2 rounded-xl bg-mocca-800 text-cream-muted hover:text-cream text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold to-gold-600 text-mocca-950 text-xs font-bold shadow-gold-glow"
              >
                Save Staff
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
