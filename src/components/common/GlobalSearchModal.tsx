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
        // Toggle
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
        .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q))
        .limit(5)
        .toArray(),
      db.sales
        .filter((s) => s.invoiceNo.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q))
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
        .filter((st) => st.name.toLowerCase().includes(q) || st.position.toLowerCase().includes(q))
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-mocca-900 border border-gold/40 rounded-2xl shadow-luxury overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-mocca-750 flex items-center gap-3 bg-mocca-950/60">
          <Search size={20} className="text-gold shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, SKUs, invoices, customers, suppliers..."
            autoFocus
            className="flex-1 bg-transparent text-cream placeholder:text-mocca-400 text-sm outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-mocca-400 hover:text-cream text-xs px-1.5 py-0.5 rounded bg-mocca-800"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-mocca-400 hover:text-cream hover:bg-mocca-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!query.trim() ? (
            <div className="text-center py-8 text-mocca-400 text-xs">
              <p className="font-semibold text-cream mb-1">Quick Store Search</p>
              <p>Type an item name, SKU, barcode, customer phone, or bill number.</p>
              <div className="flex justify-center gap-2 mt-4 text-[11px]">
                <span className="px-2 py-1 rounded bg-mocca-850 border border-mocca-750 text-gold">
                  "Oxford"
                </span>
                <span className="px-2 py-1 rounded bg-mocca-850 border border-mocca-750 text-gold">
                  "Cargo"
                </span>
                <span className="px-2 py-1 rounded bg-mocca-850 border border-mocca-750 text-gold">
                  "98410"
                </span>
                <span className="px-2 py-1 rounded bg-mocca-850 border border-mocca-750 text-gold">
                  "MOC-2609"
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Products Results */}
              {products.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                    <Shirt size={13} /> Products ({products.length})
                  </div>
                  {products.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        onNavigate('products');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-mocca-850/80 hover:bg-mocca-800 border border-mocca-750/80 flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-cream group-hover:text-gold">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-mocca-400">
                          {p.brand} • SKU: {p.sku} • {p.categoryName}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-mocca-400 group-hover:text-gold" />
                    </div>
                  ))}
                </div>
              )}

              {/* Invoices Results */}
              {sales.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Receipt size={13} /> Invoices & Bills ({sales.length})
                  </div>
                  {sales.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        onNavigate('pos');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-mocca-850/80 hover:bg-mocca-800 border border-mocca-750/80 flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-cream">
                          Bill #{s.invoiceNo} • {s.customerName}
                        </p>
                        <p className="text-[11px] text-mocca-400">
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
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Users size={13} /> Customers ({customers.length})
                  </div>
                  {customers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        onNavigate('customers');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-mocca-850/80 hover:bg-mocca-800 border border-mocca-750/80 flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-cream">{c.name}</p>
                        <p className="text-[11px] text-mocca-400">
                          {c.phone} • Spent: {formatCurrency(c.totalSpent)}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-mocca-400 group-hover:text-gold" />
                    </div>
                  ))}
                </div>
              )}

              {/* Suppliers */}
              {suppliers.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Truck size={13} /> Suppliers ({suppliers.length})
                  </div>
                  {suppliers.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        onNavigate('suppliers');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-mocca-850/80 hover:bg-mocca-800 border border-mocca-750/80 flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-cream">{s.name}</p>
                        <p className="text-[11px] text-mocca-400">{s.phone} • {s.contactPerson}</p>
                      </div>
                      <ArrowRight size={14} className="text-mocca-400 group-hover:text-gold" />
                    </div>
                  ))}
                </div>
              )}

              {/* Staff */}
              {staff.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <UserCheck size={13} /> Staff ({staff.length})
                  </div>
                  {staff.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => {
                        onNavigate('staff');
                        onClose();
                      }}
                      className="p-2.5 rounded-xl bg-mocca-850/80 hover:bg-mocca-800 border border-mocca-750/80 flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <p className="text-xs font-semibold text-cream">{st.name}</p>
                        <p className="text-[11px] text-mocca-400">{st.position} • {st.phone}</p>
                      </div>
                      <ArrowRight size={14} className="text-mocca-400 group-hover:text-gold" />
                    </div>
                  ))}
                </div>
              )}

              {products.length === 0 &&
                sales.length === 0 &&
                customers.length === 0 &&
                suppliers.length === 0 &&
                staff.length === 0 && (
                  <p className="text-center py-6 text-xs text-mocca-400">
                    No matching records found for "{query}"
                  </p>
                )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-mocca-750 bg-mocca-950/60 flex items-center justify-between text-[11px] text-mocca-400">
          <span>Navigate with arrow keys or click</span>
          <kbd className="bg-mocca-850 px-1.5 py-0.5 rounded border border-mocca-700 text-[10px]">
            ESC to close
          </kbd>
        </div>
      </div>
    </div>
  );
};
