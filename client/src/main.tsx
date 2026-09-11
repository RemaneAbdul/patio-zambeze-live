import { trpc } from "@/lib/trpc";
import { COOKIE_NAME } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();
const SUPABASE_TOKEN_KEY = "supabase-access-token";
const SUPABASE_TOKEN_FALLBACK_KEY = "supabase-access-token-fallback";

function readSupabaseAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const sessionToken = sessionStorage.getItem(SUPABASE_TOKEN_KEY)?.trim();
    if (sessionToken) {
      localStorage.setItem(SUPABASE_TOKEN_FALLBACK_KEY, sessionToken);
      localStorage.setItem(SUPABASE_TOKEN_KEY, sessionToken);
      return sessionToken;
    }
  } catch {}
  try {
    const localToken = localStorage.getItem(SUPABASE_TOKEN_KEY)?.trim()
      || localStorage.getItem(SUPABASE_TOKEN_FALLBACK_KEY)?.trim();
    if (localToken) {
      try { sessionStorage.setItem(SUPABASE_TOKEN_KEY, localToken); } catch {}
      return localToken;
    }
  } catch {}
  return null;
}

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        try {
          const supabaseToken = readSupabaseAccessToken();
          if (supabaseToken) {
            return {
              Authorization: `Bearer ${supabaseToken}`,
              "X-Auth-Provider": "supabase",
            };
          }

          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) return { Authorization: `Bearer ${token}` };
          }
        } catch {}
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
