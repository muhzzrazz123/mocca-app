import Dexie, { type Table } from 'dexie';
import type {
  User,
  Staff,
  StaffAttendance,
  SalaryRecord,
  Category,
  Brand,
  Supplier,
  Product,
  ProductVariant,
  Purchase,
  PurchaseItem,
  Customer,
  CustomerRequest,
  Sale,
  SaleItem,
  SalePayment,
  SaleReturn,
  ReturnItem,
  Expense,
  Bill,
  InventoryMovement,
  StoreSettings,
  AuditLog,
} from '../types';

export class MoccaDatabase extends Dexie {
  users!: Table<User, number>;
  staff!: Table<Staff, number>;
  attendance!: Table<StaffAttendance, number>;
  salaryRecords!: Table<SalaryRecord, number>;
  categories!: Table<Category, number>;
  brands!: Table<Brand, number>;
  suppliers!: Table<Supplier, number>;
  products!: Table<Product, number>;
  productVariants!: Table<ProductVariant, number>;
  purchases!: Table<Purchase, number>;
  purchaseItems!: Table<PurchaseItem, number>;
  customers!: Table<Customer, number>;
  customerRequests!: Table<CustomerRequest, number>;
  sales!: Table<Sale, number>;
  saleItems!: Table<SaleItem, number>;
  salePayments!: Table<SalePayment, number>;
  returns!: Table<SaleReturn, number>;
  returnItems!: Table<ReturnItem, number>;
  expenses!: Table<Expense, number>;
  bills!: Table<Bill, number>;
  inventoryMovements!: Table<InventoryMovement, number>;
  settings!: Table<StoreSettings, number>;
  auditLogs!: Table<AuditLog, number>;

  constructor() {
    super('MoccaRetailDB');

    this.version(1).stores({
      users: '++id, username, role, pin',
      staff: '++id, name, phone, position, status',
      attendance: '++id, staffId, date, status, [staffId+date]',
      salaryRecords: '++id, staffId, month, status',
      categories: '++id, name',
      brands: '++id, name',
      suppliers: '++id, name, phone',
      products: '++id, name, sku, barcode, categoryId, brand, isActive',
      productVariants: '++id, productId, sku, barcode, size, color, currentStock',
      purchases: '++id, invoiceNo, supplierId, date, paymentStatus',
      purchaseItems: '++id, purchaseId, productId, variantId',
      customers: '++id, name, phone',
      customerRequests: '++id, customerPhone, requestedProduct, category, status, date',
      sales: '++id, invoiceNo, date, customerId, customerName, paymentMethod, status, createdAt',
      saleItems: '++id, saleId, productId, variantId',
      salePayments: '++id, saleId, method, date',
      returns: '++id, saleId, invoiceNo, returnDate',
      returnItems: '++id, returnId, saleItemId, productId, variantId',
      expenses: '++id, category, date, paymentMethod',
      bills: '++id, title, dueDate, status, category',
      inventoryMovements: '++id, productId, variantId, action, date',
      settings: '++id',
      auditLogs: '++id, category, user, timestamp',
    });
  }

