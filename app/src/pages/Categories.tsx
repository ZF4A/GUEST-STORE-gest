import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Search, X as XIcon } from "lucide-react";
import {
  Plus, Trash2, Tag, ShoppingBag, Watch, Gem, Glasses, Package,
  Shirt, Star, Heart, Sparkles, Crown, Box, Layers, Gift,
  CircleDot, Wand2, Ribbon, Wallet, Umbrella, KeyRound, Smartphone,
  Backpack, Footprints, Baby, Dumbbell, Waves, FlipVertical,
  Scissors, BookOpen, Sun, Briefcase,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  // Bags
  "backpack": <Backpack className="w-5 h-5" />,
  "tote": <ShoppingBag className="w-5 h-5" />,
  "clutch": <ShoppingBag className="w-5 h-5" />,
  "crossbody": <ShoppingBag className="w-5 h-5" />,
  "evening bag": <ShoppingBag className="w-5 h-5" />,
  "makeup bag": <ShoppingBag className="w-5 h-5" />,
  "laptop": <Briefcase className="w-5 h-5" />,
  "sleeve": <Briefcase className="w-5 h-5" />,
  "bag": <ShoppingBag className="w-5 h-5" />,
  "purse": <ShoppingBag className="w-5 h-5" />,
  "luggage": <ShoppingBag className="w-5 h-5" />,
  "travel": <ShoppingBag className="w-5 h-5" />,
  "coin purse": <Wallet className="w-5 h-5" />,
  // Shoes
  "sneaker": <Footprints className="w-5 h-5" />,
  "heel": <Footprints className="w-5 h-5" />,
  "pump": <Footprints className="w-5 h-5" />,
  "boot": <Footprints className="w-5 h-5" />,
  "sandal": <Footprints className="w-5 h-5" />,
  "flip-flop": <Footprints className="w-5 h-5" />,
  "shoe": <Footprints className="w-5 h-5" />,
  "shoe care": <Footprints className="w-5 h-5" />,
  // Head
  "bonnet": <Crown className="w-5 h-5" />,
  "beanie": <Crown className="w-5 h-5" />,
  "headband": <Crown className="w-5 h-5" />,
  "tiara": <Crown className="w-5 h-5" />,
  "hat": <Crown className="w-5 h-5" />,
  "cap": <Crown className="w-5 h-5" />,
  // Hair
  "hair extension": <Wand2 className="w-5 h-5" />,
  "wig": <Wand2 className="w-5 h-5" />,
  "hair": <Wand2 className="w-5 h-5" />,
  "clip": <Wand2 className="w-5 h-5" />,
  // Clothing accessories
  "belt": <Layers className="w-5 h-5" />,
  "suspender": <Layers className="w-5 h-5" />,
  "pocket square": <Shirt className="w-5 h-5" />,
  "glove": <Shirt className="w-5 h-5" />,
  "sock": <Shirt className="w-5 h-5" />,
  "stocking": <Shirt className="w-5 h-5" />,
  "tie": <Shirt className="w-5 h-5" />,
  "arm warmer": <Shirt className="w-5 h-5" />,
  "leg warmer": <Shirt className="w-5 h-5" />,
  "scarf": <Gift className="w-5 h-5" />,
  "wrap": <Gift className="w-5 h-5" />,
  "face mask": <Scissors className="w-5 h-5" />,
  "veil": <Scissors className="w-5 h-5" />,
  // Jewelry
  "bracelet": <Gem className="w-5 h-5" />,
  "anklet": <Gem className="w-5 h-5" />,
  "brooch": <Star className="w-5 h-5" />,
  "pin": <Star className="w-5 h-5" />,
  "cufflink": <Star className="w-5 h-5" />,
  "earring": <Sparkles className="w-5 h-5" />,
  "necklace": <Ribbon className="w-5 h-5" />,
  "pendant": <Ribbon className="w-5 h-5" />,
  "ring": <CircleDot className="w-5 h-5" />,
  "jewelry": <Gem className="w-5 h-5" />,
  "jewellery": <Gem className="w-5 h-5" />,
  "body": <Heart className="w-5 h-5" />,
  // Organizers / storage
  "organizer": <BookOpen className="w-5 h-5" />,
  "box": <Box className="w-5 h-5" />,
  "mirror": <Sun className="w-5 h-5" />,
  // Eyewear
  "sunglass": <Glasses className="w-5 h-5" />,
  "glass": <Glasses className="w-5 h-5" />,
  // Tech
  "phone": <Smartphone className="w-5 h-5" />,
  "case": <Box className="w-5 h-5" />,
  // Other
  "wallet": <Wallet className="w-5 h-5" />,
  "card holder": <Wallet className="w-5 h-5" />,
  "watch": <Watch className="w-5 h-5" />,
  "umbrella": <Umbrella className="w-5 h-5" />,
  "keychain": <KeyRound className="w-5 h-5" />,
  "perfume": <Sparkles className="w-5 h-5" />,
  "fragrance": <Sparkles className="w-5 h-5" />,
  "sport": <Dumbbell className="w-5 h-5" />,
  "baby": <Baby className="w-5 h-5" />,
  "swim": <Waves className="w-5 h-5" />,
  "beach": <Waves className="w-5 h-5" />,
};

