import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, LockKeyhole, Printer, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

const money = (value: number) => `${value.toFixed(2)} MT`;
const dateTime = (value: Date | string | number) => new Date(value).toLocaleString("pt-PT", {
  dateStyle: "short",
  timeStyle: "medium",
});

export default function WaiterPanel() {
  const { user } = useAuth();
  const [tokenInput, setTokenInput] = useState("");
  const [searchedToken, setSearchedToken] = useState("");
  const [tokenIssue, setTokenIssue] = useState("");
  const input = useMemo(() => ({ sessionToken: searchedToken }), [searchedToken]);
  const isAuthorized = user?.role === "admin";
  const lookup = trpc.tableHistory.staffLookup.useQuery(input, {
    enabled: isAuthorized && searchedToken.length >= 32,
    retry: false,
  });

  const session = lookup.data?.session;
  const selections = lookup.data?.selections ?? [];
  const total = selections.reduce((sum, selection) => sum + Number(selection.subtotal), 0);

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = tokenInput.trim();
    if (normalized.length >= 32) {
      setTokenIssue("");
      setSearchedToken(normalized);
    } else {
      setSearchedToken("");
      setTokenIssue("O código da mesa deve ter pelo menos 32 caracteres. Peça ao cliente para partilhar o código completo.");
    }
  };

  return (
    <DashboardLayout>
      <div className="waiter-shell">
        {!isAuthorized ? <section className="waiter-alert" role="alert">Esta área é exclusiva para contas autorizadas do restaurante. Solicite ao administrador a atribuição do perfil de garçom.</section> : null}
        <header className="waiter-header">
          <div>
            <p className="eyebrow">Pátio Zambeze · operação interna</p>
            <h1 className="waiter-title">Painel do garçom</h1>
            <p className="waiter-subtitle">Consulte uma mesa pelo código temporário apresentado pelo cliente e imprima somente o recibo dessa mesa.</p>
          </div>
          <div className="waiter-user-chip"><LockKeyhole className="h-4 w-4" /> {user?.name || "Utilizador autorizado"}</div>
        </header>

        {isAuthorized && <section className="waiter-search-card">
          <form onSubmit={search} className="waiter-search-form">
            <div className="waiter-search-field">
              <label htmlFor="table-token">Código da mesa</label>
              <Input
                id="table-token"
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                placeholder="Cole aqui o código temporário da mesa"
                autoComplete="off"
                spellCheck={false}
              />
              <small>O cliente pode partilhar este código consigo. Ele não é exibido no menu público.</small>
            </div>
            <Button type="submit" className="waiter-search-button" disabled={tokenInput.trim().length < 32 || lookup.isFetching}>
              <Search className="h-4 w-4" /> {lookup.isFetching ? "A consultar…" : "Consultar mesa"}
            </Button>
          </form>
        </section>}

        {tokenIssue && <div className="waiter-alert" role="alert">{tokenIssue}</div>}
        {lookup.error && <div className="waiter-alert" role="alert">Não foi possível consultar este histórico. Verifique o acesso da conta e tente novamente.</div>}
        {searchedToken && !lookup.isFetching && !lookup.error && lookup.data === null && <div className="waiter-empty">Nenhuma mesa encontrada para este código.</div>}

        {session && (
          <section className="waiter-result" aria-live="polite">
            <div className="waiter-result-heading">
              <div>
                <p className="eyebrow">Resultado encontrado</p>
                <h2>Mesa · sessão #{session.id}</h2>
                <p>Última atividade: {dateTime(session.lastActivityAt)}</p>
              </div>
              <Button onClick={() => window.print()} className="waiter-print-button" disabled={!selections.length}>
                <Printer className="h-4 w-4" /> Imprimir recibo
              </Button>
            </div>

            {!selections.length ? (
              <div className="waiter-empty">Esta mesa ainda não tem seleções confirmadas.</div>
            ) : (
              <>
                <div className="waiter-selection-list">
                  {selections.map((selection) => (
                    <article className="waiter-selection-card" key={selection.id}>
                      <div className="waiter-selection-meta"><strong>Seleção #{selection.selectionNumber}</strong><span>{dateTime(selection.createdAt)}</span></div>
                      {selection.items.map((item) => <div className="waiter-item-row" key={item.id}><span>{item.productName}<small>{item.quantity} × {money(item.unitPrice)}</small></span><strong>{money(item.subtotal)}</strong></div>)}
                      <div className="waiter-subtotal"><span>Subtotal</span><strong>{money(Number(selection.subtotal))}</strong></div>
                    </article>
                  ))}
                </div>
                <div className="waiter-total"><span>Total estimado da mesa</span><strong>{money(total)}</strong></div>
              </>
            )}

            <section className="waiter-receipt-print" aria-label="Recibo da mesa para impressão">
              <header><strong>PÁTIO ZAMBEZE</strong><span>HISTÓRICO MESA</span><time>{new Date().toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}</time></header>
              {selections.map((selection) => <section key={`print-${selection.id}`} className="waiter-receipt-selection"><strong>Seleção #{selection.selectionNumber}</strong><time>{dateTime(selection.createdAt)}</time><span>--------------------------------</span>{selection.items.map((item) => <div key={`print-item-${item.id}`}><span>{item.productName}</span><span>{item.quantity} × {money(item.unitPrice)} <b>{money(item.subtotal)}</b></span></div>)}<p><span>Subtotal:</span><b>{money(Number(selection.subtotal))}</b></p></section>)}
              <div className="waiter-receipt-total"><span>TOTAL ESTIMADO:</span><strong>{money(total)}</strong></div><p>Confirme os valores com o garçom.</p><footer>Obrigado!</footer>
            </section>
          </section>
        )}

        <Link href="/" className="waiter-back-link"><ArrowLeft className="h-4 w-4" /> Voltar ao menu público</Link>
      </div>
    </DashboardLayout>
  );
}
