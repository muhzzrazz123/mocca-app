import React, { useState, useEffect } from 'react';
import { Search, X, Shirt, Receipt, Users, Truck, UserCheck, ArrowRight } from 'lucide-react';
import { db } from '../../db/db';
import type { Product, Sale, Customer, Supplier, Staff } from '../../types';
import type { NavItemKey } from '../layout/Sidebar';
import { formatCurrency } from '../../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavItemKey) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setSales([]);
      setCustomers([]);
      setSuppliers([]);
      setStaff([]);
      return;
    }

    const q = query.toLowerCase().trim();

    // Query DB
    Promise.all([
      db.products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.barcode.includes(q)
        )
        .limit(5)
        .toArray(),
      db.sales
        .filter(
          (s) =>
            s.invoiceNo.toLowerCase().includes(q) ||
            s.customerName.toLowerCase().includes(q)
        )
        .limit(5)
        .toArray(),
      db.customers
        .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
        .limit(5)
        .toArray(),
      db.suppliers
        .filter((s) => s.name.toLowerCase().includes(q) || s.phone.includes(q))
        .limit(5)
        .toArray(),
      db.staff
        .filter(
          (st) =>
            st.name.toLowerCase().includes(q) ||
            st.position.toLowerCase().includes(q)
        )
        .limit(5)
        .toArray(),
    ]).then(([prods, sls, custs, supps, stfs]) => {
      setProducts(prods);
      setSales(sls);
      setCustomers(custs);
      setSuppliers(supps);
      setStaff(stfs);
    });
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0E1015] border border-gray-200 dark:border-[#2A2F3D] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-colors">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-[#1E222D] flex items-center gap-3 bg-gray-50/50 dark:bg-[#0E1015]/60">
          <Search size={20} className="text-gold shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apparel, SKUs, invoices, customers, suppliers..."
            autoFocus
            className="flex-1 bg-transparent text-gray-900 dark:text-cream placeholder-gray-400 dark:placeholder-cream-muted/50 text-sm outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-cream text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-[#161922]"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-cream hover:bg-gray-100 dark:hover:bg-[#161922]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="text-center py-8 text-gray-400 dark:text-cream-muted text-xs">
              <p className="font-semibold text-gray-900 dark:text-cream mb-1">Quick Store Search</p>
              <p>Type an item name, SKU, barcode, customer phone, or bill number.</p>
              <div className="flex justify-center gap-2 mt-4 text-[11px]">
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-[#161922] border border-gray-200 dark:border-[#222736] text-gold font-medium">
                  "Oxford"
                </span>
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-[#161922] border border-gray-200 dark:border-[#222736] text-gold font-medium">
                  "Cargo"
                </span>
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-[#161922] border border-gray-200 dark:border-[#222736] text-gold font-medium">
                  "98410"
                </span>
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-[#161922] border border-gray-200 dark:border-[#222736] text-gold font-medium">
                  "MOC-2026"
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Products Results */}
              {products.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                    <Shirt size={13} /> Products & Catalog ({products.length})
                  </div>
                  {products.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onNavigate('daily-profit');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#161922] hover:bg-gold/10 border border-gray-200 dark:border-[#1E222D] flex items-center justify-between cursor-pointer group transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-cream group-hover:text-gold">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-cream-muted">
                          {p.brand} • SKU: {p.sku} • {p.categoryName}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-gold" />
                    </div>
                  ))}
                </div>
              )}

              {/* Invoices Results */}
              {sales.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                    <Receipt size={13} /> Invoices & Bills ({sales.length})
                  </div>
                  {sales.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        onNavigate('daily-profit');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#161922] hover:bg-emerald-500/10 border border-gray-200 dark:border-[#1E222D] flex items-center justify-between cursor-pointer group transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-cream">
                          Bill #{s.invoiceNo} • {s.customerName}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-cream-muted">
                          {s.date} • {s.paymentMethod}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gold">
                          {formatCurrency(s.grandTotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Customers Results */}
              {customers.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                    <Users size={13} /> Customers ({customers.length})
                  </div>
                  {customers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        onNavigate('billing');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#161922] hover:bg-blue-500/10 border border-gray-200 dark:border-[#1E222D] flex items-center justify-between cursor-pointer group transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-cream">{c.name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-cream-muted">
                          {c.phone} • Spent: {formatCurrency(c.totalSpent)}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-gold" />
                    </div>
                  ))}
                </div>
              )}

              {/* Suppliers */}
              {suppliers.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-500 flex items-center gap-1.5">
                    <Truck size={13} /> Suppliers ({suppliers.length})
                  </div>
                  {suppliers.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        onNavigate('accounts');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#161922] hover:bg-purple-500/10 border border-gray-200 dark:border-[#1E222D] flex items-center justify-between cursor-pointer group transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-cream">{s.name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-cream-muted">{s.phone} • {s.contactPerson}</p>
                      </div>
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-gold" />
                    </div>
                  ))}
                </div>
              )}

              {/* Staff */}
              {staff.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <UserCheck size={13} /> Staff ({staff.length})
                  </div>
                  {staff.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => {
                        onNavigate('staff');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#161922] hover:bg-amber-500/10 border border-gray-200 dark:border-[#1E222D] flex items-center justify-between cursor-pointer group transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-cream">{st.name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-cream-muted">{st.position} • {st.phone}</p>
                      </div>
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-gold" />
                    </div>
                  ))}
                </div>
              )}

              {products.length === 0 &&
                sales.length === 0 &&
                customers.length === 0 &&
                suppliers.length === 0 &&
                staff.length === 0 && (
                  <p className="text-center py-6 text-xs text-gray-400 dark:text-cream-muted">
                    No matching records found for "{query}"
                  </p>
                )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-[#1E222D] bg-gray-50/50 dark:bg-[#0E1015]/60 flex items-center justify-between text-[11px] text-gray-500 dark:text-cream-muted">
          <span>Navigate to modules directly</span>
          <kbd className="bg-gray-100 dark:bg-[#161922] px-2 py-0.5 rounded border border-gray-200 dark:border-[#222736] text-[10px] font-mono">
            ESC to close
          </kbd>
        </div>
      </div>
    </div>
  );
};
