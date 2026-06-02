import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { trpc } from "@/providers/trpc";
import { ScrollText, ShoppingCart, Package, Users, Key, LogIn, LogOut } from "lucide-react";

const actionConfig: Record<string, { icon: React.ElementType; color: string }> = {
  SALE: { icon: ShoppingCart, color: "text-[#C8956C] bg-[#C8956C]/10" },
  STOCK_UPDATE: { icon: Package, color: "text-teal-400 bg-teal-400/10" },
  LOGIN: { icon: LogIn, color: "text-blue-400 bg-blue-400/10" },
  LOGOUT: { icon: LogOut, color: "text-white/40 bg-white/[0.06]" },
  EMPLOYEE_CREATED: { icon: Users, color: "text-purple-400 bg-purple-400/10" },
  EMPLOYEE_UPDATED: { icon: Users, color: "text-purple-400 bg-purple-400/10" },
  PASSWORD_CHANGED: { icon: Key, color: "text-amber-400 bg-amber-400/10" },
  PRODUCT_CREATED: { icon: Package, color: "text-teal-400 bg-teal-400/10" },
  PRODUCT_UPDATED: { icon: Package, color: "text-teal-400 bg-teal-400/10" },
  PRODUCT_DELETED: { icon: Package, color: "text-red-400 bg-red-400/10" },
  CATEGORY_CREATED: { icon: Package, color: "text-teal-400 bg-teal-400/10" },
  CATEGORY_DELETED: { icon: Package, color: "text-red-400 bg-red-400/10" },
};

export default function AuditLog() {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.audit.list.useQuery({ page, limit: 50 });

  return (
    <div className="space-y-4">
      <div className="bg-[#141414] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium">{t("Date")}</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium">{t("Action")}</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium">{t("Employee")}</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium hidden lg:table-cell">Description</th>
              <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium hidden md:table-cell">{t("Store")}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-white/[0.04]"><td colSpan={5} className="px-5 py-4"><div className="h-4 bg-white/[0.04] rounded w-3/4 animate-pulse" /></td></tr>
              ))
            ) : data?.items.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-16">
                <div className="flex flex-col items-center text-white/30"><ScrollText className="w-12 h-12 mb-3" strokeWidth={1} /><p>No activity recorded</p></div>
              </td></tr>
            ) : (
              data?.items.map((log) => {
                const config = actionConfig[log.action] || { icon: ScrollText, color: "text-white/40 bg-white/[0.06]" };
                const Icon = config.icon;
                return (
                  <tr key={log.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5 text-sm text-white/40 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full font-medium ${config.color}`}>
                        <Icon className="w-3 h-3" /> {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">{log.actorName}</span>
                        <span className="text-[10px] text-white/30 font-mono-id">{log.actorRole}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-white/50 hidden lg:table-cell max-w-xs truncate">{log.description}</td>
                    <td className="px-5 py-3.5 text-sm text-white/40 hidden md:table-cell">{log.storeName || "—"}</td>
                  </tr>
                );
              })
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
