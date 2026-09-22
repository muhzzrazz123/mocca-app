import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import type { Product, ProductVariant, SaleItem, Sale, PaymentMethod, Customer } from '../../types';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  User,
  Phone,
  CreditCard,
  QrCode,
  Banknote,
  Tag,
  ArrowRight,
  X,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Shirt,
  Receipt,
} from 'lucide-react';

interface CartItem extends SaleItem {
  maxStock: number;
}

export const PosBillingView: React.FC = () => {
  const { currentUser } = useAuth();
  const cashierName = currentUser?.name || 'Mashboob';

  // Live queries
  const products = useLiveQuery(() => db.products.toArray(), []) || [];
  const variants = useLiveQuery(() => db.productVariants.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) || [];
  const customers = useLiveQuery(() => db.customers.toArray(), []) || [];
  const totalSalesCount = useLiveQuery(() => db.sales.count(), []) || 0;

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Variant selector modal state
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState('');

  // Customer state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(undefined);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  // Processing & Success/Print Modal state
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [completedSaleItems, setCompletedSaleItems] = useState<SaleItem[]>([]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchesCategory =
        selectedCategory === 'All' || prod.categoryName === selectedCategory;
      const matchesSearch =
        searchQuery === '' ||
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.brand.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Map product id to its available variants
  const productVariantMap = useMemo(() => {
    const map = new Map<number, ProductVariant[]>();
    for (const v of variants) {
      const list = map.get(v.productId) || [];
      list.push(v);
      map.set(v.productId, list);
    }
    return map;
  }, [variants]);

  // Customer suggestions
  const filteredCustomerSuggestions = useMemo(() => {
    if (!customerPhone.trim() && !customerName.trim()) return [];
    const qPhone = customerPhone.toLowerCase();
    const qName = customerName.toLowerCase();
    return customers
      .filter(
        (c) =>
          (qPhone && c.phone.toLowerCase().includes(qPhone)) ||
          (qName && c.name.toLowerCase().includes(qName))
      )
      .slice(0, 5);
  }, [customers, customerPhone, customerName]);

  // Select customer from autocomplete
  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setShowCustomerSuggestions(false);
  };

  // Add variant to cart
  const handleAddToCart = (product: Product, variant: ProductVariant) => {
    if (variant.currentStock <= 0) {
      setErrorMessage(`Item ${product.name} (${variant.size}/${variant.color}) is out of stock.`);
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.variantId === variant.id);
      if (existingIndex >= 0) {
        const item = prev[existingIndex];
        if (item.quantity >= variant.currentStock) {
          setErrorMessage(`Cannot add more than ${variant.currentStock} units in stock.`);
          setTimeout(() => setErrorMessage(null), 3000);
          return prev;
        }
        const updated = [...prev];
        const newQty = item.quantity + 1;
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          total: newQty * item.sellingPrice - item.discount,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          productId: product.id!,
          variantId: variant.id!,
          productName: product.name,
          brand: product.brand,
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          quantity: 1,
          purchasePrice: variant.purchasePrice,
          sellingPrice: variant.sellingPrice,
          discount: 0,
          total: variant.sellingPrice,
          maxStock: variant.currentStock,
        };
        return [...prev, newItem];
      }
    });

    setSelectedProductForVariant(null);
  };

  // Adjust cart item quantity
  const handleUpdateQty = (variantId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.variantId === variantId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.maxStock) {
              setErrorMessage(`Only ${item.maxStock} units available in stock.`);
              setTimeout(() => setErrorMessage(null), 3000);
              return item;
            }
            return {
              ...item,
              quantity: nextQty,
              total: nextQty * item.sellingPrice - item.discount,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Remove from cart
  const handleRemoveFromCart = (variantId: number) => {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  // Clear cart
  const handleClearCart = () => {
    setCart([]);
    setDiscountAmount('0');
    setCashTendered('');
    setCustomerName('');
    setCustomerPhone('');
    setSelectedCustomerId(undefined);
    setSaleNotes('');
    setErrorMessage(null);
  };

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity * item.sellingPrice, 0);
  }, [cart]);

  const totalDiscount = Math.min(subtotal, Math.max(0, Number(discountAmount) || 0));
  const grandTotal = Math.max(0, subtotal - totalDiscount);

  const totalCOGS = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity * item.purchasePrice, 0);
  }, [cart]);

  const estimatedProfit = grandTotal - totalCOGS;
  const profitMarginPercent =
    grandTotal > 0 ? ((estimatedProfit / grandTotal) * 100).toFixed(1) : '0';

  const cashGiven = Number(cashTendered) || 0;
  const changeToReturn =
    paymentMethod === 'Cash' && cashGiven >= grandTotal ? cashGiven - grandTotal : 0;

  // Complete checkout & execute cascading sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setErrorMessage('Your cart is empty. Add products to generate a bill.');
      return;
    }

    if (paymentMethod === 'Cash' && cashGiven < grandTotal && cashGiven > 0) {
      setErrorMessage(`Tendered amount ₹${cashGiven} is less than total ₹${grandTotal}.`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const invoiceNo = `MOC-${new Date().getFullYear()}-${String(totalSalesCount + 1).padStart(4, '0')}`;
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      // If customer phone is provided and no customerId, create or find customer
      let custId = selectedCustomerId;
      if (!custId && customerPhone.trim()) {
        const existingCust = customers.find(
          (c) => c.phone.trim() === customerPhone.trim()
        );
        if (existingCust) {
          custId = existingCust.id;
        } else {
          custId = await db.customers.add({
            name: customerName.trim() || 'Valued Customer',
            phone: customerPhone.trim(),
            totalPurchases: 0,
            totalSpent: 0,
            creditBalance: 0,
            createdAt: now.toISOString(),
          });
        }
      }

      const saleData: Omit<Sale, 'id'> = {
        invoiceNo,
        date: dateStr,
        customerId: custId,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || undefined,
        items: cart.map(({ maxStock, ...rest }) => rest),
        subtotal,
        discountTotal: totalDiscount,
        taxAmount: 0,
        grandTotal,
        totalCostOfGoods: totalCOGS,
        grossProfit: estimatedProfit,
        amountPaid: paymentMethod === 'Credit' ? 0 : grandTotal,
        balanceDue: paymentMethod === 'Credit' ? grandTotal : 0,
        paymentMethod,
        cashierName,
        notes: saleNotes.trim() || undefined,
        status: 'Completed',
        createdAt: now.toISOString(),
      };

      const saleItemsToInsert: SaleItem[] = cart.map(({ maxStock, ...rest }) => rest);

      await db.executeSaleTransaction(saleData, saleItemsToInsert);

      // Set completed sale for print modal
      setCompletedSale({ ...saleData, id: totalSalesCount + 1 });
      setCompletedSaleItems(saleItemsToInsert);

      // Reset cart
      handleClearCart();
    } catch (err: any) {
      console.error('Failed to execute sale:', err);
      setErrorMessage(err?.message || 'Transaction failed. Please verify stock.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1700px] mx-auto pb-24 lg:pb-12 text-gray-900 dark:text-cream">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-[#1E222D]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shadow-sm">
            <Receipt size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-serif tracking-tight text-gray-900 dark:text-cream">
                Retail Billing & POS Counter
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gold/15 text-gold border border-gold/30">
                Live Register
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-cream-muted mt-0.5">
              High-speed billing counter for MOCCA Gents & Boys Collections • Cashier: <span className="font-semibold text-gold">{cashierName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-cream-muted font-medium">Register Status</p>
            <p className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Online & Ready
            </p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              className="px-3 py-2 text-xs font-semibold text-rose-500 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={14} /> Clear Cart
            </button>
          )}
        </div>
      </div>

      {/* Main Split Layout: Catalog Browser (Left) & Cart / Checkout (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Catalog & Products (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="bg-white dark:bg-[#0E1015] border border-gray-200 dark:border-[#1E222D] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-cream-muted"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Scan barcode, enter SKU or search apparel name..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-[#222736] rounded-xl text-gray-900 dark:text-cream placeholder-gray-400 dark:placeholder-cream-muted/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-cream"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-gold text-mocca-950 shadow-sm'
                    : 'bg-gray-100 dark:bg-[#161922] text-gray-600 dark:text-cream-muted hover:text-gray-900 dark:hover:text-cream border border-gray-200 dark:border-[#222736]'
                }`}
              >
                All Apparel ({products.length})
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryName === cat.name).length;
                return (
                  <button
                    key={cat.id || cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                      selectedCategory === cat.name
                        ? 'bg-gold text-mocca-950 shadow-sm'
                        : 'bg-gray-100 dark:bg-[#161922] text-gray-600 dark:text-cream-muted hover:text-gray-900 dark:hover:text-cream border border-gray-200 dark:border-[#222736]'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3.5 max-h-[620px] overflow-y-auto pr-1">
            {filteredProducts.map((prod) => {
              const prodVariants = productVariantMap.get(prod.id!) || [];
              const totalStock = prodVariants.reduce((sum, v) => sum + (v.currentStock || 0), 0);
              const minPrice = prodVariants.length > 0
                ? Math.min(...prodVariants.map((v) => v.sellingPrice))
                : 0;
              const maxPrice = prodVariants.length > 0
                ? Math.max(...prodVariants.map((v) => v.sellingPrice))
                : 0;

              return (
                <div
                  key={prod.id}
                  onClick={() => setSelectedProductForVariant(prod)}
                  className="group bg-white dark:bg-[#0E1015] border border-gray-200 dark:border-[#1E222D] hover:border-gold/60 dark:hover:border-gold/60 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:shadow-lg relative select-none"
                >
                  <div>
                    {/* Top Row: Brand & Stock Badge */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold truncate">
                        {prod.brand}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          totalStock <= 0
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : totalStock <= 5
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {totalStock <= 0 ? 'Out of Stock' : `${totalStock} in stock`}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-cream line-clamp-2 group-hover:text-gold transition-colors">
                      {prod.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-cream-muted mt-0.5">
                      {prod.categoryName} • {prodVariants.length} Sizes
                    </p>
                  </div>

                  {/* Bottom Row: Price & Action */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-[#1E222D] flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 dark:text-cream-muted">Price</span>
                      <p className="font-bold text-sm text-gray-900 dark:text-cream">
                        {minPrice === maxPrice
                          ? formatCurrency(minPrice)
                          : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
                      </p>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-gold/10 group-hover:bg-gold text-gold group-hover:text-mocca-950 flex items-center justify-center transition-colors">
                      <Plus size={16} />
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full bg-white dark:bg-[#0E1015] border border-gray-200 dark:border-[#1E222D] rounded-2xl p-12 text-center text-gray-500 dark:text-cream-muted">
                <Shirt size={40} className="mx-auto mb-3 text-gray-400 opacity-60" />
                <p className="font-semibold text-sm">No apparel found matching "{searchQuery}"</p>
                <p className="text-xs mt-1">Try another search keyword or switch categories.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Cart, Customer & Checkout (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#0E1015] border border-gray-200 dark:border-[#1E222D] rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[640px]">
            <div className="space-y-4">
              {/* Customer Info Box */}
              <div className="bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-[#1E222D] rounded-xl p-3 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-cream-muted flex items-center gap-1.5">
                    <User size={14} className="text-gold" /> Customer Details
                  </span>
                  {selectedCustomerId && (
                    <span className="text-[10px] font-bold text-gold bg-gold/15 px-2 py-0.5 rounded-full">
                      Loyal Member
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        setShowCustomerSuggestions(true);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0E1015] border border-gray-200 dark:border-[#222736] rounded-lg text-gray-900 dark:text-cream placeholder-gray-400 dark:placeholder-cream-muted/50 focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#0E1015] border border-gray-200 dark:border-[#222736] rounded-lg text-gray-900 dark:text-cream placeholder-gray-400 dark:placeholder-cream-muted/50 focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                {/* Autocomplete Dropdown */}
                {showCustomerSuggestions && filteredCustomerSuggestions.length > 0 && (
                  <div className="absolute left-3 right-3 top-full mt-1 bg-white dark:bg-[#161922] border border-gray-200 dark:border-[#2A2F3D] rounded-xl shadow-xl z-30 overflow-hidden divide-y divide-gray-100 dark:divide-[#1E222D]">
                    {filteredCustomerSuggestions.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        className="p-2.5 hover:bg-gold/10 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-cream">{c.name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-cream-muted">{c.phone}</p>
                        </div>
                        <span className="text-[10px] font-bold text-gold">Select</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart Items Header */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-[#1E222D]">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={16} className="text-gold" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-cream">
                    Current Bill Items ({cart.length})
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-500 dark:text-cream-muted">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} Units
                </span>
              </div>

              {/* Cart List */}
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.variantId}
                    className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-[#1E222D] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-cream truncate">
                        {item.productName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-cream-muted mt-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#0E1015] border border-gray-200 dark:border-[#222736] font-medium">
                          Size {item.size}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#0E1015] border border-gray-200 dark:border-[#222736] font-medium">
                          {item.color}
                        </span>
                        <span>@{formatCurrency(item.sellingPrice)}</span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleUpdateQty(item.variantId, -1)}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-[#0E1015] border border-gray-200 dark:border-[#222736] hover:border-gold flex items-center justify-center text-gray-700 dark:text-cream transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center font-bold text-gray-900 dark:text-cream">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.variantId, 1)}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-[#0E1015] border border-gray-200 dark:border-[#222736] hover:border-gold flex items-center justify-center text-gray-700 dark:text-cream transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Item Total & Delete */}
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-cream">
                        {formatCurrency(item.total)}
                      </span>
                      <button
                        onClick={() => handleRemoveFromCart(item.variantId)}
                        className="p-1 rounded-md text-gray-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {cart.length === 0 && (
                  <div className="py-8 text-center text-gray-400 dark:text-cream-muted border-2 border-dashed border-gray-200 dark:border-[#1E222D] rounded-xl">
                    <ShoppingCart size={28} className="mx-auto mb-2 opacity-40 text-gold" />
                    <p className="text-xs font-semibold">Bill is currently empty</p>
                    <p className="text-[11px] mt-0.5">Click any apparel item from the left catalog to start billing.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Checkout & Payment Section */}
            <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-[#1E222D]">
              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Subtotal, Discount & Totals */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-gray-500 dark:text-cream-muted">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-cream">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-gray-500 dark:text-cream-muted">
                  <span className="flex items-center gap-1">
                    <Tag size={12} className="text-gold" /> Discount (₹)
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-24 text-right px-2 py-0.5 bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-[#222736] rounded text-gray-900 dark:text-cream font-semibold focus:outline-none focus:border-gold"
                  />
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-[#1E222D] flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-gray-900 dark:text-cream">
                      Grand Total
                    </span>
                    <p className="text-[10px] text-emerald-500 font-semibold">
                      Gross Margin: {formatCurrency(estimatedProfit)} ({profitMarginPercent}%)
                    </p>
                  </div>
                  <span className="text-xl font-bold font-serif text-gold">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-cream-muted mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Cash', 'UPI', 'Card', 'Credit'] as PaymentMethod[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setPaymentMethod(mode)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                        paymentMethod === mode
                          ? 'bg-gold text-mocca-950 shadow-sm'
                          : 'bg-gray-100 dark:bg-[#161922] text-gray-600 dark:text-cream-muted hover:text-gray-900 dark:hover:text-cream border border-gray-200 dark:border-[#222736]'
                      }`}
                    >
                      {mode === 'Cash' && <Banknote size={14} />}
                      {mode === 'UPI' && <QrCode size={14} />}
                      {mode === 'Card' && <CreditCard size={14} />}
                      {mode === 'Credit' && <Tag size={14} />}
                      <span>{mode}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* If Cash: Tendered Amount & Change Calculator */}
              {paymentMethod === 'Cash' && grandTotal > 0 && (
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-[#1E222D] grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 dark:text-cream-muted font-bold mb-1">
                      Cash Tendered
                    </label>
                    <input
                      type="number"
                      placeholder={grandTotal.toString()}
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0E1015] border border-gray-200 dark:border-[#222736] rounded-lg text-gray-900 dark:text-cream font-bold focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 dark:text-cream-muted font-bold mb-1">
                      Change to Return
                    </label>
                    <div className="px-2.5 py-1.5 bg-white dark:bg-[#0E1015] border border-gray-200 dark:border-[#222736] rounded-lg font-bold text-emerald-500">
                      {formatCurrency(changeToReturn)}
                    </div>
                  </div>
                </div>
              )}

              {/* Complete Sale Action Button */}
              <button
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCompleteSale}
                className="w-full py-3 px-4 rounded-xl bg-gold hover:bg-gold-light text-mocca-950 font-bold text-sm flex items-center justify-center gap-2 shadow-gold-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-mocca-950 border-t-transparent rounded-full animate-spin" />
                    <span>Processing Bill...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Complete Sale & Print Bill ({formatCurrency(grandTotal)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VARIANT PICKER MODAL (When clicking a product card) */}
      {selectedProductForVariant && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1015] border border-gray-200 dark:border-[#2A2F3D] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gold">
                  {selectedProductForVariant.brand}
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-cream font-serif">
                  {selectedProductForVariant.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-cream-muted mt-0.5">
                  Select apparel size & color variant to add to bill
                </p>
              </div>
              <button
                onClick={() => setSelectedProductForVariant(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-cream transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Variants Matrix */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {(productVariantMap.get(selectedProductForVariant.id!) || []).map((v) => {
                const inCart = cart.find((c) => c.variantId === v.id);
                const isOutOfStock = v.currentStock <= 0;

                return (
                  <div
                    key={v.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                      isOutOfStock
                        ? 'bg-gray-100 dark:bg-[#161922]/50 border-gray-200 dark:border-[#1E222D] opacity-60'
                        : 'bg-gray-50 dark:bg-[#161922] border-gray-200 dark:border-[#1E222D] hover:border-gold/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-gold/15 text-gold border border-gold/30 font-bold">
                          Size: {v.size}
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-cream">
                          {v.color}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-cream-muted mt-1">
                        SKU: {v.sku} • In Stock: <span className="font-bold">{v.currentStock}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-bold text-sm text-gray-900 dark:text-cream">
                          {formatCurrency(v.sellingPrice)}
                        </span>
                      </div>

                      <button
                        disabled={isOutOfStock}
                        onClick={() => handleAddToCart(selectedProductForVariant, v)}
                        className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
                          isOutOfStock
                            ? 'bg-gray-200 dark:bg-[#222736] text-gray-400 cursor-not-allowed'
                            : 'bg-gold hover:bg-gold-light text-mocca-950 shadow-sm'
                        }`}
                      >
                        <Plus size={14} />
                        <span>{inCart ? `Add More (${inCart.quantity})` : 'Add to Bill'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedProductForVariant(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-[#161922] hover:bg-gray-200 dark:hover:bg-[#222736] text-gray-700 dark:text-cream transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED SALE / PRINT RECEIPT MODAL */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0E1015] border border-gray-200 dark:border-[#2A2F3D] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Success Header */}
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={26} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-cream font-serif">
                Bill Generated Successfully
              </h3>
              <p className="text-xs text-gray-500 dark:text-cream-muted">
                Invoice #{completedSale.invoiceNo} has been saved and stock updated.
              </p>
            </div>

            {/* Printable Receipt Preview Card */}
            <div
              id="printable-bill"
              className="bg-gray-50 dark:bg-[#161922] border border-gray-200 dark:border-[#1E222D] rounded-xl p-4 text-xs space-y-3 font-mono print:text-black print:bg-white print:border-none"
            >
              {/* Official Store Brand */}
              <div className="text-center pb-2 border-b border-dashed border-gray-300 dark:border-[#2A2F3D]">
                <img
                  src="/mocca-logo.png"
                  alt="MOCCA"
                  className="w-12 h-12 rounded-full mx-auto mb-1 ring-1 ring-gold/40 object-cover"
                />
                <h4 className="font-bold text-sm tracking-wider font-serif text-gray-900 dark:text-cream">
                  MOCCA
                </h4>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 dark:text-cream-muted">
                  Gents & Boys Collections
                </p>
                <p className="text-[10px] text-gray-500 dark:text-cream-muted mt-0.5">
                  Luxury Menswear & Casual Wear
                </p>
              </div>

              {/* Bill Metadata */}
              <div className="flex justify-between text-[11px] text-gray-600 dark:text-cream-muted pb-2 border-b border-dashed border-gray-300 dark:border-[#2A2F3D]">
                <div>
                  <p>Inv: <span className="font-bold text-gray-900 dark:text-cream">{completedSale.invoiceNo}</span></p>
                  <p>Customer: {completedSale.customerName}</p>
                </div>
                <div className="text-right">
                  <p>{completedSale.date}</p>
                  <p>Cashier: {completedSale.cashierName}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-1 py-1">
                {completedSaleItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[190px]">
                      {item.productName} ({item.size}) x{item.quantity}
                    </span>
                    <span className="font-semibold">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="pt-2 border-t border-dashed border-gray-300 dark:border-[#2A2F3D] space-y-1 text-[11px]">
                <div className="flex justify-between text-gray-500 dark:text-cream-muted">
                  <span>Subtotal</span>
                  <span>{formatCurrency(completedSale.subtotal)}</span>
                </div>
                {completedSale.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-500">
                    <span>Discount</span>
                    <span>-{formatCurrency(completedSale.discountTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-gray-900 dark:text-cream pt-1 border-t border-gray-200 dark:border-[#2A2F3D]">
                  <span>Net Amount</span>
                  <span className="text-gold">{formatCurrency(completedSale.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500 dark:text-cream-muted text-[10px] pt-1">
                  <span>Payment Mode: {completedSale.paymentMethod}</span>
                  <span>Status: Paid</span>
                </div>
              </div>

              {/* Footer Notice */}
              <div className="text-center pt-2 border-t border-dashed border-gray-300 dark:border-[#2A2F3D] text-[9px] text-gray-500 dark:text-cream-muted">
                <p>Thank you for shopping at MOCCA!</p>
                <p>Goods once sold can be exchanged within 7 days with bill.</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handlePrint}
                className="py-2.5 px-4 rounded-xl font-bold text-xs bg-gray-100 hover:bg-gray-200 dark:bg-[#161922] dark:hover:bg-[#222736] text-gray-800 dark:text-cream border border-gray-200 dark:border-[#2A2F3D] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer size={15} /> Print Receipt
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="py-2.5 px-4 rounded-xl font-bold text-xs bg-gold hover:bg-gold-light text-mocca-950 flex items-center justify-center gap-1.5 shadow-gold-glow transition-all"
              >
                <span>New Bill</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
