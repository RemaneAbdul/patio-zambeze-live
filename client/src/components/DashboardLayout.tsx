import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Printer, QrCode, Settings, Table2, UtensilsCrossed, Users } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";
import REMAFooter from "./REMAFooter";

const menuItems = [
  { icon: LayoutDashboard, label: "Painel", path: "/painel" },
  { icon: Table2, label: "Mesas", path: "/painel/mesas" },
  { icon: UtensilsCrossed, label: "Pratos", path: "/painel/pratos" },
  { icon: QrCode, label: "QR Codes", path: "/painel/qr-codes" },
  { icon: Users, label: "Garçons", path: "/painel/garcons" },
  { icon: Printer, label: "Impressões", path: "/painel/impressoes" },
  { icon: Settings, label: "Definições", path: "/painel/definicoes" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    const parsed = saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
    return Number.isFinite(parsed) ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parsed)) : DEFAULT_WIDTH;
  });
  const { user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  // The panel is intentionally directly accessible, without a login screen.
  // The API still resolves the existing server-side panel context and database
  // operations; this component must never hide the panel because auth.me is
  // temporarily unavailable in the browser.
  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = { children: React.ReactNode; setSidebarWidth: (width: number) => void };

function DashboardLayoutContent({ children, setSidebarWidth }: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [panelLanguage, setPanelLanguage] = useState<"PT" | "EN">("PT");
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  // Direct-access panel: all administrative navigation remains available.
  const visibleMenuItems = menuItems;
  const activeMenuItem = visibleMenuItems.find(item => item.path === location);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button onClick={toggleSidebar} className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0" aria-label="Alternar navegação">
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? <div className="flex items-center gap-2 min-w-0"><span className="font-semibold tracking-tight truncate">Pátio Zambeze</span></div> : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {visibleMenuItems.map(item => {
                const isActive = location === item.path;
                return <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={isActive} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-10 transition-all font-normal"><item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>;
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0"><AvatarFallback className="text-xs font-medium">{user?.name?.charAt(0).toUpperCase() || "A"}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate leading-none">{user?.name || "Administrador"}</p><p className="text-xs text-muted-foreground truncate mt-1.5">{user?.email || "Painel"}</p></div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => { void logout(); }} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" /><span>Sair</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }} style={{ zIndex: 50 }} />
      </div>

      <SidebarInset>
        {isMobile && <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40"><div className="flex items-center gap-2"><SidebarTrigger className="h-9 w-9 rounded-lg bg-background" /><span className="tracking-tight text-foreground">{activeMenuItem?.label ?? "Painel"}</span></div></div>}
        <header className="internal-topbar"><div className="internal-brand"><div className="internal-brand-mark">🍴</div><div><strong>Pátio Zambeze</strong><span>Painel do Restaurante</span></div></div><div className="internal-topbar-actions"><div className="internal-language-switch" role="group" aria-label="Idioma do painel"><button type="button" className={panelLanguage === "PT" ? "active" : ""} onClick={() => setPanelLanguage("PT")}>PT</button><span>|</span><button type="button" className={panelLanguage === "EN" ? "active" : ""} onClick={() => setPanelLanguage("EN")}>EN</button></div><button className="internal-notification" type="button" aria-label="Notificações">♧<b>3</b></button><div className="internal-user"><div className="internal-user-avatar">{user?.name?.charAt(0).toUpperCase() || "A"}</div><div><strong>{user?.name || "Administrador"}</strong><span>Acesso ao painel</span></div><span>⌄</span></div></div></header>
        <main className="flex-1 p-4">{children}</main>
        <REMAFooter />
      </SidebarInset>
    </>
  );
}
