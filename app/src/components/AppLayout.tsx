import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { trpc } from "@/providers/trpc";
import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  Receipt,
  Warehouse,
  ShoppingCart,
  ClipboardList,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Store,
} from "lucide-react";

const adminNavItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/products", icon: Package, label: "Products" },
  { path: "/categories", icon: Tags, label: "Categories" },
  { path: "/employees", icon: Users, label: "Employees" },
  { path: "/sales", icon: Receipt, label: "Sales" },
  { path: "/stock", icon: Warehouse, label: "Stock" },
  { path: "/audit-log", icon: ScrollText, label: "Audit Log" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const employeeNavItems = [
  { path: "/new-sale", icon: ShoppingCart, label: "New Sale" },
  { path: "/stock", icon: Warehouse, label: "Stock" },
  { path: "/my-sales", icon: ClipboardList, label: "My Sales" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = isAdmin ? adminNavItems : employeeNavItems;
  const utils = trpc.useUtils();
  const updateLang = trpc.auth.updateLanguage.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });

  // Sync server-saved language preference on first load
  useEffect(() => {
    if (user?.language && user.language !== lang) {
      setLang(user.language);
    }
  }, [user?.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleLanguage = () => {
    const newLang = lang === "EN" ? "FR" : "EN";
    setLang(newLang);
    if (user) {
      updateLang.mutate({ language: newLang });
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-[#0F0F0F] border-r border-white/[0.08] flex flex-col transition-all duration-200 ${
          collapsed ? "w-16" : "w-60"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-white/[0.08]">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg text-white tracking-wide">Guest Store</span>
              <span className="text-[9px] uppercase tracking-[0.15em] text-[#C8956C] font-medium">Accessories</span>
            </div>
          )}
          {collapsed && <Store className="w-5 h-5 text-[#C8956C] mx-auto" />}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden ml-auto text-white/60 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-100 ${
                  isActive
                    ? "bg-[#C8956C]/15 text-[#C8956C] border border-[#C8956C]/20"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04]"
                }`}
                title={collapsed ? t(item.label) : undefined}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.5} />
                {!collapsed && <span className="font-medium">{t(item.label)}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-2 border-t border-white/[0.08] space-y-1">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
            title={collapsed ? t("Sign Out") : undefined}
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.5} />
            {!collapsed && <span>{t("Sign Out")}</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center py-2 text-white/30 hover:text-white/60 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 flex items-center px-4 lg:px-6 border-b border-white/[0.08] bg-[#0A0A0A] flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden mr-3 text-white/60"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-base font-medium text-white flex-1">
            {t(navItems.find((n) => n.path === location.pathname)?.label || "")}
          </h1>

          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.10] transition-colors"
            >
              <span className={lang === "EN" ? "text-[#C8956C]" : ""}>EN</span>
              <span className="text-white/30">/</span>
              <span className={lang === "FR" ? "text-[#C8956C]" : ""}>FR</span>
            </button>

            {/* User info */}
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#C8956C]/20 flex items-center justify-center text-[#C8956C] text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm text-white font-medium leading-tight">{user.name}</div>
                  <div className="text-[11px] text-white/40 font-mono-id leading-tight">{user.employeeId}</div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-6">
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
