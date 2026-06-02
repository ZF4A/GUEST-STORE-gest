import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { trpc } from "@/providers/trpc";
import { ClipboardList } from "lucide-react";

function formatFCFA(cents: number): string {
  return `${(cents / 100).toLocaleString()} FCFA`;
}

export default function MySales() {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.sales.mySales.useQuery({ page, limit: 20 });

  return (
    <div className="space-y-4">
      <div className="bg-[#141414] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium">{t("Date")}</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium hidden md:table-cell">{t("Store")}</th>
              <th className="text-right px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium">{t("Total")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]"><td colSpan={3} className="px-5 py-4"><div className="h-4 bg-white/[0.04] rounded w-3/4 animate-pulse" /></td></tr>
              ))
            ) : data?.items.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-16">
                <div className="flex flex-col items-center text-white/30"><ClipboardList className="w-12 h-12 mb-3" strokeWidth={1} /><p>{t("No sales recorded")}</p></div>
              </td></tr>
            ) : (
              data?.items.map((sale) => (
                <tr key={sale.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 text-sm text-white/60">
                    {new Date(sale.createdAt).toLocaleDateString()} {new Date(sale.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-white/50 hidden md:table-cell">{sale.storeName}</td>
                  <td className="px-5 py-3.5 text-right text-sm font-medium text-[#C8956C]">{formatFCFA(sale.totalAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40">Page {data.page} of {data.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm bg-[#141414] border border-white/[0.08] rounded-lg text-white/60 hover:text-white disabled:opacity-30">Previous</button>
            <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="px-3 py-1.5 text-sm bg-[#141414] border border-white/[0.08] rounded-lg text-white/60 hover:text-white disabled:opacity-30">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
