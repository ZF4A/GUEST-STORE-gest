import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Search, Warehouse, AlertTriangle } from "lucide-react";

export default function StockPage() {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);

  const { data, isLoading } = trpc.inventory.list.useQuery({ search, lowStock: showLowStock });
  const utils = trpc.useUtils();
  const updateStock = trpc.inventory.update.useMutation({
    onSuccess: () => utils.inventory.list.invalidate(),
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "Out of Stock": return "text-red-400 bg-red-400/10";
      case "Low": return "text-amber-400 bg-amber-400/10";
      default: return "text-emerald-400 bg-emerald-400/10";
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input type="text" placeholder={t("Search products...")} value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-[#141414] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C8956C]/30" />
        </div>
        <button onClick={() => setShowLowStock(!showLowStock)}
          className={`h-10 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showLowStock ? "bg-amber-400/15 text-amber-400 border border-amber-400/20" : "bg-[#141414] border border-white/[0.08] text-white/60 hover:text-white"}`}>
          <AlertTriangle className="w-4 h-4" /> Low Stock
        </button>
      </div>

      {/* Stock Table */}
      <div className="bg-[#141414] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium">{t("Name")}</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium">{t("Category")}</th>
              <th className="text-center px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium">Yaoundé</th>
              <th className="text-center px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium">Kribi</th>
              <th className="text-center px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium">{t("Total")}</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium">{t("Status")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]"><td colSpan={6} className="px-5 py-4"><div className="h-4 bg-white/[0.04] rounded w-3/4 animate-pulse" /></td></tr>
              ))
            ) : data?.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16">
                <div className="flex flex-col items-center text-white/30"><Warehouse className="w-12 h-12 mb-3" strokeWidth={1} /><p>No stock data</p></div>
              </td></tr>
            ) : (
              data?.map((item) => (
                <tr key={item.productId} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 text-sm text-white">{item.productName}</td>
                  <td className="px-5 py-3.5 text-sm text-white/50">{item.categoryName}</td>
                  <td className="px-5 py-3.5 text-center text-sm text-white/60">
                    {isAdmin ? (
                      <input
                        type="number"
                        value={item.yaoundeQty}
                        onChange={(e) => updateStock.mutate({ productId: item.productId, storeId: 1, quantity: Number(e.target.value) })}
                        className="w-16 h-8 text-center bg-[#0A0A0A] border border-white/[0.08] rounded text-sm text-white focus:outline-none focus:border-[#C8956C]/30"
                      />
                    ) : (
                      item.yaoundeQty
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center text-sm text-white/60">
                    {isAdmin ? (
                      <input
                        type="number"
                        value={item.kribiQty}
                        onChange={(e) => updateStock.mutate({ productId: item.productId, storeId: 2, quantity: Number(e.target.value) })}
                        className="w-16 h-8 text-center bg-[#0A0A0A] border border-white/[0.08] rounded text-sm text-white focus:outline-none focus:border-[#C8956C]/30"
                      />
                    ) : (
                      item.kribiQty
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center text-sm font-medium text-white">{item.totalQty}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] px-2 py-1 rounded-full font-medium ${statusColor(item.status)}`}>
                      {t(item.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