const PALETTE = [
  "from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400",
  "from-rose-500/20 to-rose-600/10 border-rose-500/20 text-rose-400",
  "from-violet-500/20 to-violet-600/10 border-violet-500/20 text-violet-400",
  "from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400",
  "from-sky-500/20 to-sky-600/10 border-sky-500/20 text-sky-400",
  "from-orange-500/20 to-orange-600/10 border-orange-500/20 text-orange-400",
  "from-pink-500/20 to-pink-600/10 border-pink-500/20 text-pink-400",
  "from-teal-500/20 to-teal-600/10 border-teal-500/20 text-teal-400",
  "from-indigo-500/20 to-indigo-600/10 border-indigo-500/20 text-indigo-400",
  "from-yellow-500/20 to-yellow-600/10 border-yellow-500/20 text-yellow-400",
];

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return <Tag className="w-5 h-5" />;
}

function getColor(index: number) {
  return PALETTE[index % PALETTE.length];
}

export default function Categories() {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<string>("");
  const { data, refetch } = trpc.category.list.useQuery();
  const createCat = trpc.category.create.useMutation({
    onSuccess: () => { setName(""); setShowInput(false); refetch(); },
  });
  const deleteCat = trpc.category.delete.useMutation({ onSuccess: () => refetch() });

  const handleCreate = () => {
    if (!name.trim()) return;
    createCat.mutate({ name: name.trim() });
  };

  const filtered = (data ?? []).filter((cat) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return cat.name.toLowerCase().includes(q) || t(cat.name).toLowerCase().includes(q);
  });

  function handleDelete(cat: { id: number; name: string; productCount: number }) {
    setDeleteWarning("");
    if (cat.productCount > 0) {
      setDeleteWarning(t("Has products warning", { name: t(cat.name), count: String(cat.productCount) }));
      setTimeout(() => setDeleteWarning(""), 5000);
      return;
    }
    if (confirm(t("Delete confirm", { name: t(cat.name) }))) {
      deleteCat.mutate({ id: cat.id });
    }
  }

  return (
    <div className="space-y-6">
      {/* Warning banner */}
      {deleteWarning && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-400">
          <span className="flex-1">{deleteWarning}</span>
          <button onClick={() => setDeleteWarning("")} className="text-amber-400/60 hover:text-amber-400">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {t("Categories")}
            {data && (
              <span className="ml-2 text-sm font-normal text-white/40">
                ({filtered.length}{filtered.length !== data.length ? `/${data.length}` : ""})
              </span>
            )}
          </h2>
          <p className="text-sm text-white/40 mt-0.5">
            {t("Manage categories subtitle")}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInput(true)}
            className="h-9 px-4 bg-[#C8956C] hover:bg-[#B8855C] text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t("Create")}
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("Search categories...")}
          className="w-full h-10 pl-10 pr-10 bg-[#141414] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C8956C]/40 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Inline create form */}
      {showInput && (
        <div className="flex gap-3 p-4 bg-[#1A1A1A] border border-[#C8956C]/30 rounded-xl">
          <div className="flex-1">
            <input
              autoFocus
              type="text"
              placeholder={t("Category name placeholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") { setShowInput(false); setName(""); }
              }}
              className="w-full h-10 px-4 bg-[#0A0A0A] border border-white/[0.12] rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C8956C]/50"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || createCat.isPending}
            className="h-10 px-4 bg-[#C8956C] hover:bg-[#B8855C] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {createCat.isPending ? t("Loading") : t("Create")}
          </button>
          <button
            onClick={() => { setShowInput(false); setName(""); }}
            className="h-10 px-3 border border-white/[0.12] text-white/50 hover:text-white rounded-lg text-sm transition-colors"
          >
            {t("Cancel")}
          </button>
        </div>
      )}

      {/* Categories grid */}
      {!data || data.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-white/30">
          <Tag className="w-12 h-12 mb-3" strokeWidth={1} />
          <p className="text-sm">{t("No categories yet")}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-white/30">
          <Search className="w-10 h-10 mb-3" strokeWidth={1} />
          <p className="text-sm">{t("No results for")} «{search}»</p>
          <button onClick={() => setSearch("")} className="mt-3 text-xs text-[#C8956C] hover:underline">{t("Clear search")}</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((cat, index) => {
            const color = getColor(index);
            const icon = getCategoryIcon(cat.name);
            const displayName = t(cat.name);
            const countLabel =
              cat.productCount === 1
                ? `1 ${t("product singular")}`
                : `${cat.productCount} ${t("product plural")}`;

            return (
              <div
                key={cat.id}
                className={`group relative bg-gradient-to-br ${color} border rounded-xl p-4 flex flex-col gap-3 hover:scale-[1.02] transition-all duration-200`}
              >
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(cat)}
                    className={`absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-all ${
                      cat.productCount > 0
                        ? "text-amber-400/50 hover:text-amber-400"
                        : "text-white/30 hover:text-red-400"
                    }`}
                    title={cat.productCount > 0 ? `${cat.productCount} produit(s)` : t("Delete")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                  {icon}
                </div>

                <div>
                  <p className="text-sm font-medium text-white leading-snug">{displayName}</p>
                  <p className="text-xs text-white/40 mt-1">{countLabel}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty icon fallback for Package */}
      {false && <Package />}
    </div>
  );
}
