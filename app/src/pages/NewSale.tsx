import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Search, ShoppingCart, Plus, Minus, Trash2, Check } from "lucide-react";

function formatFCFA(cents: number): string {
  return `${(cents / 100).toLocaleString()} FCFA`;
}

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export default function NewSale() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: products } = trpc.product.list.useQuery({ page: 1, limit: 50, search });
  const utils = trpc.useUtils();

  const createSale = trpc.sales.create.useMutation({
    onSuccess: (data) => {
      setCart([]);
      setSuccess(`${t("Sale completed")}: ${formatFCFA(data.totalAmount)}`);
      utils.product.list.invalidate();
      utils.inventory.list.invalidate();
      setTimeout(() => setSuccess(null), 5000);
    },
  });

  const addToCart = (product: any, storeQty: number) => {
    const existing = cart.find((c) => c.productId === product.id);
    if (existing) {
      if (existing.quantity >= storeQty) return;
      setCart(cart.map((c) => c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { productId: product.id, name: product.name, price: product.price, quantity: 1, maxStock: storeQty }]);
    }
  };

  const updateQty = (productId: number, delta: number) => {
    setCart(cart.map((c) => {
      if (c.productId === productId) {
        const newQty = Math.max(1, Math.min(c.maxStock, c.quantity + delta));
        return { ...c, quantity: newQty };
      }
      return c;
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((c) => c.productId !== productId));
  };

  const total = useMemo(() => cart.reduce((sum, c) => sum + c.price * c.quantity, 0), [cart]);

  const handleSell = () => {
    if (cart.length === 0) return;
    createSale.mutate({ items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })) });
  };

  const getStoreQty = (product: any) => {
    if (user?.storeId === 1) return product.yaoundeQty;
    if (user?.storeId === 2) return product.kribiQty;
    return product.totalQty;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Search */}
      <div className="lg:col-span-2 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder={t("Search products...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-[#141414] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C8956C]/30"
            autoFocus
          />
        </div>

        {/* Success toast */}
        {success && (
          <div className="flex items-center gap-2 px-4 py-3 bg-emerald-400/10 border border-emerald-400/20 rounded-lg text-emerald-400 text-sm">
            <Check className="w-4 h-4" /> {success}
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {products?.items.map((product) => {
            const storeQty = getStoreQty(product);
            const inCart = cart.find((c) => c.productId === product.id);
            const canAdd = storeQty > 0 && (!inCart || inCart.quantity < storeQty);

            return (
              <div
                key={product.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  inCart ? "bg-[#C8956C]/8 border-[#C8956C]/20" : "bg-[#141414] border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm text-white truncate">{product.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[#C8956C] font-medium">{formatFCFA(product.price)}</span>
                    <span className={`text-[11px] ${storeQty <= 5 ? "text-amber-400" : "text-white/30"}`}>
                      {storeQty} in stock
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => canAdd && addToCart(product, storeQty)}
                  disabled={!canAdd}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#C8956C] hover:bg-[#B8855C] text-white disabled:bg-white/[0.06] disabled:text-white/20 transition-colors flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {(!products || products.items.length === 0) && search && (
          <div className="text-center py-8 text-white/30 text-sm">No products found</div>
        )}
      </div>

      {/* Cart */}
      <div className="space-y-4">
        <div className="bg-[#141414] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-5 h-5 text-[#C8956C]" strokeWidth={1.5} />
            <h3 className="text-sm font-medium text-white">{t("Cart")}</h3>
            <span className="ml-auto text-xs text-white/40">{cart.length} items</span>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">Add products to cart</div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.name}</p>
                    <p className="text-xs text-white/40">{formatFCFA(item.price)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 flex items-center justify-center rounded bg-white/[0.06] text-white/60 hover:text-white">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm text-white w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, 1)} disabled={item.quantity >= item.maxStock}
                      className="w-6 h-6 flex items-center justify-center rounded bg-white/[0.06] text-white/60 hover:text-white disabled:opacity-30">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.productId)} className="p-1 text-white/20 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Total */}
              <div className="pt-3 border-t border-white/[0.08]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-white/60">{t("Total")}</span>
                  <span className="text-xl font-semibold text-white">{formatFCFA(total)}</span>
                </div>
                {user?.storeId && (
                  <p className="text-xs text-white/30 mb-3">
                    {t("Store")}: {user.storeId === 1 ? t("Yaoundé") : t("Kribi")}
                  </p>
                )}
                <button
                  onClick={handleSell}
                  disabled={createSale.isPending || cart.length === 0}
                  className="w-full h-12 bg-[#C8956C] hover:bg-[#B8855C] text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createSale.isPending ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" /> {t("Sell")}
                    </>
                  )}
                </button>
                {createSale.error && (
                  <p className="mt-2 text-xs text-red-400 text-center">{createSale.error.message}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
