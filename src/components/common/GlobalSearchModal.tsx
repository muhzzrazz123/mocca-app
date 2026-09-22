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
      <div className="w-full max-w-2xl bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-colors">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-[#253745] flex items-center gap-3 bg-gray-50/50 dark:bg-[#11212D]/90">
          <Search size={20} className="text-emerald-500 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apparel, SKUs, invoices, customers, suppliers..."
            autoFocus
            className="flex-1 bg-transparent text-gray-900 dark:text-[#CCD0CF] placeholder-gray-400 dark:placeholder-[#9BA8AB] text-sm outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-[#CCD0CF] text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-[#253745]"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-[#CCD0CF] hover:bg-gray-100 dark:hover:bg-[#253745]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="text-center py-8 text-gray-400 dark:text-[#9BA8AB] text-xs">
              <p className="font-semibold text-gray-900 dark:text-[#CCD0CF] mb-1">Quick Store Search</p>
              <p>Type an item name, SKU, barcode, customer phone, or bill number.</p>
              <div className="flex justify-center gap-2 mt-4 text-[11px]">
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-[#253745] border border-gray-200 dark:border-[#4A5C6A] text-emerald-600 dark:text-emerald-400 font-medium">
                  "Oxford"
                </span>
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-[#253745] border border-gray-200 dark:border-[#4A5C6A] text-emerald-600 dark:text-emerald-400 font-medium">
                  "Cargo"
                </span>
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-[#253745] border border-gray-200 dark:border-[#4A5C6A] text-emerald-600 dark:text-emerald-400 font-medium">
                  "98410"
                </span>
                <span className="px-2 py-1 rounded bg-gray-100 dark:bg-[#253745] border border-gray-200 dark:border-[#4A5C6A] text-emerald-600 dark:text-emerald-400 font-medium">
                  "MOC-2026"
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Products Results */}
              {products.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                    <Shirt size={13} /> Products & Catalog ({products.length})
                  </div>
                  {products.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onNavigate('daily-profit');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#182B3A] hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-gray-200 dark:border-[#253745] hover:border-emerald-500/50 flex items-center justify-between cursor-pointer group transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-[#CCD0CF] group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-[#9BA8AB]">
                          {p.brand} • SKU: {p.sku} • {p.categoryName}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
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
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#182B3A] hover:bg-emerald-500/10 border border-gray-200 dark:border-[#253745] hover:border-emerald-500/50 flex items-center justify-between cursor-pointer group transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-[#CCD0CF]">
                          Bill #{s.invoiceNo} • {s.customerName}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-[#9BA8AB]">
                          {s.date} • {s.paymentMethod}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-500">
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
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#182B3A] hover:bg-blue-500/10 border border-gray-200 dark:border-[#253745] hover:border-emerald-500/50 flex items-center justify-between cursor-pointer group transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-[#CCD0CF] group-hover:text-emerald-400">{c.name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-[#9BA8AB]">
                          {c.phone} • Spent: {formatCurrency(c.totalSpent)}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
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
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#182B3A] hover:bg-purple-500/10 border border-gray-200 dark:border-[#253745] hover:border-emerald-500/50 flex items-center justify-between cursor-pointer group transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-[#CCD0CF] group-hover:text-emerald-400">{s.name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-[#9BA8AB]">{s.phone} • {s.contactPerson}</p>
                      </div>
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
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
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#182B3A] hover:bg-amber-500/10 border border-gray-200 dark:border-[#253745] hover:border-emerald-500/50 flex items-center justify-between cursor-pointer group transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-[#CCD0CF] group-hover:text-emerald-400">{st.name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-[#9BA8AB]">{st.position} • {st.phone}</p>
                      </div>
                      <ArrowRight size={14} className="text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                    </div>
                  ))}
                </div>
              )}

              {products.length === 0 &&
                sales.length === 0 &&
                customers.length === 0 &&
                suppliers.length === 0 &&
                staff.length === 0 && (
                  <p className="text-center py-6 text-xs text-gray-400 dark:text-[#9BA8AB]">
                    No matching records found for "{query}"
                  </p>
                )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-[#253745] bg-gray-50/50 dark:bg-[#11212D]/90 flex items-center justify-between text-[11px] text-gray-500 dark:text-[#9BA8AB]">
          <span>Navigate to modules directly</span>
          <kbd className="bg-gray-100 dark:bg-[#253745] px-2 py-0.5 rounded border border-gray-200 dark:border-[#4A5C6A] text-[10px] font-mono text-gray-700 dark:text-[#CCD0CF]">
            ESC to close
          </kbd>
        </div>
      </div>
    </div>
  );
};
