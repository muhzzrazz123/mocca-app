import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { Trophy, TrendingUp, CreditCard, PieChart as PieIcon } from 'lucide-react';

interface ChartTrendData {
  date: string;
  sales: number;
  profit: number;
}

interface CategorySalesData {
  category: string;
  amount: number;
  units: number;
}

interface PaymentMethodData {
  name: string;
  value: number;
  color: string;
}

interface TopProductItem {
  id: number;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  grossProfit: number;
}

interface ChartsSectionProps {
  trendData: ChartTrendData[];
  categoryData: CategorySalesData[];
  paymentData: PaymentMethodData[];
  topProducts: TopProductItem[];
  canViewProfit?: boolean;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  trendData,
  categoryData,
  paymentData,
  topProducts,
  canViewProfit = true,
}) => {
  // Custom Tooltip with crisp black text on white
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] p-3 rounded-xl shadow-lg text-xs space-y-1">
          <p className="font-bold text-[#06141B] dark:text-[#CCD0CF] mb-1">{label}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} style={{ color: item.color }} className="font-bold">
              {item.name}: {formatCurrency(item.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Row: Sales & Profit Trend (Left) + Top Selling Products (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <TrendingUp size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#06141B] dark:text-[#CCD0CF] uppercase tracking-wider">
                  Sales & Profit Trajectory
                </h3>
                <p className="text-xs text-[#4A5C6A] dark:text-[#9BA8AB] font-medium">Revenue and gross margin timeline</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-[#06141B] dark:text-[#CCD0CF]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Sales
              </span>
              {canViewProfit && (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Profit
                </span>
              )}
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#34D399" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Gross Sales"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
                {canViewProfit && (
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Gross Profit"
                    stroke="#059669"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#profitGrad)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products List */}
        <div className="bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <Trophy size={18} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#06141B] dark:text-[#CCD0CF] uppercase tracking-wider">
                    Top Sellers
                  </h3>
                  <p className="text-xs text-[#4A5C6A] dark:text-[#9BA8AB] font-medium">By volume & revenue</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                Live Data
              </span>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-[#253745]">
              {topProducts.slice(0, 4).map((p, index) => (
                <div key={p.id || index} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-[#182B3A] text-[#06141B] dark:text-[#CCD0CF] text-[10px] font-bold flex items-center justify-center border border-gray-300 dark:border-[#253745] shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#06141B] dark:text-[#CCD0CF] truncate">{p.name}</p>
                      <p className="text-[11px] text-[#4A5C6A] dark:text-[#9BA8AB] truncate font-medium">{p.category}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(p.revenue)}</p>
                    <p className="text-[10px] text-gray-500 dark:text-[#9BA8AB] font-semibold">{p.unitsSold} units sold</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 text-center border-t border-gray-200 dark:border-[#253745]">
            <span className="text-xs text-[#4A5C6A] dark:text-[#9BA8AB] font-medium">
              Rankings refresh automatically on every completed sale
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Sales by Category (Bar) + Payment Methods (Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales by Category */}
        <div className="lg:col-span-2 bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <PieIcon size={18} className="stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#06141B] dark:text-[#CCD0CF] uppercase tracking-wider">
                  Category Revenue Performance
                </h3>
                <p className="text-xs text-[#4A5C6A] dark:text-[#9BA8AB] font-medium">Total sales volume per apparel collection</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" vertical={false} />
                <XAxis
                  dataKey="category"
                  stroke="#64748B"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="#64748B"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="amount"
                  name="Category Sales"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-white dark:bg-[#11212D] border border-gray-300 dark:border-[#253745] rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <CreditCard size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#06141B] dark:text-[#CCD0CF] uppercase tracking-wider">
                Payment Breakdown
              </h3>
              <p className="text-xs text-[#4A5C6A] dark:text-[#9BA8AB] font-medium">Cash, UPI, Card & Store Credit</p>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => formatCurrency(val)}
                  contentStyle={{
                    backgroundColor: '#11212D',
                    borderColor: '#253745',
                    borderRadius: '0.75rem',
                    color: '#CCD0CF',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Table */}
          <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-200 dark:border-[#253745] pt-3">
            {paymentData.map((p) => (
              <div key={p.name} className="flex items-center justify-between p-2 rounded-lg bg-gray-100 dark:bg-[#182B3A] border border-gray-200 dark:border-[#253745]">
                <span className="flex items-center gap-1.5 text-gray-800 dark:text-[#CCD0CF] truncate font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  {p.name}
                </span>
                <span className="font-extrabold text-[#06141B] dark:text-[#CCD0CF]">{formatCurrency(p.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
