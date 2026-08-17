import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Printer, Settings2, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function PrintsPanel() {
  return <DashboardLayout><div className="internal-info-shell"><p className="eyebrow">Operação interna</p><h1>Impressões</h1><p className="internal-info-lead">As impressões são iniciadas dentro do detalhe de cada mesa. O sistema utiliza um único recibo térmico para o menu e para o painel.</p><div className="internal-info-grid"><article><Printer className="h-6 w-6 text-[#C85A3F]" /><h2>Recibo oficial</h2><p>Formato preservado para 58 mm e 80 mm, sem conversão para A4 e sem um segundo modelo específico para o garçom.</p></article><article><ShieldCheck className="h-6 w-6 text-[#C85A3F]" /><h2>Impressão segura</h2><p>O recibo só é renderizado após uma conta autorizada consultar uma sessão da mesa.</p></article></div></div></DashboardLayout>;
}

export function SettingsPanel() {
  const { user } = useAuth();
  const identity = trpc.tableHistory.staffIdentity.useQuery(undefined, { enabled: user?.role === "admin", retry: false });
  return <DashboardLayout><div className="internal-info-shell"><p className="eyebrow">Configuração do restaurante</p><h1>Definições</h1><p className="internal-info-lead">Esta instalação está configurada para um único restaurante, com acesso interno controlado por contas autenticadas e role administrativa.</p><div className="internal-info-grid"><article><Settings2 className="h-6 w-6 text-[#C85A3F]" /><h2>Pátio Zambeze</h2><p>As mesas e QR Codes são geridos no mesmo painel. Não existem limites de geração, créditos ou pacotes de QR Codes.</p></article><article><ShieldCheck className="h-6 w-6 text-[#C85A3F]" /><h2>Garçom autenticado</h2><p>{identity.data?.name || user?.name || "Conta autenticada"}</p><p>ID: <strong>{identity.data?.waiterCode || "A configurar"}</strong></p><small>Estado: {identity.data?.active ? "Activo" : "Inactivo"}. A conta só pode consultar, marcar como visto, imprimir e encerrar sessões.</small></article></div></div></DashboardLayout>;
}
