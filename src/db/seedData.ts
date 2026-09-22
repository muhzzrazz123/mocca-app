import { db } from './db';
import type {
  User,
  Staff,
  StaffAttendance,
  Category,
  Brand,
  Supplier,
  Product,
  ProductVariant,
  Customer,
  CustomerRequest,
  Sale,
  SaleItem,
  Expense,
  Bill,
  StoreSettings,
  AuditLog,
} from '../types';

export async function seedDatabaseIfEmpty(): Promise<void> {
  const userCount = await db.users.count();
  if (userCount > 0) {
    const admin = await db.users.where('username').equals('admin').first();
    if (admin && admin.pin === '1234') {
      await db.users.update(admin.id!, { pin: '7755' });
    }
    return; // Already initialized
  }

  console.log('Seeding initial MOCCA GENTS & BOYS COLLECTIONS database...');

  // 1. Store Settings
  const settings: StoreSettings = {
    storeName: 'MOCCA GENTS & BOYS COLLECTIONS',
    tagline: "Premium Men's & Boys' Fashion",
    brandName: 'MOCCA',
    phone: '+91 98401 23456',
    email: 'contact@moccacollections.com',
    address: 'No. 42, Commercial Luxury Avenue, City Centre - 600001',
    gstNumber: '33AABCM1234F1Z5',
    enableTax: false,
    taxRate: 5,
    currencySymbol: '₹',
    invoiceFooterNote: 'Thank you for shopping at MOCCA! Goods once sold can be exchanged within 7 days with original tag and bill.',
    allowNegativeStock: false,
  };
  await db.settings.add(settings);

  // 2. Users (Admin, Manager, Cashier)
  const users: User[] = [
    {
      username: 'admin',
      name: 'Mashboob (Store Owner)',
      role: 'ADMIN',
      pin: '7755',
      createdAt: new Date().toISOString(),
    },
    {
      username: 'manager',
      name: 'Vignesh R (Store Manager)',
      role: 'MANAGER',
      pin: '2345',
      createdAt: new Date().toISOString(),
    },
    {
      username: 'cashier',
      name: 'Karthik S (POS Cashier)',
      role: 'CASHIER',
      pin: '3456',
      createdAt: new Date().toISOString(),
    },
  ];
  await db.users.bulkAdd(users);

  // 3. Staff
  const staffMembers: Staff[] = [
    {
      name: 'Vignesh R',
      phone: '+91 98402 33445',
      position: 'Manager',
      joiningDate: '2023-01-15',
      basicSalary: 28000,
      workingHours: '10:00 AM - 09:00 PM',
      status: 'Active',
      notes: 'Overall store supervisor and procurement lead',
      createdAt: new Date().toISOString(),
    },
    {
      name: 'Karthik S',
      phone: '+91 97901 88776',
      position: 'Cashier',
      joiningDate: '2023-05-10',
      basicSalary: 18500,
      workingHours: '10:30 AM - 09:30 PM',
      status: 'Active',
      notes: 'Primary checkout counter lead',
      createdAt: new Date().toISOString(),
    },
    {
      name: 'Suresh Babu',
      phone: '+91 96001 22334',
      position: 'Sales Staff',
      joiningDate: '2023-08-01',
      basicSalary: 16000,
      workingHours: '10:00 AM - 09:00 PM',
      status: 'Active',
      notes: 'Men formal & shirts floor executive',
      createdAt: new Date().toISOString(),
    },
    {
      name: 'Praveen Kumar',
      phone: '+91 95004 44556',
      position: 'Helper',
      joiningDate: '2024-02-01',
      basicSalary: 13000,
      workingHours: '10:00 AM - 08:30 PM',
      status: 'Active',
      notes: 'Inventory handling & steam pressing',
      createdAt: new Date().toISOString(),
    },
  ];
  const staffIds = await db.staff.bulkAdd(staffMembers, { allKeys: true });

  // 4. Today's Staff Attendance (Showing 1 absent to trigger dashboard alert!)
  const todayStr = new Date().toISOString().split('T')[0];
  const attendances: StaffAttendance[] = [
    {
      staffId: Number(staffIds[0]),
      staffName: 'Vignesh R',
      date: todayStr,
      status: 'Present',
      checkIn: '09:55 AM',
    },
    {
      staffId: Number(staffIds[1]),
      staffName: 'Karthik S',
      date: todayStr,
      status: 'Present',
      checkIn: '10:15 AM',
    },
    {
      staffId: Number(staffIds[2]),
      staffName: 'Suresh Babu',
      date: todayStr,
      status: 'Present',
      checkIn: '10:05 AM',
    },
    {
      staffId: Number(staffIds[3]),
      staffName: 'Praveen Kumar',
      date: todayStr,
      status: 'Absent',
      notes: 'Informed fever in the morning',
    },
  ];
  await db.attendance.bulkAdd(attendances);

  // 5. Categories
  const categoriesList: Category[] = [
    { name: 'Shirts', description: 'Oxford, Linen, Casual & Formal shirts' },
    { name: 'T-Shirts', description: 'Oversized, Polo, Graphic & Plain crew neck' },
    { name: 'Jeans', description: 'Slim fit, Baggy, Regular selvedge denim' },
    { name: 'Pants', description: 'Cargo pants, Chinos & Formal trousers' },
    { name: 'Shorts', description: 'Casual cotton & denim shorts' },
    { name: 'Jackets', description: 'Suede, Bomber & Denim outer jackets' },
    { name: 'Boys Wear', description: 'Festive sets, Boys shirts & t-shirts' },
    { name: 'Innerwear', description: 'Premium cotton vests & briefs' },
    { name: 'Accessories', description: 'Leather belts, Wallets, Ties, Socks' },
    { name: 'Footwear', description: 'Casual loafers, Moccasins & Sneakers' },
  ];
  const categoryIds = await db.categories.bulkAdd(categoriesList, { allKeys: true });

  // 6. Brands
  const brandsList: Brand[] = [
    { name: 'MOCCA Signature' },
    { name: 'MOCCA Denim Co.' },
    { name: 'MOCCA Urban Casuals' },
    { name: 'MOCCA Junior' },
    { name: 'Linen Club' },
    { name: 'US Polo Assn' },
  ];
  await db.brands.bulkAdd(brandsList);

  // 7. Suppliers
  const suppliersList: Supplier[] = [
    {
      name: 'Royal Mills Garments',
      phone: '+91 98200 11223',
      address: 'Industrial Estate, Tirupur, TN',
      contactPerson: 'Mukesh Parekh',
      balanceDue: 18500,
      notes: 'Primary cotton shirt and polo supplier',
      createdAt: new Date().toISOString(),
    },
    {
      name: 'Surat Denim Works',
      phone: '+91 98980 99887',
      address: 'Ring Road Textile Market, Surat, GJ',
      contactPerson: 'Hitesh Patel',
      balanceDue: 24000,
      notes: 'Denim jeans and cargo specialist',
      createdAt: new Date().toISOString(),
    },
    {
      name: 'Southern Boys Apparels',
      phone: '+91 94433 55667',
      address: 'Avinashi Road, Coimbatore, TN',
      contactPerson: 'K. Sundaram',
      balanceDue: 0,
      notes: 'Boys ethnic and casual wear',
      createdAt: new Date().toISOString(),
    },
  ];
  const supplierIds = await db.suppliers.bulkAdd(suppliersList, { allKeys: true });

  // 8. Products & Variants
  const productsWithVariants = [
    {
      product: {
        name: 'Classic Oxford Cotton Shirt',
        sku: 'MOC-SH-001',
        barcode: '890100100101',
        categoryId: Number(categoryIds[0]),
        categoryName: 'Shirts',
        brand: 'MOCCA Signature',
        description: '100% combed Oxford cotton button-down shirt with chest embroidery.',
        supplierId: Number(supplierIds[0]),
        supplierName: 'Royal Mills Garments',
        minStockLevel: 5,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      variants: [
        { sku: 'MOC-SH-001-BLK-M', barcode: '890100100102', size: 'M', color: 'Black', purchasePrice: 620, sellingPrice: 1499, currentStock: 8, minStockLevel: 2 },
        { sku: 'MOC-SH-001-BLK-L', barcode: '890100100103', size: 'L', color: 'Black', purchasePrice: 620, sellingPrice: 1499, currentStock: 12, minStockLevel: 2 },
        { sku: 'MOC-SH-001-BLK-XL', barcode: '890100100104', size: 'XL', color: 'Black', purchasePrice: 620, sellingPrice: 1499, currentStock: 6, minStockLevel: 2 },
        { sku: 'MOC-SH-001-WHT-M', barcode: '890100100105', size: 'M', color: 'White', purchasePrice: 620, sellingPrice: 1499, currentStock: 10, minStockLevel: 2 },
        { sku: 'MOC-SH-001-WHT-L', barcode: '890100100106', size: 'L', color: 'White', purchasePrice: 620, sellingPrice: 1499, currentStock: 14, minStockLevel: 2 },
        { sku: 'MOC-SH-001-BLU-L', barcode: '890100100107', size: 'L', color: 'Sky Blue', purchasePrice: 620, sellingPrice: 1499, currentStock: 7, minStockLevel: 2 },
      ],
    },
    {
      product: {
        name: 'Heavyweight Oversized Tee',
        sku: 'MOC-TS-002',
        barcode: '890100100201',
        categoryId: Number(categoryIds[1]),
        categoryName: 'T-Shirts',
        brand: 'MOCCA Urban Casuals',
        description: '240 GSM French terry cotton with drop shoulder silhouette.',
        supplierId: Number(supplierIds[0]),
        supplierName: 'Royal Mills Garments',
        minStockLevel: 8,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      variants: [
        { sku: 'MOC-TS-002-BLK-M', barcode: '890100100202', size: 'M', color: 'Black', purchasePrice: 310, sellingPrice: 799, currentStock: 18, minStockLevel: 4 },
        { sku: 'MOC-TS-002-BLK-L', barcode: '890100100203', size: 'L', color: 'Black', purchasePrice: 310, sellingPrice: 799, currentStock: 22, minStockLevel: 4 },
        { sku: 'MOC-TS-002-BLK-XL', barcode: '890100100204', size: 'XL', color: 'Black', purchasePrice: 310, sellingPrice: 799, currentStock: 15, minStockLevel: 4 },
        { sku: 'MOC-TS-002-BEI-M', barcode: '890100100205', size: 'M', color: 'Beige', purchasePrice: 310, sellingPrice: 799, currentStock: 9, minStockLevel: 4 },
        { sku: 'MOC-TS-002-BEI-L', barcode: '890100100206', size: 'L', color: 'Beige', purchasePrice: 310, sellingPrice: 799, currentStock: 11, minStockLevel: 4 },
        { sku: 'MOC-TS-002-OLV-L', barcode: '890100100207', size: 'L', color: 'Olive', purchasePrice: 310, sellingPrice: 799, currentStock: 8, minStockLevel: 4 },
      ],
    },
    {
      product: {
        name: 'Slim Tapered Selvedge Jeans',
        sku: 'MOC-JN-003',
        barcode: '890100100301',
        categoryId: Number(categoryIds[2]),
        categoryName: 'Jeans',
        brand: 'MOCCA Denim Co.',
        description: '13.5oz ring-spun denim with clean red-line selvedge cuffs.',
        supplierId: Number(supplierIds[1]),
        supplierName: 'Surat Denim Works',
        minStockLevel: 6,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      variants: [
        { sku: 'MOC-JN-003-IND-30', barcode: '890100100302', size: '30', color: 'Indigo', purchasePrice: 850, sellingPrice: 2199, currentStock: 5, minStockLevel: 2 },
        { sku: 'MOC-JN-003-IND-32', barcode: '890100100303', size: '32', color: 'Indigo', purchasePrice: 850, sellingPrice: 2199, currentStock: 12, minStockLevel: 2 },
        { sku: 'MOC-JN-003-IND-34', barcode: '890100100304', size: '34', color: 'Indigo', purchasePrice: 850, sellingPrice: 2199, currentStock: 7, minStockLevel: 2 },
        { sku: 'MOC-JN-003-IND-36', barcode: '890100100305', size: '36', color: 'Indigo', purchasePrice: 850, sellingPrice: 2199, currentStock: 4, minStockLevel: 2 },
        { sku: 'MOC-JN-003-CHR-32', barcode: '890100100306', size: '32', color: 'Charcoal', purchasePrice: 850, sellingPrice: 2199, currentStock: 8, minStockLevel: 2 },
      ],
    },
    {
      product: {
        name: 'Relaxed Fit Cargo Pants',
        sku: 'MOC-PT-004',
        barcode: '890100100401',
        categoryId: Number(categoryIds[3]),
        categoryName: 'Pants',
        brand: 'MOCCA Urban Casuals',
        description: '6-pocket utility cargo pants with drawstring hem and stretch ripstop.',
        supplierId: Number(supplierIds[1]),
        supplierName: 'Surat Denim Works',
        minStockLevel: 6,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      variants: [
        { sku: 'MOC-PT-004-BLK-30', barcode: '890100100402', size: '30', color: 'Black', purchasePrice: 720, sellingPrice: 1799, currentStock: 6, minStockLevel: 2 },
        // Notice size 32 is low (1 left) -> triggers "Size 32 is running low"
        { sku: 'MOC-PT-004-BLK-32', barcode: '890100100403', size: '32', color: 'Black', purchasePrice: 720, sellingPrice: 1799, currentStock: 1, minStockLevel: 3 },
        { sku: 'MOC-PT-004-BLK-34', barcode: '890100100404', size: '34', color: 'Black', purchasePrice: 720, sellingPrice: 1799, currentStock: 5, minStockLevel: 2 },
        { sku: 'MOC-PT-004-KHK-32', barcode: '890100100405', size: '32', color: 'Khaki', purchasePrice: 720, sellingPrice: 1799, currentStock: 2, minStockLevel: 3 },
        { sku: 'MOC-PT-004-KHK-34', barcode: '890100100406', size: '34', color: 'Khaki', purchasePrice: 720, sellingPrice: 1799, currentStock: 4, minStockLevel: 2 },
      ],
    },
    {
      product: {
        name: 'Boys Festive Kurta Shirt Set',
        sku: 'MOC-BY-005',
        barcode: '890100100501',
        categoryId: Number(categoryIds[6]),
        categoryName: 'Boys Wear',
        brand: 'MOCCA Junior',
        description: 'Jacquard woven boys festive mandarin shirt with matching bottom.',
        supplierId: Number(supplierIds[2]),
        supplierName: 'Southern Boys Apparels',
        minStockLevel: 4,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      variants: [
        { sku: 'MOC-BY-005-MRN-4Y', barcode: '890100100502', size: '4-5Y', color: 'Maroon', purchasePrice: 520, sellingPrice: 1299, currentStock: 6, minStockLevel: 2 },
        { sku: 'MOC-BY-005-MRN-6Y', barcode: '890100100503', size: '6-7Y', color: 'Maroon', purchasePrice: 520, sellingPrice: 1299, currentStock: 5, minStockLevel: 2 },
        { sku: 'MOC-BY-005-GLD-6Y', barcode: '890100100504', size: '6-7Y', color: 'Gold Cream', purchasePrice: 520, sellingPrice: 1299, currentStock: 4, minStockLevel: 2 },
        { sku: 'MOC-BY-005-GLD-8Y', barcode: '890100100505', size: '8-9Y', color: 'Gold Cream', purchasePrice: 550, sellingPrice: 1399, currentStock: 0, minStockLevel: 2 }, // OUT OF STOCK
      ],
    },
    {
      product: {
        name: 'Suede Harrington Jacket',
        sku: 'MOC-JK-006',
        barcode: '890100100601',
        categoryId: Number(categoryIds[5]),
        categoryName: 'Jackets',
        brand: 'MOCCA Signature',
        description: 'Vegan suede vintage collar jacket with double zipper and satin lining.',
        supplierId: Number(supplierIds[0]),
        supplierName: 'Royal Mills Garments',
        minStockLevel: 3,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      variants: [
        { sku: 'MOC-JK-006-BRN-M', barcode: '890100100602', size: 'M', color: 'Mocha Brown', purchasePrice: 1450, sellingPrice: 3499, currentStock: 4, minStockLevel: 2 },
        { sku: 'MOC-JK-006-BRN-L', barcode: '890100100603', size: 'L', color: 'Mocha Brown', purchasePrice: 1450, sellingPrice: 3499, currentStock: 3, minStockLevel: 2 },
        { sku: 'MOC-JK-006-BLK-L', barcode: '890100100604', size: 'L', color: 'Black', purchasePrice: 1450, sellingPrice: 3499, currentStock: 5, minStockLevel: 2 },
      ],
    },
  ];

  for (const item of productsWithVariants) {
    const prodId = await db.products.add(item.product as Product);
    const variantsWithProdId = item.variants.map((v) => ({
      ...v,
      productId: Number(prodId),
    }));
    await db.productVariants.bulkAdd(variantsWithProdId as ProductVariant[]);
  }

  // 9. Customers
  const customersList: Customer[] = [
    {
      name: 'Rajesh Kannan',
      phone: '9841098410',
      email: 'rajesh.k@gmail.com',
      address: '15, 2nd Main Road, Anna Nagar West, Chennai',
      totalPurchases: 5,
      totalSpent: 12495,
      lastPurchaseDate: todayStr,
      creditBalance: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: 'Mohammed Faizal',
      phone: '9884012345',
      email: 'faizal.m@outlook.com',
      address: '77, Usman Road, T. Nagar, Chennai',
      totalPurchases: 3,
      totalSpent: 8797,
      lastPurchaseDate: todayStr,
      creditBalance: 1500, // Has outstanding credit
      createdAt: new Date().toISOString(),
    },
    {
      name: 'Sanjay Verma',
      phone: '9790011223',
      email: 'sanjay.verma@yahoo.com',
      address: '8, LB Road, Adyar, Chennai',
      totalPurchases: 2,
      totalSpent: 4998,
      lastPurchaseDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      creditBalance: 0,
      createdAt: new Date().toISOString(),
    },
    {
      name: 'Walk-in Customer',
      phone: '9999999999',
      totalPurchases: 18,
      totalSpent: 32450,
      lastPurchaseDate: todayStr,
      creditBalance: 0,
      createdAt: new Date().toISOString(),
    },
  ];
  const customerIds = await db.customers.bulkAdd(customersList, { allKeys: true });

  // 10. Customer Requests (Wanted items)
  const customerRequestsList: CustomerRequest[] = [
    {
      customerName: 'Mohammed Faizal',
      customerPhone: '9884012345',
      requestedProduct: 'Black Baggy Jeans',
      category: 'Jeans',
      size: '34',
      color: 'Washed Black',
      date: todayStr,
      status: 'Pending',
      notes: 'Customer looking for wide leg fit, willing to buy 2 pairs',
      createdAt: new Date().toISOString(),
    },
    {
      customerName: 'Sanjay Verma',
      customerPhone: '9790011223',
      requestedProduct: 'Oversized White Graphic Tee',
      category: 'T-Shirts',
      size: 'XL',
      color: 'Off-White',
      date: todayStr,
      status: 'Pending',
      notes: 'Heavyweight typography back print requested',
      createdAt: new Date().toISOString(),
    },
    {
      customerName: 'Walk-in Customer',
      customerPhone: '9840911223',
      requestedProduct: 'Linen Mandarin Collar Half Shirt',
      category: 'Shirts',
      size: 'L',
      color: 'Sage Green',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      status: 'Pending',
      notes: 'Urgent requirement for beach wedding',
      createdAt: new Date().toISOString(),
    },
  ];
  await db.customerRequests.bulkAdd(customerRequestsList);

  // 11. Real Initial Sales (Today and recent days for live dynamic KPI cards & charts)
  // Let's get variant IDs from DB
  const allVariants = await db.productVariants.toArray();
  const oxfordBlackL = allVariants.find((v) => v.sku === 'MOC-SH-001-BLK-L')!;
  const oversizedBlackL = allVariants.find((v) => v.sku === 'MOC-TS-002-BLK-L')!;
  const jeansIndigo32 = allVariants.find((v) => v.sku === 'MOC-JN-003-IND-32')!;
  const cargoBlack32 = allVariants.find((v) => v.sku === 'MOC-PT-004-BLK-32')!;

  const sampleSales: { sale: Sale; items: SaleItem[] }[] = [
    {
      sale: {
        invoiceNo: 'MOC-2609-001',
        date: todayStr,
        customerId: Number(customerIds[0]),
        customerName: 'Rajesh Kannan',
        customerPhone: '9841098410',
        items: [],
        subtotal: 3698,
        discountTotal: 200,
        taxAmount: 0,
        grandTotal: 3498,
        totalCostOfGoods: 1470, // 620 + 850
        grossProfit: 2028, // 3498 - 1470
        amountPaid: 3498,
        balanceDue: 0,
        paymentMethod: 'UPI',
        cashierName: 'Karthik S',
        status: 'Completed',
        createdAt: new Date().toISOString(),
      },
      items: [
        {
          productId: oxfordBlackL.productId,
          variantId: oxfordBlackL.id!,
          productName: 'Classic Oxford Cotton Shirt',
          brand: 'MOCCA Signature',
          size: 'L',
          color: 'Black',
          sku: oxfordBlackL.sku,
          quantity: 1,
          purchasePrice: 620,
          sellingPrice: 1499,
          discount: 100,
          total: 1399,
        },
        {
          productId: jeansIndigo32.productId,
          variantId: jeansIndigo32.id!,
          productName: 'Slim Tapered Selvedge Jeans',
          brand: 'MOCCA Denim Co.',
          size: '32',
          color: 'Indigo',
          sku: jeansIndigo32.sku,
          quantity: 1,
          purchasePrice: 850,
          sellingPrice: 2199,
          discount: 100,
          total: 2099,
        },
      ],
    },
    {
      sale: {
        invoiceNo: 'MOC-2609-002',
        date: todayStr,
        customerId: Number(customerIds[1]),
        customerName: 'Mohammed Faizal',
        customerPhone: '9884012345',
        items: [],
        subtotal: 2598,
        discountTotal: 100,
        taxAmount: 0,
        grandTotal: 2498,
        totalCostOfGoods: 1030, // 310 + 720
        grossProfit: 1468,
        amountPaid: 998,
        balanceDue: 1500, // Credit sale portion
        paymentMethod: 'Mixed',
        cashierName: 'Karthik S',
        status: 'Completed',
        createdAt: new Date().toISOString(),
      },
      items: [
        {
          productId: oversizedBlackL.productId,
          variantId: oversizedBlackL.id!,
          productName: 'Heavyweight Oversized Tee',
          brand: 'MOCCA Urban Casuals',
          size: 'L',
          color: 'Black',
          sku: oversizedBlackL.sku,
          quantity: 1,
          purchasePrice: 310,
          sellingPrice: 799,
          discount: 0,
          total: 799,
        },
        {
          productId: cargoBlack32.productId,
          variantId: cargoBlack32.id!,
          productName: 'Relaxed Fit Cargo Pants',
          brand: 'MOCCA Urban Casuals',
          size: '32',
          color: 'Black',
          sku: cargoBlack32.sku,
          quantity: 1,
          purchasePrice: 720,
          sellingPrice: 1799,
          discount: 100,
          total: 1699,
        },
      ],
    },
    {
      sale: {
        invoiceNo: 'MOC-2609-003',
        date: todayStr,
        customerName: 'Walk-in Customer',
        customerPhone: '9840055443',
        items: [],
        subtotal: 1499,
        discountTotal: 0,
        taxAmount: 0,
        grandTotal: 1499,
        totalCostOfGoods: 620,
        grossProfit: 879,
        amountPaid: 1499,
        balanceDue: 0,
        paymentMethod: 'Cash',
        cashierName: 'Karthik S',
        status: 'Completed',
        createdAt: new Date().toISOString(),
      },
      items: [
        {
          productId: oxfordBlackL.productId,
          variantId: oxfordBlackL.id!,
          productName: 'Classic Oxford Cotton Shirt',
          brand: 'MOCCA Signature',
          size: 'L',
          color: 'Black',
          sku: oxfordBlackL.sku,
          quantity: 1,
          purchasePrice: 620,
          sellingPrice: 1499,
          discount: 0,
          total: 1499,
        },
      ],
    },
  ];

  for (const s of sampleSales) {
    const saleId = await db.sales.add({
      ...s.sale,
      items: s.items,
    });
    for (const item of s.items) {
      await db.saleItems.add({
        ...item,
        saleId: Number(saleId),
      });
    }
  }

  // 12. Expenses (Today & This month)
  const sampleExpenses: Expense[] = [
    {
      title: 'Store Electricity Bill (TNEB)',
      category: 'Electricity',
      amount: 4850,
      date: todayStr,
      paymentMethod: 'Bank Transfer',
      description: 'Monthly commercial meter power bill',
      createdAt: new Date().toISOString(),
    },
    {
      title: 'Packaging & Luxury Carry Bags',
      category: 'Packaging',
      amount: 3200,
      date: todayStr,
      paymentMethod: 'UPI',
      description: 'Matte black MOCCA embossed bags batch (300 pcs)',
      createdAt: new Date().toISOString(),
    },
    {
      title: 'Staff Refreshments & Evening Tea',
      category: 'Refreshments',
      amount: 350,
      date: todayStr,
      paymentMethod: 'Cash',
      description: 'Evening tea and snacks for shop staff',
      createdAt: new Date().toISOString(),
    },
    {
      title: 'High-speed Fiber Internet',
      category: 'Internet',
      amount: 1199,
      date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      paymentMethod: 'UPI',
      description: 'Airtel commercial fiber for POS and CCTV',
      createdAt: new Date().toISOString(),
    },
  ];
  await db.expenses.bulkAdd(sampleExpenses);

  // 13. Bills & Rent
  // Add 1 Overdue, 1 Due Today, and 1 Upcoming to demonstrate alerts!
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const threeDaysLaterStr = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

  const sampleBills: Bill[] = [
    {
      title: 'Shop Rent - Main Commercial Showroom',
      amount: 45000,
      dueDate: threeDaysLaterStr,
      category: 'Shop Rent',
      status: 'Upcoming',
      notes: 'Landlord: M. Ramachandran',
      createdAt: new Date().toISOString(),
    },
    {
      title: 'Commercial Electricity Bill (TNEB)',
      amount: 6200,
      dueDate: yesterdayStr,
      category: 'Electricity',
      status: 'Overdue', // Triggers Overdue alert!
      notes: 'Meter #887410 - Last date passed yesterday',
      createdAt: new Date().toISOString(),
    },
    {
      title: 'Staff Room & Stock Godown Rent',
      amount: 12000,
      dueDate: todayStr,
      category: 'Room Rent',
      status: 'Due Today', // Triggers Due Today alert!
      notes: 'Godown rent 2nd floor',
      createdAt: new Date().toISOString(),
    },
    {
      title: 'Packaging Supplier Dues',
      amount: 14500,
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      category: 'Supplier Payments',
      status: 'Upcoming',
      notes: 'Credit terms 15 days',
      createdAt: new Date().toISOString(),
    },
  ];
  await db.bills.bulkAdd(sampleBills);

  // 14. Initial Audit Log
  const initialAudit: AuditLog = {
    action: 'SYSTEM_INITIALIZATION',
    category: 'SETTINGS',
    details: 'MOCCA GENTS & BOYS COLLECTIONS database seeded with official catalog and initial records.',
    user: 'System Setup',
    timestamp: new Date().toISOString(),
  };
  await db.auditLogs.add(initialAudit);

  console.log('MOCCA database seeding complete.');
}
