import { Routes, Route, Navigate } from "react-router";
import { TRPCProvider } from "@/providers/trpc";
import { LanguageProvider } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Categories from "@/pages/Categories";
import Employees from "@/pages/Employees";
import SalesPage from "@/pages/SalesPage";
import StockPage from "@/pages/StockPage";
import NewSale from "@/pages/NewSale";
import MySales from "@/pages/MySales";
import AuditLog from "@/pages/AuditLog";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import AppLayout from "@/components/AppLayout";

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
        <div className="animate-spin w-8 h-8 border-2 border-[#C8956C] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== "ADMIN") {
    return <Navigate to="/new-sale" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<ProtectedRoute requireAdmin><Dashboard /></ProtectedRoute>} />
                <Route path="/products" element={<ProtectedRoute requireAdmin><Products /></ProtectedRoute>} />
                <Route path="/categories" element={<ProtectedRoute requireAdmin><Categories /></ProtectedRoute>} />
                <Route path="/employees" element={<ProtectedRoute requireAdmin><Employees /></ProtectedRoute>} />
                <Route path="/sales" element={<ProtectedRoute requireAdmin><SalesPage /></ProtectedRoute>} />
                <Route path="/stock" element={<StockPage />} />
                <Route path="/new-sale" element={<NewSale />} />
                <Route path="/my-sales" element={<MySales />} />
                <Route path="/audit-log" element={<ProtectedRoute requireAdmin><AuditLog /></ProtectedRoute>} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <TRPCProvider>
      <LanguageProvider>
        <AppRoutes />
      </LanguageProvider>
    </TRPCProvider>

  );
}
