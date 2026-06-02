import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { trpc } from "@/providers/trpc";
import { Plus, Search, UserPlus, Copy, Check } from "lucide-react";

export default function Employees() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", storeId: 1, phone: "" });

  const { data, refetch } = trpc.employee.list.useQuery({ search });
  const createEmp = trpc.employee.create.useMutation({
    onSuccess: () => { setShowModal(false); setForm({ name: "", email: "", password: "", storeId: 1, phone: "" }); refetch(); },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input type="text" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-[#141414] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C8956C]/30" />
        </div>
        <button onClick={() => setShowModal(true)}
          className="h-10 px-4 bg-[#C8956C] hover:bg-[#B8855C] text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" /> {t("Create Employee")}
        </button>
      </div>

      {/* Employee list */}
      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-white/30">
          <UserPlus className="w-12 h-12 mb-3" strokeWidth={1} />
          <p>{t("No employees yet")}</p>
        </div>
      ) : (
        <div className="bg-[#141414] border border-white/[0.06] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium">{t("Employee ID")}</th>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium">{t("Name")}</th>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium hidden md:table-cell">{t("Email")}</th>
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium">{t("Store")}</th>
                <th className="text-right px-5 py-3 text-[11px] uppercase tracking-[0.06em] text-white/35 font-medium">Sales</th>
              </tr>
            </thead>
            <tbody>
              {data.map((emp) => (
                <tr key={emp.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <button onClick={() => copyToClipboard(emp.employeeId)}
                      className="inline-flex items-center gap-1.5 text-xs font-mono-id text-[#C8956C] bg-[#C8956C]/10 px-2 py-1 rounded hover:bg-[#C8956C]/20 transition-colors">
                      {emp.employeeId}
                      {copiedId === emp.employeeId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-white">{emp.name}</td>
                  <td className="px-5 py-3.5 text-sm text-white/50 hidden md:table-cell">{emp.email}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2 py-1 rounded-full bg-white/[0.06] text-white/60">{emp.storeName || "—"}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-white/60">{emp.salesCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#1E1E1E] border border-white/[0.10] rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-white mb-4">{t("Create Employee")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1.5">{t("Name")} *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full h-10 px-3 bg-[#0A0A0A] border border-white/[0.12] rounded-lg text-sm text-white focus:outline-none focus:border-[#C8956C]/50" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">{t("Email")} *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full h-10 px-3 bg-[#0A0A0A] border border-white/[0.12] rounded-lg text-sm text-white focus:outline-none focus:border-[#C8956C]/50" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">{t("Password")} * (min 8)</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full h-10 px-3 bg-[#0A0A0A] border border-white/[0.12] rounded-lg text-sm text-white focus:outline-none focus:border-[#C8956C]/50" />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">{t("Store")} *</label>
                <select value={form.storeId} onChange={(e) => setForm({ ...form, storeId: Number(e.target.value) })}
                  className="w-full h-10 px-3 bg-[#0A0A0A] border border-white/[0.12] rounded-lg text-sm text-white focus:outline-none">
                  <option value={1}>{t("Yaoundé")}</option>
                  <option value={2}>{t("Kribi")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">{t("Phone")}</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full h-10 px-3 bg-[#0A0A0A] border border-white/[0.12] rounded-lg text-sm text-white focus:outline-none focus:border-[#C8956C]/50" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 h-10 border border-white/[0.12] text-white/60 rounded-lg text-sm hover:text-white">{t("Cancel")}</button>
              <button onClick={() => { if (form.name && form.email && form.password.length >= 8) createEmp.mutate(form); }}
                disabled={createEmp.isPending || !form.name || !form.email || form.password.length < 8}
                className="flex-1 h-10 bg-[#C8956C] text-white rounded-lg text-sm font-medium hover:bg-[#B8855C] disabled:opacity-50 transition-colors">
                {createEmp.isPending ? t("Loading") : t("Create")}
              </button>
            </div>
            {createEmp.error && <p className="mt-3 text-sm text-red-400">{createEmp.error.message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
