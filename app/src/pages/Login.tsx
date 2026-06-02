import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useLanguage } from "@/hooks/useLanguage";
import { ShoppingBag, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { t, lang, setLang } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("glamour_token", data.token);
      setLang(data.user.language as "EN" | "FR");
      window.location.href = data.user.role === "ADMIN" ? "/dashboard" : "/new-sale";
    },
    onError: (err) => {
      setError(err.message || t("Error"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) return;
    loginMutation.mutate({ email, password });
  };

  const toggleLanguage = () => {
    setLang(lang === "EN" ? "FR" : "EN");
  };

  return (
    <div className="min-h-screen flex bg-[#0A0A0A]">
      {/* Language toggle — top right, always visible */}
      <div className="absolute top-4 right-5 z-20">
        <button
          onClick={toggleLanguage}
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors bg-white/[0.06] hover:bg-white/[0.10] px-3 py-1.5 rounded-full"
        >
          <span className={lang === "EN" ? "text-[#C8956C] font-semibold" : ""}>EN</span>
          <span className="text-white/20">|</span>
          <span className={lang === "FR" ? "text-[#C8956C] font-semibold" : ""}>FR</span>
        </button>
      </div>

      {/* Left - Hero Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="/images/accessories-flatlay.jpg"
          alt="Guest Store"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/40 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12">
          <div className="mb-6">
            <ShoppingBag className="w-10 h-10 text-[#C8956C] mb-4" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-5xl text-white mb-3 leading-tight">
            Guest Store
          </h1>
          <p className="text-sm uppercase tracking-[0.2em] text-[#C8956C] font-medium mb-6">
            Accessories
          </p>
          <p className="text-white/50 text-sm max-w-sm leading-relaxed">
            {lang === "EN"
              ? "Premium fashion accessories management system. Track inventory, manage sales, and grow your business across multiple stores."
              : "Système de gestion d'accessoires de mode premium. Suivez l'inventaire, gérez les ventes et développez votre activité dans plusieurs magasins."}
          </p>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="font-serif text-3xl text-white">Guest Store</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#C8956C] mt-1">Accessories</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-serif text-white mb-1">{t("Welcome back")}</h2>
            <p className="text-sm text-white/40">{t("Enter credentials")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">{t("Email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gs.com"
                className="w-full h-10 px-4 bg-[#0A0A0A] border border-white/[0.12] rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C8956C]/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-1.5">{t("Password")}</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 px-4 pr-10 bg-[#0A0A0A] border border-white/[0.12] rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#C8956C]/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-11 bg-[#C8956C] hover:bg-[#B8855C] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t("Loading")}
                </span>
              ) : (
                t("Sign In")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
