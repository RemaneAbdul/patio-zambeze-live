import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

/**
 * The Pátio Zambeze panel is intentionally configured for direct access.
 * Authentication is therefore not allowed to blank/disable the panel when
 * auth.me is unavailable. Server-side panel procedures still resolve the
 * existing panel context. Outside /painel, the normal auth behaviour remains.
 */
const PUBLIC_PANEL_USER = {
  id: 0,
  openId: "public:panel",
  name: "Administrador",
  email: "",
  loginMethod: "panel",
  role: "admin" as const,
  waiterActive: 1,
};

type UseAuthState = {
  user: typeof PUBLIC_PANEL_USER | NonNullable<ReturnType<typeof normalizeUser>> | null;
  loading: boolean;
  error: unknown;
  isAuthenticated: boolean;
};

function normalizeUser(value: unknown) {
  if (!value || typeof value !== "object") return null;
  return value as {
    id: number;
    openId: string;
    name: string | null;
    email: string | null;
    loginMethod: string | null;
    role: "user" | "admin" | "garcom";
    waiterActive: number;
  };
}

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const logoutMutation = trpc.auth.logout.useMutation({ onSuccess: () => utils.auth.me.setData(undefined, null) });
  const isPanelPath = typeof window !== "undefined" && (window.location.pathname === "/painel" || window.location.pathname.startsWith("/painel/"));

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED") return;
      throw error;
    } finally {
      try {
        sessionStorage.removeItem("manus-cookie");
        sessionStorage.removeItem("supabase-access-token");
      } catch {}
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo<UseAuthState>(() => {
    const realUser = normalizeUser(meQuery.data);
    const user = realUser ?? (isPanelPath ? PUBLIC_PANEL_USER : null);
    try {
      localStorage.setItem("manus-runtime-user-info", JSON.stringify(user));
    } catch {}
    return {
      user,
      loading: isPanelPath ? logoutMutation.isPending : meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(user),
    };
  }, [isPanelPath, meQuery.data, meQuery.error, meQuery.isLoading, logoutMutation.error, logoutMutation.isPending]);

  useEffect(() => {
    if (!redirectOnUnauthenticated || isPanelPath) return;
    if (meQuery.isLoading || logoutMutation.isPending || state.user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;
    if (redirectPath) window.location.href = redirectPath;
    else startLogin();
  }, [redirectOnUnauthenticated, redirectPath, isPanelPath, logoutMutation.isPending, meQuery.isLoading, state.user]);

  return { ...state, refresh: () => meQuery.refetch(), logout };
}
