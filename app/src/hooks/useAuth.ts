import { trpc } from "@/providers/trpc";
import { useCallback, useMemo } from "react";

export type AuthUser = {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  role: "ADMIN" | "EMPLOYEE";
  storeId: number | null;
  language: "EN" | "FR";
};

export function useAuth() {
  const utils = trpc.useUtils();

  const {
    data: userData,
    isLoading,
    error,
  } = trpc.auth.me.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      localStorage.removeItem("glamour_token");
      await utils.invalidate();
      window.location.href = "/login";
    },
  });

  const logout = useCallback(() => {
    localStorage.removeItem("glamour_token");
    logoutMutation.mutate();
  }, [logoutMutation]);

  const user: AuthUser | null = userData
    ? {
        id: userData.id,
        employeeId: userData.employeeId,
        name: userData.name,
        email: userData.email,
        role: userData.role as "ADMIN" | "EMPLOYEE",
        storeId: userData.storeId ?? null,
        language: userData.language as "EN" | "FR",
      }
    : null;

  return useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === "ADMIN",
      isLoading,
      error,
      logout,
    }),
    [user, isLoading, error, logout]
  );
}
