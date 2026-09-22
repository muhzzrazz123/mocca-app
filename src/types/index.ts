// Role-Based Access Control
export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER';

export interface User {
  id?: number;
  username: string;
  name: string;
  role: UserRole;
  pin: string;
  avatar?: string;
  createdAt: string;
}

export type StaffPosition = 'Manager' | 'Sales Staff' | 'Cashier' | 'Helper' | 'Other';
export type StaffStatus = 'Active' | 'On Leave' | 'Inactive';

export interface Staff {
  id?: number;
  name: string;
  phone: string;
  position: StaffPosition;
  joiningDate: string;
  basicSalary: number;
  workingHours: string;
  status: StaffStatus;
  notes?: string;
  createdAt: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Half Day' | 'Leave' | 'Holiday';

export interface StaffAttendance {
  id?: number;
  staffId: number;
  staffName: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

export type SalaryStatus = 'Pending' | 'Partially Paid' | 'Paid';

export interface SalaryRecord {
  id?: number;
  invoiceNo?: string; // e.g. SAL-202609-001
  staffId: number;
  staffName: string;
  month: string; // YYYY-MM
  basicSalary: number;
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  absentDays: number;
  halfDays: number;
  dailyRate: number;
  attendanceCutAmount: number; // Salary cut due to leave/absent days
  overtimeAmount: number;
  bonusAmount: number;
  advanceAmount: number;
  deductionAmount: number;
  finalSalary: number;
  status: SalaryStatus;
  paidAmount: number;
  paymentDate?: string;
  paymentMethod?: string;
  transactionRef?: string;
  paidBy?: string;
  notes?: string;
  createdAt: string;
}

// Catalog & Inventory
export interface Category {
  id?: number;
  name: string;
  description?: string;
  itemCount?: number;
}

export interface Brand {
  id?: number;
  name: string;
}

export interface Supplier {
  id?: number;
  name: string;
  phone: string;
  address: string;
  contactPerson: string;
  notes?: string;
  balanceDue: number;
  createdAt: string;
}

export interface ProductVariant {
  id?: number;
  productId: number;
  sku: string;
  barcode: string;
  size: string; // e.g., 'S', 'M', 'L', 'XL', 'XXL', '30', '32', '34'
  color: string; // e.g., 'Black', 'White', 'Navy', 'Olive'
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockLevel: number;
}

export interface Product {
  id?: number;
  name: string;
  sku: string;
  barcode: string;
  categoryId: number;
  categoryName: string;
  brand: string;
  imageUrl?: string;
  description?: string;
  supplierId?: number;
  supplierName?: string;
  minStockLevel: number;
  isActive: boolean;
  createdAt: string;
  // Variants attached or queried
  variants?: ProductVariant[];
}

export type InventoryMovementAction = 
  | 'INITIAL'
  | 'PURCHASE'
  | 'SALE'
  | 'RETURN'
  | 'ADJUSTMENT'
  | 'DAMAGE'
  | 'LOST';

export interface InventoryMovement {
  id?: number;
  date: string;
  productId: number;
  productName: string;
  variantId?: number;
  variantInfo: string; // e.g. "Size 32 / Black"
  quantity: number; // positive for addition, negative for deduction
  action: InventoryMovementAction;
  reason?: string;
  user: string;
  createdAt: string;
}

// Customers & Requests
export interface Customer {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseDate?: string;
  creditBalance: number;
  notes?: string;
  createdAt: string;
}

export interface CustomerRequest {
  id?: number;
  customerId?: number;
  customerName: string;
  customerPhone: string;
  requestedProduct: string;
  category: string;
  size: string;
  color: string;
  date: string;
  status: 'Pending' | 'Procured' | 'Not Available';
  notes?: string;
  createdAt: string;
}

// POS, Sales & Billing
export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Credit' | 'Mixed';

export interface SaleItem {
  id?: number;
  saleId?: number;
  productId: number;
  variantId: number;
  productName: string;
  brand: string;
  size: string;
  color: string;
  sku: string;
  quantity: number;
  purchasePrice: number; // For COGS calculation
  sellingPrice: number;
  discount: number;
  total: number;
}

export interface SalePayment {
  id?: number;
  saleId: number;
  method: PaymentMethod;
  amount: number;
  referenceNo?: string;
  date: string;
}

export interface Sale {
  id?: number;
  invoiceNo: string;
  date: string; // ISO string or YYYY-MM-DD
  customerId?: number;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  grandTotal: number;
  totalCostOfGoods: number; // Sum of items' purchasePrice * qty
  grossProfit: number; // grandTotal - totalCostOfGoods
  amountPaid: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  cashierName: string;
  notes?: string;
  status: 'Completed' | 'Returned' | 'Partially Returned' | 'Cancelled';
  createdAt: string;
}

export type ReturnType = 'Full Return' | 'Partial Return' | 'Exchange';

export interface ReturnItem {
  id?: number;
  returnId?: number;
  saleItemId: number;
  productId: number;
  variantId: number;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
}

export interface SaleReturn {
  id?: number;
  saleId: number;
  invoiceNo: string;
  returnDate: string;
  returnType: ReturnType;
  customerName: string;
  items: ReturnItem[];
  totalRefundAmount: number;
  refundMethod: PaymentMethod;
  reason: string;
  processedBy: string;
  createdAt: string;
}

// Purchases
export type PurchasePaymentStatus = 'Paid' | 'Partially Paid' | 'Credit';

export interface PurchaseItem {
  id?: number;
  purchaseId?: number;
  productId: number;
  variantId: number;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  purchasePrice: number;
  total: number;
}

export interface Purchase {
  id?: number;
  invoiceNo: string;
  supplierId: number;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PurchasePaymentStatus;
  notes?: string;
  createdAt: string;
}

// Finance & Expenses
export type ExpenseCategory = 
  | 'Staff Salary'
  | 'Shop Rent'
  | 'Room Rent'
  | 'Electricity'
  | 'Water'
  | 'Internet'
  | 'Maintenance'
  | 'Transport'
  | 'Packaging'
  | 'Marketing'
  | 'Repairs'
  | 'Supplier Payments'
  | 'Refreshments'
  | 'Miscellaneous';

export interface Expense {
  id?: number;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  description?: string;
  receiptUrl?: string;
  isRecurring?: boolean;
  createdAt: string;
}

export type BillStatus = 'Upcoming' | 'Due Today' | 'Overdue' | 'Paid';

export interface Bill {
  id?: number;
  title: string; // e.g. "Monthly Shop Rent", "TNEB Electricity"
  amount: number;
  dueDate: string;
  category: ExpenseCategory;
  status: BillStatus;
  paidDate?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
}

// Settings & Audit Logs
export interface StoreSettings {
  id?: number;
  storeName: string;
  tagline: string;
  brandName: string;
  phone: string;
  email: string;
  address: string;
  gstNumber?: string;
  enableTax: boolean;
  taxRate: number; // e.g. 5%
  currencySymbol: string;
  invoiceFooterNote: string;
  allowNegativeStock: boolean;
}

export interface AuditLog {
  id?: number;
  action: string;
  category: 'SALE' | 'INVENTORY' | 'FINANCE' | 'STAFF' | 'SETTINGS' | 'RETURN';
  details: string;
  user: string;
  timestamp: string;
}

// Analytics & Dashboard Interfaces
export interface DashboardKPIs {
  todaySales: number;
  todayBills: number;
  todayItemsSold: number;
  todayGrossProfit: number;
  todayNetProfit: number;
  currentStockValueCost: number;
  currentStockValueRetail: number;
  outstandingPayments: number;
  todayExpenses: number;
  
  // Payment Breakdown
  cashTotal: number;
  upiTotal: number;
  cardTotal: number;
  creditTotal: number;
}
