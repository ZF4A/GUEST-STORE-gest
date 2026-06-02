import { useLanguage } from "@/hooks/useLanguage";
import { trpc } from "@/providers/trpc";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  AlertTriangle,
  Users,
  DollarSign,
} from "lucide-react";
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
} from "recharts";

function formatFCFA(cents: number): string {
  return `${(cents / 100).toLocaleString()} FCFA`;
}

function KpiCard({
  label,
  value,
  trend,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  trend?: { value: number; up: boolean };
  icon: React.ElementType;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-5 border ${
        accent
          ? "bg-[#C8956C]/8 border-[#C8956C]/15"
          : "bg-[#141414] border-white/[0.06]"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <Icon className="w-5 h-5 text-[#C8956C]" strokeWidth={1.5} />
        {trend && (
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              trend.up ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold text-white mb-1">{value}</div>
      <div className="text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium">
        {label}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useLanguage();
  const { data: kpis } = trpc.dashboard.kpis.useQuery(undefined, { refetchInterval: 60000 });
  const { data: revenueData } = trpc.dashboard.revenueChart.useQuery({ period: "week" });
  const { data: storeSales } = trpc.dashboard.salesByStore.useQuery({ period: "today" });
  const { data: recentSales } = trpc.dashboard.recentSales.useQuery({ limit: 10 });
  const { data: lowStock } = trpc.dashboard.lowStock.useQuery({ threshold: 5 });
  const { data: performance } = trpc.dashboard.employeePerformance.useQuery({ period: "week", limit: 5 });

  const trendValue = kpis
    ? kpis.yesterdayRevenue > 0
      ? Math.round(((kpis.todayRevenue - kpis.yesterdayRevenue) / kpis.yesterdayRevenue) * 100)
      : 0
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label={t("Today's Revenue")}
          value={kpis ? formatFCFA(kpis.todayRevenue) : "—"}
          trend={{ value: trendValue, up: trendValue >= 0 }}
          icon={DollarSign}
          accent
        />
        <KpiCard
          label={t("Total Sales")}
          value={kpis ? String(kpis.todaySalesCount) : "—"}
          icon={ShoppingCart}
        />
        <KpiCard
          label={t("Low Stock Alerts")}
          value={kpis ? String(kpis.lowStockCount) : "—"}
          icon={AlertTriangle}
        />
        <KpiCard
          label={t("Active Employees")}
          value={kpis ? String(kpis.activeEmployeeCount) : "—"}
          icon={Users}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-[#141414] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-medium text-white/60 mb-4">{t("Revenue Overview")}</h3>
          {revenueData && revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="yaoundeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C8956C" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#C8956C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="kribiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => new Date(v).toLocaleDateString("en", { weekday: "short" })}
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.2)"
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 100000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1E1E1E",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                  formatter={(value: number) => formatFCFA(value)}
                />
                <Area type="monotone" dataKey="yaounde" stroke="#C8956C" strokeWidth={2} fill="url(#yaoundeGrad)" name="Yaoundé" />
                <Area type="monotone" dataKey="kribi" stroke="#14B8A6" strokeWidth={2} fill="url(#kribiGrad)" name="Kribi" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-white/30">{t("No data")}</div>
          )}
        </div>

        {/* Sales by Store */}
        <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-medium text-white/60 mb-4">{t("Sales by Store")}</h3>
          {storeSales ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[{ name: "Yaoundé", value: storeSales.yaounde }, { name: "Kribi", value: storeSales.kribi }]} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" stroke="rgba(255,255,255,0.2)" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} tickFormatter={(v) => `${(v / 100000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.2)" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} width={70} />
                <Tooltip
                  contentStyle={{ background: "#1E1E1E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => formatFCFA(value)}
                />
                <Bar dataKey="value" fill="#C8956C" radius={[0, 4, 4, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-white/30">{t("No data")}</div>
          )}

          {/* Employee Performance */}
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <h3 className="text-sm font-medium text-white/60 mb-3">{t("Employee Performance")}</h3>
            <div className="space-y-2">
              {performance?.map((emp, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#C8956C]/15 flex items-center justify-center text-[#C8956C] text-xs font-medium flex-shrink-0">
                    {emp.employeeName?.charAt(0) || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white truncate">{emp.employeeName}</span>
                      <span className="text-xs text-white/40 font-mono-id ml-2">{emp.salesCount} sales</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C8956C] rounded-full transition-all"
                        style={{ width: `${Math.min(100, (emp.salesCount / (performance[0]?.salesCount || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!performance || performance.length === 0) && (
                <p className="text-sm text-white/30">{t("No data")}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sales + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Sales */}
        <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-medium text-white/60 mb-4">{t("Recent Sales")}</h3>
          <div className="space-y-0">
            {recentSales?.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white truncate">{sale.employeeName}</span>
                    <span className="text-[10px] text-white/30 font-mono-id bg-white/[0.06] px-1.5 py-0.5 rounded">
                      {sale.employeeId}
                    </span>
                  </div>
                  <div className="text-xs text-white/40 mt-0.5">
                    {sale.storeName} · {new Date(sale.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <span className="text-sm font-medium text-[#C8956C] ml-4 flex-shrink-0">
                  {formatFCFA(sale.totalAmount)}
                </span>
              </div>
            ))}
            {(!recentSales || recentSales.length === 0) && (
              <p className="text-sm text-white/30 py-4">{t("No sales recorded")}</p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-medium text-white/60">{t("Low Stock Alerts")}</h3>
          </div>
          <div className="space-y-0">
            {lowStock?.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-sm text-white truncate block">{item.productName}</span>
                  <span className="text-xs text-white/40">
                    {item.categoryName} · {item.storeName}
                  </span>
                </div>
                <span
                  className={`text-sm font-medium ml-4 flex-shrink-0 ${
                    item.quantity === 0 ? "text-red-400" : "text-amber-400"
                  }`}
                >
                  {item.quantity} left
                </span>
              </div>
            ))}
            {(!lowStock || lowStock.length === 0) && (
              <p className="text-sm text-emerald-400/60 py-4">All stock levels are healthy</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