  // Cascading Transaction: Perform Complete Sale
  async executeSaleTransaction(saleData: Omit<Sale, 'id'>, items: SaleItem[]): Promise<number> {
    return await this.transaction(
      'rw',
      [
        this.sales,
        this.saleItems,
        this.productVariants,
        this.inventoryMovements,
        this.customers,
        this.auditLogs,
      ],
      async () => {
        // 1. Check stock availability for all items
        for (const item of items) {
          const variant = await this.productVariants.get(item.variantId);
          if (!variant) {
            throw new Error(`Variant not found for item: ${item.productName}`);
          }
          if (variant.currentStock < item.quantity) {
            throw new Error(
              `Insufficient stock for ${item.productName} (${item.size} / ${item.color}). Available: ${variant.currentStock}, Requested: ${item.quantity}`
            );
          }
        }

        // 2. Insert Sale
        const saleId = await this.sales.add(saleData as Sale);

        // 3. Insert Sale Items & Deduct Inventory
        for (const item of items) {
          await this.saleItems.add({
            ...item,
            saleId: Number(saleId),
          });

          // Decrement variant stock
          const variant = await this.productVariants.get(item.variantId);
          if (variant) {
            await this.productVariants.update(item.variantId, {
              currentStock: variant.currentStock - item.quantity,
            });

            // Record inventory movement
            await this.inventoryMovements.add({
              date: saleData.date,
              productId: item.productId,
              productName: item.productName,
              variantId: item.variantId,
              variantInfo: `${item.size} / ${item.color}`,
              quantity: -item.quantity,
              action: 'SALE',
              reason: `Bill #${saleData.invoiceNo}`,
              user: saleData.cashierName,
              createdAt: new Date().toISOString(),
            });
          }
        }

        // 4. Update Customer record if provided
        if (saleData.customerId) {
          const customer = await this.customers.get(saleData.customerId);
          if (customer) {
            const newTotalSpent = customer.totalSpent + saleData.grandTotal;
            const newTotalPurchases = customer.totalPurchases + 1;
            const newCreditBalance =
              customer.creditBalance + (saleData.balanceDue > 0 ? saleData.balanceDue : 0);

            await this.customers.update(customer.id!, {
              totalPurchases: newTotalPurchases,
              totalSpent: newTotalSpent,
              lastPurchaseDate: saleData.date,
              creditBalance: newCreditBalance,
            });
          }
        }

        // 5. Audit Log
        await this.auditLogs.add({
          action: 'SALE_COMPLETED',
          category: 'SALE',
          details: `Invoice #${saleData.invoiceNo} created. Total: ₹${saleData.grandTotal} (${saleData.paymentMethod})`,
          user: saleData.cashierName,
          timestamp: new Date().toISOString(),
        });

        return Number(saleId);
      }
    );
  }

  // Cascading Transaction: Perform Return
  async executeReturnTransaction(
    returnRecord: Omit<SaleReturn, 'id'>,
    returnItemsList: ReturnItem[],
    originalSale: Sale
  ): Promise<number> {
    return await this.transaction(
      'rw',
      [
        this.returns,
        this.returnItems,
        this.sales,
        this.productVariants,
        this.inventoryMovements,
        this.auditLogs,
      ],
      async () => {
        const returnId = await this.returns.add(returnRecord as SaleReturn);

        for (const rItem of returnItemsList) {
          await this.returnItems.add({
            ...rItem,
            returnId: Number(returnId),
          });

          // Restock variant
          const variant = await this.productVariants.get(rItem.variantId);
          if (variant) {
            await this.productVariants.update(rItem.variantId, {
              currentStock: variant.currentStock + rItem.quantity,
            });

            // Movement log
            await this.inventoryMovements.add({
              date: returnRecord.returnDate,
              productId: rItem.productId,
              productName: rItem.productName,
              variantId: rItem.variantId,
              variantInfo: `${rItem.size} / ${rItem.color}`,
              quantity: rItem.quantity,
              action: 'RETURN',
              reason: `Return #${returnRecord.invoiceNo}: ${returnRecord.reason}`,
              user: returnRecord.processedBy,
              createdAt: new Date().toISOString(),
            });
          }
        }

        // Update original sale status
        const isFullReturn = returnRecord.returnType === 'Full Return';
        await this.sales.update(originalSale.id!, {
          status: isFullReturn ? 'Returned' : 'Partially Returned',
        });

        await this.auditLogs.add({
          action: 'RETURN_PROCESSED',
          category: 'RETURN',
          details: `Return on Invoice #${returnRecord.invoiceNo} for ₹${returnRecord.totalRefundAmount}. Reason: ${returnRecord.reason}`,
          user: returnRecord.processedBy,
          timestamp: new Date().toISOString(),
        });

        return Number(returnId);
      }
    );
  }

