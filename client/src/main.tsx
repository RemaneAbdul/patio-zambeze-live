import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import { toast } from "sonner";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  try {
    sessionStorage.removeItem("supabase-access-token");
  } catch {
    // sessionStorage may be unavailable in private browsing.
  }
  if (window.location.pathname.startsWith("/painel")) {
    window.location.assign("/painel/login");
  }
};

function mutationKeyText(event: { mutation: { options: { mutationKey?: unknown } } }) {
  return Array.isArray(event.mutation.options.mutationKey)
    ? event.mutation.options.mutationKey.map(String).join(".")
    : "";
}

function isStaffMutation(event: { mutation: { options: { mutationKey?: unknown } } }) {
  return mutationKeyText(event).startsWith("staff.");
}

function staffSuccessMessage(key: string) {
  if (key.includes("createAdmin")) return "Administrador criado com sucesso.";
  if (key.includes("updateAdmin")) return "Administrador actualizado com sucesso.";
  if (key.includes("setAdminActive")) return "Estado do administrador actualizado com sucesso.";
  if (key.includes("deleteAdmin")) return "Administrador removido com sucesso.";
  if (key.includes("add")) return "Garçom criado com sucesso.";
  if (key.includes("update")) return "Garçom actualizado com sucesso.";
  if (key.includes("setActive")) return "Estado do garçom actualizado com sucesso.";
  if (key.includes("delete")) return "Garçom removido com sucesso.";
  return "Operação concluída com sucesso.";
}

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type !== "updated") return;

  const error = event.mutation.state.error;
  if (event.action.type === "error") {
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
    if (isStaffMutation(event)) {
      const message = error instanceof Error ? error.message : "Não foi possível concluir a operação.";
      toast.error(message, { duration: 5000 });
    }
    return;
  }

  if (event.action.type === "success" && isStaffMutation(event)) {
    toast.success(staffSuccessMessage(mutationKeyText(event)), { duration: 3500 });
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        // Preview auto-login fallback: when the browser blocks iframe cookies
        // (Safari ITP / private browsing / WebView), the runtime mirrors the
        // session into sessionStorage so we can forward it as a Bearer token.
        // The regular OAuth cookie flow keeps working and takes priority server-side.
        try {
          const supabaseToken = sessionStorage.getItem("supabase-access-token");
          if (supabaseToken) return { Authorization: `Bearer ${supabaseToken}`, "X-Auth-Provider": "supabase" };
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // sessionStorage unavailable
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
