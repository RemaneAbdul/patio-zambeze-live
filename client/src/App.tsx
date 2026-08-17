/* Pátio Solar: o QR Code abre diretamente o menu; nenhuma camada de login, pedido ou checkout. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import WaiterPanel from "./pages/WaiterPanel";
import QrCodesPanel from "./pages/QrCodesPanel";
import { PrintsPanel, SettingsPanel } from "./pages/InternalSettingsPanel";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return <Switch><Route path="/" component={Home} /><Route path="/painel/qr-codes" component={QrCodesPanel} /><Route path="/painel" component={WaiterPanel} /><Route path="/painel/mesas" component={WaiterPanel} /><Route path="/painel/impressoes" component={PrintsPanel} /><Route path="/painel/definicoes" component={SettingsPanel} /><Route path="/waiter" component={WaiterPanel} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