  // Cascading Transaction: Void / Delete Sale with automatic inventory restock
  async voidSaleTransaction(saleId: number, reason: string, user: string): Promise<void> {
    await this.transaction(
      'rw',
      [
        this.sales,
        this.saleItems,
        this.productVariants,
        this.inventoryMovements,
        this.customers,
        this.auditLogs,
      ],
      async () => {
        const sale = await this.sales.get(saleId);
        if (!sale) return;

        const items = await this.saleItems.where('saleId').equals(saleId).toArray();

        // 1. Restock variant quantities
        for (const item of items) {
          const variant = await this.productVariants.get(item.variantId);
          if (variant) {
            await this.productVariants.update(item.variantId, {
              currentStock: variant.currentStock + item.quantity,
            });

            // Log inventory movement
            await this.inventoryMovements.add({
              date: new Date().toISOString().split('T')[0],
              productId: item.productId,
              productName: item.productName,
              variantId: item.variantId,
              variantInfo: `${item.size} / ${item.color}`,
              quantity: item.quantity,
              action: 'ADJUSTMENT',
              reason: `Sale Voided/Deleted #${sale.invoiceNo}: ${reason}`,
              user,
              createdAt: new Date().toISOString(),
            });
          }
        }

        // 2. Adjust Customer metrics if attached
        if (sale.customerId) {
          const customer = await this.customers.get(sale.customerId);
          if (customer) {
            await this.customers.update(sale.customerId, {
              totalPurchases: Math.max(0, customer.totalPurchases - 1),
              totalSpent: Math.max(0, customer.totalSpent - sale.grandTotal),
              creditBalance: Math.max(0, customer.creditBalance - (sale.balanceDue || 0)),
            });
          }
        }

        // 3. Delete sale and sale items
        await this.saleItems.where('saleId').equals(saleId).delete();
        await this.sales.delete(saleId);

        // 4. Audit Log
        await this.auditLogs.add({
          action: 'SALE_DELETED',
          category: 'SALE',
          details: `Bill #${sale.invoiceNo} (₹${sale.grandTotal}) deleted/voided. Stock restored. Reason: ${reason}`,
          user,
          timestamp: new Date().toISOString(),
        });
      }
    );
  }

  // Delete Expense with Audit Log
  async deleteExpenseTransaction(expenseId: number, user: string): Promise<void> {
    const expense = await this.expenses.get(expenseId);
    if (!expense) return;

    await this.expenses.delete(expenseId);

    await this.auditLogs.add({
      action: 'EXPENSE_DELETED',
      category: 'FINANCE',
      details: `Expense "${expense.title}" of ₹${expense.amount} (${expense.category}) deleted.`,
      user,
      timestamp: new Date().toISOString(),
    });
  }

  // Delete Bill with Audit Log
  async deleteBillTransaction(billId: number, user: string): Promise<void> {
    const bill = await this.bills.get(billId);
    if (!bill) return;

    await this.bills.delete(billId);

    await this.auditLogs.add({
      action: 'BILL_DELETED',
      category: 'FINANCE',
      details: `Bill "${bill.title}" of ₹${bill.amount} (${bill.category}) deleted.`,
      user,
      timestamp: new Date().toISOString(),
    });
  }

  // Delete Staff with Audit Log
  async deleteStaffTransaction(staffId: number, user: string): Promise<void> {
    const staff = await this.staff.get(staffId);
    if (!staff) return;

    await this.staff.delete(staffId);
    // Also delete attendance and salary records
    await this.attendance.where('staffId').equals(staffId).delete();
    await this.salaryRecords.where('staffId').equals(staffId).delete();

    await this.auditLogs.add({
      action: 'STAFF_DELETED',
      category: 'STAFF',
      details: `Staff member "${staff.name}" (${staff.position}) deleted from system.`,
      user,
      timestamp: new Date().toISOString(),
    });
  }

  // Delete Product and variants with Audit Log
  async deleteProductTransaction(productId: number, user: string): Promise<void> {
    const product = await this.products.get(productId);
    if (!product) return;

    await this.products.delete(productId);
    await this.productVariants.where('productId').equals(productId).delete();

    await this.auditLogs.add({
      action: 'PRODUCT_DELETED',
      category: 'INVENTORY',
      details: `Product "${product.name}" (${product.brand}) and its variants deleted from catalog.`,
      user,
      timestamp: new Date().toISOString(),
    });
  }
}

export const db = new MoccaDatabase();
