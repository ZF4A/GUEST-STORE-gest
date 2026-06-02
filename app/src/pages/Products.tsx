import { useState, useRef } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { trpc } from "@/providers/trpc";
import {
  Plus, Search, Pencil, Trash2, Package, X, Upload, ImageOff,
  ChevronLeft, ChevronRight, Tag, Palette, AlertTriangle,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────
function formatFCFA(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-FR")} FCFA`;
}
function stockBadge(qty: number) {
  if (qty === 0) return "bg-red-500/15 text-red-400 border-red-500/20";
  if (qty <= 5) return "bg-amber-500/15 text-amber-400 border-amber-500/20";
  return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
}

const PRESET_COLORS = [
  { name: "Black",  hex: "#1a1a1a" }, { name: "White",  hex: "#f5f5f5" },
  { name: "Red",    hex: "#DC2626" }, { name: "Navy",   hex: "#1e3a5f" },
  { name: "Brown",  hex: "#6B3A2A" }, { name: "Beige",  hex: "#D4B483" },
  { name: "Gold",   hex: "#C8956C" }, { name: "Rose",   hex: "#F472B6" },
  { name: "Green",  hex: "#16a34a" }, { name: "Blue",   hex: "#2563EB" },
  { name: "Purple", hex: "#9333EA" }, { name: "Gray",   hex: "#6B7280" },
  { name: "Camel",  hex: "#C19A6B" }, { name: "Olive",  hex: "#6B7F23" },
  { name: "Coral",  hex: "#FF6B6B" }, { name: "Mint",   hex: "#3EB489" },
];

const EMPTY_FORM = { name: "", categoryId: 0, price: "", yaoundeStock: "", kribiStock: "", imageUrl: "" };
const EMPTY_VARIANT = { colorName: "", colorHex: "#C8956C", yaoundeQty: "0", kribiQty: "0" };

type FormState = typeof EMPTY_FORM;
type VariantFormState = typeof EMPTY_VARIANT;

// ─── Color variant row ───────────────────────────────────────────────────────
function VariantRow({
  v, t, onDelete,
}: {
  v: { id: number; colorName: string; colorHex: string; yaoundeQty: number; kribiQty: number; totalQty: number };
  t: (k: string, p?: Record<string, string>) => string;
  onDelete: (id: number, name: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#0D0D0D] rounded-lg border border-white/[0.08] group">
      <span className="w-5 h-5 rounded-full flex-shrink-0 ring-1 ring-white/10" style={{ backgroundColor: v.colorHex }} />
      <span className="flex-1 text-sm text-white font-medium truncate">{v.colorName}</span>
      <div className="flex items-center gap-1.5 text-[10px] font-medium">
        <span className={`px-1.5 py-0.5 rounded border ${stockBadge(v.yaoundeQty)}`}>Y·{v.yaoundeQty}</span>
        <span className={`px-1.5 py-0.5 rounded border ${stockBadge(v.kribiQty)}`}>K·{v.kribiQty}</span>
      </div>
      <button
        onClick={() => onDelete(v.id, v.colorName)}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-white/30 hover:text-red-400 transition-all"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Color variant add form ──────────────────────────────────────────────────
function AddVariantForm({
  productId, t, onDone,
}: { productId: number; t: (k: string, p?: Record<string, string>) => string; onDone: () => void }) {
  const [form, setForm] = useState<VariantFormState>(EMPTY_VARIANT);
  const utils = trpc.useUtils();
  const upsert = trpc.variant.upsert.useMutation({
    onSuccess: () => {
      utils.variant.list.invalidate({ productId });
      utils.product.list.invalidate();
      setForm(EMPTY_VARIANT);
      onDone();
    },
  });

  function handleSave() {
    if (!form.colorName.trim()) return;
    upsert.mutate({
      productId,
      colorName: form.colorName.trim(),
      colorHex: form.colorHex,
      yaoundeQty: parseInt(form.yaoundeQty) || 0,
      kribiQty: parseInt(form.kribiQty) || 0,
    });
  }

  return (
    <div className="border border-[#C8956C]/30 bg-[#0D0D0D] rounded-xl p-4 space-y-3">
      {/* Preset swatches */}
      <div className="flex flex-wrap gap-1.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c.hex}
            type="button"
            title={c.name}
            onClick={() => setForm((f) => ({ ...f, colorHex: c.hex, colorName: f.colorName || c.name }))}
            className={`w-6 h-6 rounded-full ring-offset-[#0D0D0D] transition-all ${
              form.colorHex === c.hex ? "ring-2 ring-[#C8956C] ring-offset-2 scale-110" : "hover:scale-110"
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
        <label className="w-6 h-6 rounded-full overflow-hidden cursor-pointer ring-offset-[#0D0D0D] hover:scale-110 transition-all" title="Custom">
          <input type="color" value={form.colorHex} onChange={(e) => setForm((f) => ({ ...f, colorHex: e.target.value }))} className="opacity-0 w-full h-full cursor-pointer" />
          <div className="w-full h-full -mt-6 rounded-full border border-dashed border-white/30 flex items-center justify-center">
            <Plus className="w-3 h-3 text-white/40" />
          </div>
        </label>
      </div>

      {/* Color name */}
      <input
        type="text"
        placeholder={t("Color name placeholder")}
        value={form.colorName}
        onChange={(e) => setForm((f) => ({ ...f, colorName: e.target.value }))}
        className="w-full h-9 px-3 bg-[#1A1A1A] border border-white/[0.10] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C8956C]/50"
      />

      {/* Quantities */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] text-white/40 mb-1">{t("Yaoundé Stock")}</label>
          <input
            type="number" min="0" value={form.yaoundeQty}
            onChange={(e) => setForm((f) => ({ ...f, yaoundeQty: e.target.value }))}
            className="w-full h-9 px-3 bg-[#1A1A1A] border border-white/[0.10] rounded-lg text-sm text-white focus:outline-none focus:border-[#C8956C]/50"
          />
        </div>
        <div>
          <label className="block text-[11px] text-white/40 mb-1">{t("Kribi Stock")}</label>
          <input
            type="number" min="0" value={form.kribiQty}
            onChange={(e) => setForm((f) => ({ ...f, kribiQty: e.target.value }))}
            className="w-full h-9 px-3 bg-[#1A1A1A] border border-white/[0.10] rounded-lg text-sm text-white focus:outline-none focus:border-[#C8956C]/50"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!form.colorName.trim() || upsert.isPending}
          className="flex-1 h-9 bg-[#C8956C] hover:bg-[#B8855C] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
        >
          {upsert.isPending ? "..." : t("Save Color")}
        </button>
        <button onClick={onDone} className="h-9 px-3 border border-white/[0.10] text-white/50 hover:text-white rounded-lg text-sm transition-colors">
          {t("Cancel")}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Products() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [deleteError, setDeleteError] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, refetch } = trpc.product.list.useQuery({ page, limit: 20, search, categoryId: categoryFilter });
  const { data: categories } = trpc.category.list.useQuery();
  const { data: variants, refetch: refetchVariants } = trpc.variant.list.useQuery(
    { productId: editingId! },
    { enabled: !!editingId }
  );
  const utils = trpc.useUtils();

  const createProduct = trpc.product.create.useMutation({ onSuccess: () => { closeDrawer(); refetch(); } });
  const updateProduct = trpc.product.update.useMutation({ onSuccess: () => { closeDrawer(); refetch(); } });
  const deleteProduct = trpc.product.delete.useMutation({
    onSuccess: () => refetch(),
    onError: (err) => setDeleteError(err.message),
  });
  const deleteVariant = trpc.variant.delete.useMutation({
    onSuccess: () => { utils.variant.list.invalidate({ productId: editingId! }); refetch(); },
  });

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImagePreview("");
    setShowVariantForm(false);
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, categoryId: categories?.[0]?.id ?? 0 });
    setImagePreview("");
    setShowVariantForm(false);
    setDrawerOpen(true);
  }

  function openEdit(product: any) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      categoryId: product.categoryId,
      price: String(product.price / 100),
      yaoundeStock: String(product.yaoundeQty ?? 0),
      kribiStock: String(product.kribiQty ?? 0),
      imageUrl: product.imageUrl ?? "",
    });
    setImagePreview(product.imageUrl ?? "");
    setShowVariantForm(false);
    setDrawerOpen(true);
  }

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.url) { setForm((f) => ({ ...f, imageUrl: json.url })); setImagePreview(json.url); }
    } finally { setUploading(false); }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0]; if (file) uploadFile(file);
  }

  function handleSubmit() {
    const priceNum = parseFloat(form.price);
    if (!form.name.trim() || !form.categoryId || isNaN(priceNum) || priceNum <= 0) return;
    if (editingId) {
      updateProduct.mutate({ id: editingId, name: form.name.trim(), categoryId: form.categoryId, price: Math.round(priceNum * 100), imageUrl: form.imageUrl || undefined });
    } else {
      createProduct.mutate({ name: form.name.trim(), categoryId: form.categoryId, price: Math.round(priceNum * 100), imageUrl: form.imageUrl || undefined, yaoundeStock: parseInt(form.yaoundeStock) || 0, kribiStock: parseInt(form.kribiStock) || 0 });
    }
  }

  function handleDelete(product: { id: number; name: string }) {
    setDeleteError("");
    if (confirm(t("Delete product confirm", { name: product.name }))) {
      deleteProduct.mutate({ id: product.id });
    }
  }

  const isPending = createProduct.isPending || updateProduct.isPending;
  const isValid = form.name.trim() && form.categoryId && parseFloat(form.price) > 0;

  return (
    <div className="space-y-4">

      {/* Delete error banner */}
      {deleteError && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="flex-1">{t("Has sales warning")}</span>
          <button onClick={() => setDeleteError("")} className="text-red-400/60 hover:text-red-400"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text" placeholder={t("Search products...")} value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-10 pl-10 pr-4 bg-[#141414] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C8956C]/30"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 sm:pb-0">
          <button
            onClick={() => setCategoryFilter(undefined)}
            className={`h-10 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${!categoryFilter ? "bg-[#C8956C] border-[#C8956C] text-white" : "bg-[#141414] border-white/[0.08] text-white/50 hover:text-white"}`}
          >{t("All")}</button>
          {categories?.map((c) => (
            <button key={c.id} onClick={() => setCategoryFilter(categoryFilter === c.id ? undefined : c.id)}
              className={`h-10 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${categoryFilter === c.id ? "bg-[#C8956C] border-[#C8956C] text-white" : "bg-[#141414] border-white/[0.08] text-white/50 hover:text-white"}`}
            >{t(c.name)}</button>
          ))}
        </div>

        <button onClick={openCreate} className="h-10 px-5 bg-[#C8956C] hover:bg-[#B8855C] text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors shrink-0 shadow-lg shadow-[#C8956C]/20">
          <Plus className="w-4 h-4" />{t("Add Product")}
        </button>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-[#141414] border border-white/[0.06] rounded-xl overflow-hidden animate-pulse">
              <div className="h-44 bg-white/[0.04]" />
              <div className="p-3 space-y-2"><div className="h-3.5 bg-white/[0.06] rounded w-3/4" /><div className="h-3 bg-white/[0.04] rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-white/30">
          <Package className="w-14 h-14 mb-4" strokeWidth={1} />
          <p className="text-base">{t("No products yet")}</p>
          <p className="text-sm mt-1 text-white/20">{t("Click to add product")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {data?.items.map((product) => {
              const hasVariants = product.variants && product.variants.length > 0;
              const colorCount = product.variants?.length ?? 0;
              const colorLabel = colorCount === 1 ? `1 ${t("color singular")}` : colorCount > 1 ? `${colorCount} ${t("color plural")}` : null;

              return (
                <div key={product.id} className="group bg-[#141414] border border-white/[0.06] rounded-xl overflow-hidden hover:border-[#C8956C]/30 hover:shadow-lg hover:shadow-black/40 transition-all duration-200">
                  {/* Image */}
                  <div className="relative h-44 bg-[#0D0D0D] flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <Package className="w-10 h-10 text-white/10" strokeWidth={1} />
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={() => openEdit(product)} title={t("Edit")} className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#C8956C] flex items-center justify-center text-white transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product)} title={t("Delete")} className="w-9 h-9 rounded-full bg-white/10 hover:bg-red-500 flex items-center justify-center text-white transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Color count badge */}
                    {colorLabel && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/70 rounded-full text-[10px] text-white/80 backdrop-blur-sm">
                        <Palette className="w-3 h-3" />
                        {colorLabel}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-2">
                    <h3 className="text-sm font-medium text-white leading-snug line-clamp-2">{product.name}</h3>
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#C8956C] bg-[#C8956C]/10 border border-[#C8956C]/20 px-2 py-0.5 rounded-full">
                      <Tag className="w-3 h-3" />
                      {t(product.categoryName ?? "")}
                    </span>

                    {/* Color swatches */}
                    {hasVariants && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {product.variants!.slice(0, 8).map((v) => (
                          <div key={v.id} title={`${v.colorName}: Y·${v.yaoundeQty} K·${v.kribiQty}`}
                            className="w-4 h-4 rounded-full ring-1 ring-white/10 flex-shrink-0"
                            style={{ backgroundColor: v.colorHex }}
                          />
                        ))}
                        {product.variants!.length > 8 && (
                          <span className="text-[10px] text-white/30">+{product.variants!.length - 8}</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-sm font-bold text-white">{formatFCFA(product.price)}</span>
                      <div className="flex gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${stockBadge(product.yaoundeQty)}`}>Y·{product.yaoundeQty}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${stockBadge(product.kribiQty)}`}>K·{product.kribiQty}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#141414] border border-white/[0.08] text-white/60 hover:text-white disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-white/40">{page} / {data.totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#141414] border border-white/[0.08] text-white/60 hover:text-white disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Slide-in Drawer ── */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#141414] border-l border-white/[0.08] flex flex-col shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
              <div>
                <h2 className="text-base font-semibold text-white">{editingId ? t("Edit Product") : t("New Product")}</h2>
                <p className="text-xs text-white/40 mt-0.5">{t("Fill in details")}</p>
              </div>
              <button onClick={closeDrawer} className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white/60 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">{t("Product Image")}</label>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => !uploading && fileRef.current?.click()}
                  className={`relative h-48 rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden ${
                    dragOver ? "border-[#C8956C] bg-[#C8956C]/10" : imagePreview ? "border-white/[0.12] hover:border-[#C8956C]/40" : "border-white/[0.12] hover:border-[#C8956C]/40 bg-[#0D0D0D]"
                  }`}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <Upload className="w-6 h-6 text-white" />
                        <span className="text-sm text-white font-medium">{t("Change image")}</span>
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setImagePreview(""); setForm((f) => ({ ...f, imageUrl: "" })); }}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : uploading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-[#C8956C]/30 border-t-[#C8956C] rounded-full animate-spin" />
                      <span className="text-sm text-white/50">{t("Uploading")}</span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/30">
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center">
                        <ImageOff className="w-7 h-7" strokeWidth={1.5} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-white/50">{t("Drag drop image")}</p>
                        <p className="text-xs text-white/25 mt-1">{t("Or click to browse")}</p>
                        <p className="text-[11px] text-white/20 mt-0.5">{t("Accepted formats")}</p>
                      </div>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">{t("Name")} <span className="text-[#C8956C]">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder={t("Product name placeholder")}
                  className="w-full h-10 px-3 bg-[#0D0D0D] border border-white/[0.10] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C8956C]/50 transition-colors" />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">{t("Category")} <span className="text-[#C8956C]">*</span></label>
                {categories && categories.length > 0 ? (
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                    {categories.map((c) => (
                      <button key={c.id} type="button" onClick={() => setForm((f) => ({ ...f, categoryId: c.id }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${form.categoryId === c.id ? "bg-[#C8956C] border-[#C8956C] text-white shadow-md shadow-[#C8956C]/20" : "bg-[#0D0D0D] border-white/[0.10] text-white/50 hover:text-white hover:border-white/20"}`}>
                        {t(c.name)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/30 italic">{t("No categories create first")}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">{t("Price")} (FCFA) <span className="text-[#C8956C]">*</span></label>
                <div className="relative">
                  <input type="number" min="0" step="100" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0"
                    className="w-full h-10 px-3 pr-14 bg-[#0D0D0D] border border-white/[0.10] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C8956C]/50 transition-colors" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 font-medium">FCFA</span>
                </div>
                {form.price && parseFloat(form.price) > 0 && (
                  <p className="text-xs text-[#C8956C]/70 mt-1">= {formatFCFA(Math.round(parseFloat(form.price) * 100))}</p>
                )}
              </div>

              {/* Initial stock (create only, no variants) */}
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">{t("Initial Stock")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-white/40 mb-1">{t("Yaoundé")}</label>
                      <input type="number" min="0" value={form.yaoundeStock} onChange={(e) => setForm((f) => ({ ...f, yaoundeStock: e.target.value }))} placeholder="0"
                        className="w-full h-10 px-3 bg-[#0D0D0D] border border-white/[0.10] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C8956C]/50 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">{t("Kribi")}</label>
                      <input type="number" min="0" value={form.kribiStock} onChange={(e) => setForm((f) => ({ ...f, kribiStock: e.target.value }))} placeholder="0"
                        className="w-full h-10 px-3 bg-[#0D0D0D] border border-white/[0.10] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#C8956C]/50 transition-colors" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Colors & Variants (edit mode only) ── */}
              {editingId && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-[#C8956C]" />
                      <span className="text-sm font-medium text-white">{t("Colors")}</span>
                      {variants && variants.length > 0 && (
                        <span className="text-xs text-white/40 bg-white/[0.06] px-2 py-0.5 rounded-full">
                          {variants.length === 1 ? `1 ${t("color singular")}` : `${variants.length} ${t("color plural")}`}
                          {" · "}
                          {t("Total")}: {variants.reduce((s, v) => s + v.totalQty, 0)}
                        </span>
                      )}
                    </div>
                    {!showVariantForm && (
                      <button onClick={() => setShowVariantForm(true)}
                        className="flex items-center gap-1 text-xs text-[#C8956C] hover:text-[#B8855C] font-medium transition-colors">
                        <Plus className="w-3.5 h-3.5" />{t("Add Color")}
                      </button>
                    )}
                  </div>

                  {/* Existing variants */}
                  <div className="space-y-2 mb-3">
                    {!variants || variants.length === 0 ? (
                      !showVariantForm && (
                        <p className="text-xs text-white/30 italic text-center py-4 border border-dashed border-white/[0.08] rounded-lg">{t("No colors yet")}</p>
                      )
                    ) : (
                      variants.map((v) => (
                        <VariantRow key={v.id} v={v} t={t}
                          onDelete={(id, name) => {
                            if (confirm(t("Delete color confirm", { name }))) deleteVariant.mutate({ id });
                          }}
                        />
                      ))
                    )}
                  </div>

                  {/* Stat summary */}
                  {variants && variants.length > 0 && (
                    <div className="bg-[#0D0D0D] border border-white/[0.06] rounded-xl p-3 mb-2">
                      <p className="text-[11px] text-white/40 uppercase tracking-wider mb-2">{t("Total")} par couleur</p>
                      <div className="space-y-1.5">
                        {variants.map((v) => (
                          <div key={v.id} className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: v.colorHex }} />
                            <span className="flex-1 text-xs text-white/70 truncate">{v.colorName}</span>
                            <div className="flex gap-2 text-[10px]">
                              <span className="text-white/40">Y: <span className="text-white/70 font-medium">{v.yaoundeQty}</span></span>
                              <span className="text-white/40">K: <span className="text-white/70 font-medium">{v.kribiQty}</span></span>
                              <span className="text-[#C8956C] font-bold">{v.totalQty}</span>
                            </div>
                          </div>
                        ))}
                        <div className="border-t border-white/[0.06] pt-1.5 flex justify-between text-xs">
                          <span className="text-white/40">{t("Total")}</span>
                          <span className="text-[#C8956C] font-bold">{variants.reduce((s, v) => s + v.totalQty, 0)} unités</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add variant form */}
                  {showVariantForm && (
                    <AddVariantForm productId={editingId} t={t} onDone={() => { setShowVariantForm(false); refetchVariants(); }} />
                  )}
                </div>
              )}

              {/* Errors */}
              {(createProduct.error || updateProduct.error) && (
                <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-lg">
                  {createProduct.error?.message || updateProduct.error?.message}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/[0.08] flex gap-3">
              <button onClick={closeDrawer} className="flex-1 h-11 border border-white/[0.12] text-white/60 hover:text-white rounded-lg text-sm transition-colors">{t("Cancel")}</button>
              <button onClick={handleSubmit} disabled={isPending || !isValid}
                className="flex-1 h-11 bg-[#C8956C] hover:bg-[#B8855C] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#C8956C]/20">
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("Loading")}
                  </span>
                ) : editingId ? t("Update") : t("Create")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
