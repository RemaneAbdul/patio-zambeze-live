/* Pátio Solar: o QR Code abre diretamente o menu; nenhuma camada de login, pedido ou checkout. */
import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import WaiterLogin from "./pages/WaiterLogin";
import PasswordReset from "./pages/PasswordReset";
import "./menu-fixes.css";

const WaiterPanel = lazy(() => import("./pages/WaiterPanel"));
const QrCodesPanel = lazy(() => import("./pages/QrCodesPanel"));
const ProductsPanel = lazy(() => import("./pages/ProductsPanel"));
const WaitersPanel = lazy(() => import("./pages/WaitersPanel"));
const PrintsPanel = lazy(() =>
  import("./pages/InternalSettingsPanel").then(({ PrintsPanel: panel }) => ({ default: panel })),
);
const SettingsPanel = lazy(() =>
  import("./pages/InternalSettingsPanel").then(({ SettingsPanel: panel }) => ({ default: panel })),
);

function TranslationWarmup() {
  trpc.menu.translations.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: false,
  });

  useEffect(() => {
    const tableKey = new URLSearchParams(window.location.search).get("tableId") || new URLSearchParams(window.location.search).get("mesa") || "default";
    const storageKey = `patio-zambeze-language:${tableKey}`;
    const saveLanguageChoice = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;
      const value = target.textContent?.trim().toLowerCase();
      if (value === "pt" || value === "en") localStorage.setItem(storageKey, value);
    };
    document.addEventListener("click", saveLanguageChoice, true);

    // Home keeps its current language in React state. Restore the saved choice
    // after the menu mounts, without changing the menu/session architecture.
    const restoreTimer = window.setTimeout(() => {
      const saved = localStorage.getItem(storageKey);
      if (saved !== "pt" && saved !== "en") return;
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".language-switch button"));
      const target = buttons.find((button) => button.textContent?.trim().toLowerCase() === saved);
      if (target && !target.classList.contains("language-active")) target.click();
    }, 0);

    return () => {
      window.clearTimeout(restoreTimer);
      document.removeEventListener("click", saveLanguageChoice, true);
    };
  }, []);

  return null;
}

function PanelLoading() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground" aria-busy="true" aria-live="polite">
      <div className="mx-auto flex min-h-[40vh] max-w-5xl items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-card-foreground shadow-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" aria-hidden="true" />
          <span>A carregar o painel…</span>
        </div>
      </div>
    </main>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/menu" component={Home} />
      <Route path="/login" component={WaiterLogin} />
      <Route path="/redefinir-senha" component={PasswordReset} />
      <Route path="/painel/login" component={WaiterLogin} />
      <Route path="/painel/redefinir-senha" component={PasswordReset} />
      <Route path="/" component={Home} />
      <Route path="/painel/admin" component={WaiterPanel} />
      <Route path="/painel/pratos" component={ProductsPanel} />
      <Route path="/painel/qr-codes" component={QrCodesPanel} />
      <Route path="/painel/garcons" component={WaitersPanel} />
      <Route path="/painel" component={WaiterPanel} />
      <Route path="/painel/garcom" component={WaiterPanel} />
      <Route path="/painel/mesas" component={WaiterPanel} />
      <Route path="/painel/impressoes" component={PrintsPanel} />
      <Route path="/painel/definicoes" component={SettingsPanel} />
      <Route path="/waiter" component={WaiterPanel} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <TranslationWarmup />
          <Suspense fallback={<PanelLoading />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
