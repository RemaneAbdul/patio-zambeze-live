import DashboardLayout from "@/components/DashboardLayout";
import { ThermalReceipt } from "@/components/ThermalReceipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Circle, Eye, LockKeyhole, Printer, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

const money = (value: number) => `${value.toFixed(2)} MT`;
const dateTime = (value: Date | string | number) => new Date(value).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "medium" });

type ReceiptWidth = "58mm" | "80mm";

export default function WaiterPanel() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [receiptWidth, setReceiptWidth] = useState<ReceiptWidth>("58mm");
  const isAuthorized = user?.role === "admin";
  const tables = trpc.tableHistory.staffTables.useQuery(undefined, { enabled: isAuthorized, refetchInterval: 15000, retry: false });
  const lookupInput = useMemo(() => ({ sessionToken: selectedToken }), [selectedToken]);
  const lookup = trpc.tableHistory.staffLookup.useQuery(lookupInput, { enabled: isAuthorized && selectedToken.length >= 32, retry: false });
  const utils = trpc.useUtils();
  const markViewed = trpc.tableHistory.markViewed.useMutation({ onSuccess: () => { void utils.tableHistory.staffTables.invalidate(); void lookup.refetch(); } });
  const closeSession = trpc.tableHistory.closeSession.useMutation({ onSuccess: () => { setSelectedToken(""); void utils.tableHistory.staffTables.invalidate(); } });

  if (!isAuthorized) {
    return <DashboardLayout><div className="waiter-shell"><div className="waiter-alert" role="alert">Esta área é exclusiva para o restaurante. Entre com uma conta autorizada para continuar.</div><Link href="/" className="waiter-back-link"><ArrowLeft className="h-4 w-4" /> Voltar ao menu público</Link></div></DashboardLayout>;
  }

  const filteredTables = (tables.data ?? []).filter((table) => table.tableNumber.toLowerCase().includes(search.trim().toLowerCase()));
  const session = lookup.data?.session;
  const selections = lookup.data?.selections ?? [];
  const total = selections.reduce((sum, selection) => sum + Number(selection.subtotal), 0);
  const newCount = (tables.data ?? []).filter((table) => table.statusLabel === "new").length;
  const viewedCount = (tables.data ?? []).filter((table) => table.statusLabel === "viewed").length;
  const emptyCount = (tables.data ?? []).filter((table) => table.statusLabel === "empty").length;

  return (
    <DashboardLayout>
      <div className="waiter-shell">
        <header className="waiter-header">
          <div><p className="eyebrow">Pátio Zambeze · operação interna</p><h1 className="waiter-title">Painel do restaurante</h1><p className="waiter-subtitle">Consulte as mesas, confirme novas seleções e imprima o histórico sem alterar os dados do cliente.</p></div>
          <div className="waiter-user-chip"><LockKeyhole className="h-4 w-4" /> {user?.name || "Utilizador autorizado"}</div>
        </header>

        <section className="waiter-summary-grid" aria-label="Resumo das mesas">
          <div><span>Novas</span><strong>{newCount}</strong></div><div><span>Visualizadas</span><strong>{viewedCount}</strong></div><div><span>Sem pedido</span><strong>{emptyCount}</strong></div>
        </section>

        {!selectedToken && (
          <section className="waiter-tables-section">
            <div className="waiter-section-heading"><div><p className="eyebrow">Operação</p><h2>Mesas</h2></div><div className="waiter-table-search"><Search className="h-4 w-4" /><Input aria-label="Pesquisar mesa" placeholder="Pesquisar mesa" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
            {tables.isLoading ? <div className="waiter-empty">A carregar mesas…</div> : tables.error ? <div className="waiter-alert">Não foi possível carregar as mesas. Tente novamente.</div> : filteredTables.length ? <div className="waiter-table-grid">{filteredTables.map((table) => <button className="waiter-table-card" key={table.id} onClick={() => table.sessionToken && setSelectedToken(table.sessionToken)} disabled={!table.sessionToken}><div className="waiter-table-card-title"><span>Mesa</span><strong>{table.tableNumber}</strong></div><div className={`waiter-status waiter-status-${table.statusLabel}`}><Circle className="h-3 w-3 fill-current" /> {table.statusLabel === "new" ? "NOVO" : table.statusLabel === "viewed" ? "VISTO" : "SEM PEDIDO"}</div><p>{table.selectionCount ? `${table.selectionCount} seleção${table.selectionCount > 1 ? "ões" : ""}` : "Sem seleções"}</p>{table.latestSelectionAt && <small>Última: {dateTime(table.latestSelectionAt)}</small>}<b>{money(Number(table.total))}</b></button>)}</div> : <div className="waiter-empty">Nenhuma mesa encontrada.</div>}
          </section>
        )}

        {selectedToken && (
          <section className="waiter-result" aria-live="polite">
            <button className="waiter-back-action" onClick={() => setSelectedToken("")}><ArrowLeft className="h-4 w-4" /> Voltar às mesas</button>
            {lookup.isFetching ? <div className="waiter-empty">A carregar o histórico…</div> : lookup.error || !session ? <div className="waiter-alert">Não foi possível abrir esta mesa.</div> : (
              <>
                <div className="waiter-result-heading"><div><p className="eyebrow">Mesa {session.tableNumber}</p><h2>Histórico da mesa</h2><p>Estado: <strong>{selections.some((selection) => !selection.viewedAt) ? "NOVO" : selections.length ? "VISTO" : "SEM PEDIDO"}</strong> · Última atividade: {dateTime(session.lastActivityAt)}</p></div><div className="waiter-result-actions"><label>Largura<select value={receiptWidth} onChange={(event) => setReceiptWidth(event.target.value as ReceiptWidth)}><option value="58mm">58 mm</option><option value="80mm">80 mm</option></select></label><Button onClick={() => window.print()} className="waiter-print-button" disabled={!selections.length}><Printer className="h-4 w-4" /> Imprimir recibo</Button></div></div>
                {!selections.length ? <div className="waiter-empty">Esta mesa ainda não tem seleções confirmadas.</div> : <><div className="waiter-selection-list">{selections.map((selection) => <article className="waiter-selection-card" key={selection.id}><div className="waiter-selection-meta"><strong>Seleção #{selection.selectionNumber}</strong><span>{dateTime(selection.createdAt)}</span></div>{selection.items.map((item) => <div className="waiter-item-row" key={item.id}><span>{item.productName}<small>{item.quantity} × {money(item.unitPrice)}</small></span><strong>{money(item.subtotal)}</strong></div>)}<div className="waiter-subtotal"><span>Subtotal</span><strong>{money(Number(selection.subtotal))}</strong></div></article>)}</div><div className="waiter-total"><span>Total da mesa</span><strong>{money(total)}</strong></div></>}
                <div className="waiter-detail-actions"><Button onClick={() => markViewed.mutate({ sessionToken: selectedToken })} disabled={markViewed.isPending || !selections.some((selection) => !selection.viewedAt)}><Eye className="h-4 w-4" /> {markViewed.isPending ? "A marcar…" : "Marcar como visto"}</Button><Button variant="outline" onClick={() => { if (window.confirm("Tem certeza que deseja encerrar a sessão desta mesa?")) closeSession.mutate({ sessionToken: selectedToken }); }} disabled={closeSession.isPending}><X className="h-4 w-4" /> Encerrar mesa</Button></div>
                <ThermalReceipt selections={selections.map((selection) => ({ id: selection.id, selectionNumber: selection.selectionNumber, createdAt: selection.createdAt, subtotal: Number(selection.subtotal), items: selection.items.map((item) => ({ id: item.id, productName: item.productName, quantity: item.quantity, unitPrice: Number(item.unitPrice), subtotal: Number(item.subtotal) })) }))} total={total} width={receiptWidth} />
              </>
            )}
          </section>
        )}

        <Link href="/" className="waiter-back-link"><ArrowLeft className="h-4 w-4" /> Voltar ao menu público</Link>
      </div>
    </DashboardLayout>
  );
}
