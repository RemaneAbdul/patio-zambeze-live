import DashboardLayout from "@/components/DashboardLayout";
import { ThermalReceipt } from "@/components/ThermalReceipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { printRenderedReceipt, receiptPaperClass, type ReceiptPrintState } from "@/lib/receiptPrint";
import { shouldQueryStaffLookup, staffLookupInput } from "@/lib/staffLookupGuard";
import { canUseWaiterPanel, isAdminRole } from "@shared/roles";
import { ArrowLeft, CheckCircle2, Circle, Eye, LockKeyhole, Printer, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

const EMPTY_LOOKUP_TOKEN = "0".repeat(32);
const money = (value: number) => `${value.toFixed(2)} MT`;
const dateTime = (value: Date | string | number) => new Date(value).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "medium" });

type ReceiptWidth = "58mm" | "80mm";

export default function WaiterPanel() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [receiptWidth, setReceiptWidth] = useState<ReceiptWidth>("58mm");
  const [showReceipt, setShowReceipt] = useState(false);
  const [printState, setPrintState] = useState<ReceiptPrintState>("idle");
  const [viewedConfirmation, setViewedConfirmation] = useState(false);
  const [refreshConfirmation, setRefreshConfirmation] = useState(false);
  const [summaryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const isAuthorized = canUseWaiterPanel(user?.role, user?.waiterCode, user?.waiterActive);
  const tables = trpc.tableHistory.staffTables.useQuery(undefined, { enabled: isAuthorized, refetchInterval: 5000, retry: false });
  const lookupInput = useMemo(() => staffLookupInput(selectedToken) ?? { sessionToken: EMPTY_LOOKUP_TOKEN }, [selectedToken]);
  const summaryInput = useMemo(() => ({ date: summaryDate }), [summaryDate]);
  const lookup = trpc.tableHistory.staffLookup.useQuery(lookupInput, { enabled: shouldQueryStaffLookup(Boolean(isAuthorized), selectedToken), retry: false });
  const dailySummary = trpc.tableHistory.dailySummary.useQuery(summaryInput, { enabled: isAdminRole(user?.role), retry: false });
  const utils = trpc.useUtils();
  const assumeTable = trpc.tableHistory.assumeTable.useMutation({ onSuccess: () => { void utils.tableHistory.staffTables.invalidate(); void lookup.refetch(); }, onError: () => { void tables.refetch(); } });
  const markViewed = trpc.tableHistory.markViewed.useMutation({ onSuccess: () => { void utils.tableHistory.staffTables.invalidate(); void lookup.refetch(); setViewedConfirmation(true); window.setTimeout(() => setViewedConfirmation(false), 3200); } });
  const releaseTable = trpc.tableHistory.releaseTable.useMutation({ onSuccess: () => { void utils.tableHistory.staffTables.invalidate(); void lookup.refetch(); } });
  const closeSession = trpc.tableHistory.closeSession.useMutation({ onSuccess: () => { setSelectedToken(""); void utils.tableHistory.staffTables.invalidate(); } });
  const updateSelectionStatus = trpc.tableHistory.updateSelectionStatus.useMutation({ onSuccess: () => { void lookup.refetch(); void utils.tableHistory.staffTables.invalidate(); } });
  const removeSelectionItem = trpc.tableHistory.removeSelectionItem.useMutation({ onSuccess: () => { void lookup.refetch(); void utils.tableHistory.staffTables.invalidate(); } });
  const handleRefreshTables = async () => {
    await tables.refetch();
    setRefreshConfirmation(true);
    window.setTimeout(() => setRefreshConfirmation(false), 2200);
  };
  const statusLabel = (status: string) => ({ PENDING: "Pendente", PREPARING: "Em preparação", READY: "Pronto", DELIVERED: "Entregue", COMPLETED: "Concluído" }[status] ?? status);

  if (!isAuthorized) {
    return <DashboardLayout><div className="waiter-shell"><div className="waiter-alert" role="alert">Esta área é exclusiva para o restaurante. Entre com uma conta autorizada para continuar.</div></div></DashboardLayout>;
  }

  const filteredTables = (tables.data ?? []).filter((table) => table.tableNumber.toLowerCase().includes(search.trim().toLowerCase()));
  const session = lookup.data?.session;
  const selections = lookup.data?.selections ?? [];
  const assignedWaiter = lookup.data?.waiter;
  const total = selections.reduce((sum, selection) => sum + Number(selection.subtotal), 0);
  const newCount = (tables.data ?? []).filter((table) => table.statusLabel === "new").length;
  const viewedCount = (tables.data ?? []).filter((table) => table.statusLabel === "viewed").length;
  const emptyCount = (tables.data ?? []).filter((table) => table.statusLabel === "empty").length;
  const canOperate = Boolean(lookup.data?.canOperate);
  const lockMessage = lookup.data?.attendingWaiter?.name ? `Esta mesa já está a ser atendida pelo garçom ${lookup.data.attendingWaiter.name}.` : "Esta mesa ainda não foi assumida por nenhum garçom.";
  const mutationError = assumeTable.error?.message === "TABLE_ALREADY_ASSIGNED" ? "Esta mesa já está a ser atendida por outro garçom." : removeSelectionItem.error?.message === "SELECTION_ALREADY_VIEWED" ? "Este pedido já foi marcado como visto e está bloqueado." : removeSelectionItem.error?.message === "SELECTION_CANNOT_BE_EMPTY" ? "O pedido precisa de manter pelo menos um item." : removeSelectionItem.error?.message === "TABLE_NOT_ASSIGNED" ? "Assuma a mesa antes de remover itens." : "";
  const printError = printState === "error" ? "Não foi possível preparar o recibo para impressão. Verifique os dados da mesa." : "";
  const handlePrintReceipt = () => {
    if (!selections.length || !session) {
      setPrintState("error");
      return;
    }
    printRenderedReceipt(".receipt-preview-paper .receipt-print", setPrintState);
  };

  return (
    <DashboardLayout>
      <div className="waiter-shell">
        <header className="waiter-header">
          <div><p className="eyebrow">Pátio Zambeze · operação interna</p><h1 className="waiter-title">Painel do restaurante</h1><p className="waiter-subtitle">Consulte as mesas, confirme novas seleções e imprima o histórico sem alterar os dados do cliente.</p></div>
          <div className="waiter-user-chip"><LockKeyhole className="h-4 w-4" /> {user?.name || "Utilizador autorizado"}{user?.waiterCode && <span> · {user.waiterCode}</span>}</div>
        </header>

        {isAdminRole(user?.role) && <section className="daily-summary-panel" aria-label="Resumo diário"><div className="daily-summary-heading"><div><p className="eyebrow">Hoje · {new Date(`${summaryDate}T00:00:00`).toLocaleDateString("pt-PT")}</p><h2>Resumo diário</h2></div><span>{dailySummary.isLoading ? "A carregar…" : dailySummary.error ? "Indisponível" : `${dailySummary.data?.totalProcessed ?? 0} recibos processados`}</span></div>{dailySummary.error ? <div className="waiter-alert" role="alert">Não foi possível carregar o resumo diário.</div> : <><div className="daily-summary-metrics"><div><span>Recibos processados</span><strong>{dailySummary.data?.totalProcessed ?? 0}</strong></div><div><span>Acções registadas</span><strong>{dailySummary.data?.totalActions ?? 0}</strong></div><div><span>Garçons activos</span><strong>{dailySummary.data?.waiters.filter((waiter) => waiter.receiptsProcessed > 0 || waiter.actions > 0).length ?? 0}</strong></div></div><div className="daily-summary-staff">{dailySummary.data?.waiters.length ? dailySummary.data.waiters.map((waiter) => <article key={waiter.id}><div><strong>{waiter.name || "Garçom sem nome"}</strong><small>{waiter.waiterCode || `ID ${waiter.id}`}</small></div><span>{waiter.receiptsProcessed} recibo{waiter.receiptsProcessed === 1 ? "" : "s"}</span><p>{Object.entries(waiter.byAction).map(([action, count]) => `${action}: ${count}`).join(" · ") || "Sem acções registadas hoje"}</p></article>) : <div className="waiter-empty">Ainda não existem garçons registados.</div>}</div></>}</section>}

        <section className="waiter-summary-grid" aria-label="Resumo das mesas">
          <div><span>Novas</span><strong>{newCount}</strong></div><div><span>Visualizadas</span><strong>{viewedCount}</strong></div><div><span>Sem pedido</span><strong>{emptyCount}</strong></div>
        </section>

        {!selectedToken && (
          <section className="waiter-tables-section">
            <div className="waiter-section-heading"><div><p className="eyebrow">Operação</p><h2>Mesas</h2></div><div className="waiter-table-toolbar"><div className="waiter-table-search"><Search className="h-4 w-4" /><Input aria-label="Pesquisar mesa" placeholder="Pesquisar mesa" value={search} onChange={(event) => setSearch(event.target.value)} /></div><Button type="button" variant="outline" onClick={() => void handleRefreshTables()} disabled={tables.isFetching} aria-label="Actualizar lista de mesas" title="Actualizar lista de mesas"><RefreshCw className={`h-4 w-4 ${tables.isFetching ? "animate-spin" : ""}`} /> {tables.isFetching ? "A actualizar…" : "Actualizar"}</Button></div></div>{refreshConfirmation && <div className="waiter-refresh-confirmation" role="status">Lista de mesas actualizada.</div>}
            {tables.isLoading ? <div className="waiter-empty">A carregar mesas…</div> : tables.error ? <div className="waiter-alert">Não foi possível carregar as mesas. Tente novamente.</div> : filteredTables.length ? <div className="waiter-table-grid">{filteredTables.map((table) => { const locked = Boolean(table.attendingWaiter); const waiterName = table.attendingWaiter?.name || "outro garçom"; return <article className={`waiter-table-card ${locked ? "waiter-table-card-locked" : ""}`} key={`table-${table.tableNumber}`}><button className="waiter-table-card-main" onClick={() => table.sessionToken && setSelectedToken(table.sessionToken)} disabled={!table.sessionToken}><div className="waiter-table-card-title"><span>Mesa</span><strong>{table.tableNumber}</strong></div><div className={`waiter-status waiter-status-${table.statusLabel}`}><Circle className="h-3 w-3 fill-current" /> {locked ? "EM ATENDIMENTO" : table.statusLabel === "new" ? "NOVO" : table.statusLabel === "viewed" ? "VISTO" : "SEM PEDIDO"}</div>{locked && <p className="waiter-lock-label"><LockKeyhole className="h-3.5 w-3.5" /> Garçom: {waiterName}</p>}<p>{table.selectionCount ? `${table.selectionCount} seleção${table.selectionCount > 1 ? "ões" : ""}` : "Sem seleções"}</p>{table.latestSelectionAt && <small>Última: {dateTime(table.latestSelectionAt)}</small>}<b>{money(Number(table.total))}</b></button>{table.sessionToken && <Button size="sm" variant={locked ? "outline" : "default"} disabled={locked || assumeTable.isPending} onClick={() => assumeTable.mutate({ sessionToken: table.sessionToken })}>{locked ? `Em atendimento por ${waiterName}` : assumeTable.isPending ? "A assumir…" : "Atender Mesa"}</Button>}</article>})}</div> : <div className="waiter-empty">Nenhuma mesa encontrada.</div>}
          </section>
        )}

        {selectedToken && (
          <section className="waiter-result" aria-live="polite">
            {viewedConfirmation && <div className="viewed-confirmation" role="status"><CheckCircle2 className="h-5 w-5" /><div><strong>Mesa marcada como vista</strong><span>O recibo do cliente foi liberado.</span></div></div>}
            <button className="waiter-back-action" onClick={() => setSelectedToken("")}><ArrowLeft className="h-4 w-4" /> Voltar às mesas</button>
            {lookup.isFetching ? <div className="waiter-empty">A carregar o histórico…</div> : lookup.error || !session ? <div className="waiter-alert">Não foi possível abrir esta mesa.</div> : (
              <>
                {!canOperate && <div className="waiter-alert" role="alert"><LockKeyhole className="inline h-4 w-4" /> {lockMessage} Pode visualizar apenas o estado e o responsável.</div>}
                {mutationError && <div className="waiter-alert" role="alert">{mutationError}</div>}
                <div className="waiter-result-heading"><div><p className="eyebrow">Mesa {session.tableNumber}</p><h2>Histórico da mesa</h2><p>Estado: <strong>{session.attendingWaiterId ? "EM ATENDIMENTO" : selections.some((selection) => !selection.viewedAt) ? "NOVO" : selections.length ? "VISTO" : "SEM PEDIDO"}</strong>{lookup.data?.attendingWaiter && <> · Garçom: <strong>{lookup.data.attendingWaiter.name}</strong></>} · Última atividade: {dateTime(session.lastActivityAt)}</p></div><div className="waiter-result-actions"><label>Largura<select value={receiptWidth} onChange={(event) => setReceiptWidth(event.target.value as ReceiptWidth)}><option value="58mm">58 mm</option><option value="80mm">80 mm</option></select></label><Button onClick={() => setShowReceipt(true)} className="waiter-print-button" disabled={!selections.length || !canOperate}><Printer className="h-4 w-4" /> Ver recibo</Button></div></div>
                {!selections.length ? <div className="waiter-empty">Esta mesa ainda não tem seleções confirmadas.</div> : <><div className="waiter-selection-list">{selections.map((selection) => <article className="waiter-selection-card" key={selection.id}><div className="waiter-selection-meta"><strong>Seleção #{selection.selectionNumber}</strong><span>{dateTime(selection.createdAt)}</span></div>{selection.items.map((item) => <div className="waiter-item-row" key={item.id}><span>{item.productName}<small>{item.quantity} × {money(item.unitPrice)}</small></span><strong>{money(item.subtotal)}</strong>{(!selection.viewedAt || user?.role === "admin") && <Button type="button" size="sm" variant="outline" className="waiter-remove-item" disabled={!canOperate || removeSelectionItem.isPending || selection.items.length <= 1} title={selection.items.length <= 1 ? "A selecção precisa de manter pelo menos um item." : undefined} onClick={() => { if (selection.items.length <= 1) return; if (window.confirm(`Remover ${item.productName} do pedido?`)) removeSelectionItem.mutate({ itemId: item.id }); }} aria-label={selection.items.length <= 1 ? "Não é possível remover o último item" : `Remover ${item.productName}`}><Trash2 className="h-3.5 w-3.5" /> {selection.items.length <= 1 ? "Último item" : "Remover"}</Button>}</div>)}<div className="waiter-subtotal"><span>Subtotal</span><strong>{money(Number(selection.subtotal))}</strong></div><div className="waiter-selection-status"><span>Estado: <strong>{statusLabel(selection.status)}</strong></span><select aria-label={`Estado da seleção ${selection.selectionNumber}`} value={selection.status} disabled={!canOperate || (Boolean(selection.viewedAt) && user?.role !== "admin") || updateSelectionStatus.isPending} onChange={(event) => updateSelectionStatus.mutate({ selectionId: selection.id, status: event.target.value as "PENDING" | "PREPARING" | "READY" | "DELIVERED" | "COMPLETED" })}><option value="PENDING">Pendente</option><option value="PREPARING">Em preparação</option><option value="READY">Pronto</option><option value="DELIVERED">Entregue</option><option value="COMPLETED">Concluído</option></select></div></article>)}</div><div className="waiter-total"><span>Total da mesa</span><strong>{money(total)}</strong></div></>}
                <div className="waiter-detail-actions"><Button onClick={() => markViewed.mutate({ sessionToken: selectedToken })} disabled={!canOperate || markViewed.isPending || !selections.some((selection) => !selection.viewedAt)}><Eye className="h-4 w-4" /> {markViewed.isPending ? "A marcar…" : "Marcar como visto"}</Button><Button variant="outline" onClick={() => releaseTable.mutate({ sessionToken: selectedToken })} disabled={!canOperate || releaseTable.isPending}><LockKeyhole className="h-4 w-4" /> {releaseTable.isPending ? "A libertar…" : "Libertar mesa"}</Button><Button variant="outline" onClick={() => { if (window.confirm("Tem certeza que deseja encerrar a sessão desta mesa?")) closeSession.mutate({ sessionToken: selectedToken }); }} disabled={!canOperate || closeSession.isPending}><X className="h-4 w-4" /> Encerrar mesa</Button></div>
                {showReceipt && createPortal(<div className="receipt-preview-backdrop" role="presentation" onClick={() => setShowReceipt(false)}><article className="receipt-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="waiter-receipt-title" onClick={(event) => event.stopPropagation()}><div className="receipt-preview-heading"><div><p className="eyebrow">Pré-visualização</p><h3 id="waiter-receipt-title">Recibo da mesa {session.tableNumber}</h3></div><button className="receipt-preview-close" onClick={() => setShowReceipt(false)} aria-label="Fechar pré-visualização"><X className="h-5 w-5" /></button></div><div className={`receipt-preview-paper waiter-receipt-print ${receiptPaperClass(receiptWidth)}`}><ThermalReceipt selections={selections.map((selection) => ({ id: selection.id, selectionNumber: selection.selectionNumber, createdAt: selection.createdAt, subtotal: Number(selection.subtotal), status: selection.status, viewedAt: selection.viewedAt, waiterName: selection.viewedByWaiter?.name, waiterCode: selection.viewedByWaiter?.waiterCode, waiterViewedAt: selection.viewedAt, items: selection.items.map((item) => ({ id: item.id, productName: item.productName, quantity: item.quantity, unitPrice: Number(item.unitPrice), subtotal: Number(item.subtotal) })) }))} total={total} width={receiptWidth} className="receipt-preview" tableLabel={session.tableNumber} /></div><div className="receipt-preview-actions"><Button variant="outline" onClick={() => setShowReceipt(false)}>Fechar</Button><Button type="button" disabled={printState === "preparing" || printState === "printing"} onClick={handlePrintReceipt}><Printer className="h-4 w-4" /> {printState === "preparing" ? "Preparando recibo…" : printState === "printing" ? "A imprimir…" : "Imprimir agora"}</Button></div>{printError && <div className="waiter-alert" role="alert">{printError} <button onClick={() => setPrintState("idle")}>Tentar novamente</button></div>}</article></div>, document.body)}
              </>
            )}
          </section>
        )}

      </div>
    </DashboardLayout>
  );
}
