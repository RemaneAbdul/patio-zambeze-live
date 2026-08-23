import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ClipboardList, Clock3, History, Plus, ShieldCheck, UserRound, UsersRound, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

const dateTime = (value: string | Date | null | undefined) => value ? new Date(value).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" }) : "—";
const money = (value: number) => `${value.toFixed(2)} MT`;

export default function WaitersPanel() {
  const [selectedWaiterId, setSelectedWaiterId] = useState<number | null>(null);
  const waiters = trpc.staff.list.useQuery(undefined, { retry: false });
  const candidates = trpc.staff.candidates.useQuery(undefined, { retry: false });
  const assignments = trpc.staff.currentAssignments.useQuery(undefined, { retry: false });
  const history = trpc.staff.serviceHistory.useQuery({ userId: selectedWaiterId ?? 0 }, { enabled: selectedWaiterId !== null, retry: false });
  const utils = trpc.useUtils();
  const addWaiter = trpc.staff.add.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.staff.list.invalidate(), utils.staff.candidates.invalidate(), utils.staff.currentAssignments.invalidate()]);
    },
  });
  const setActive = trpc.staff.setActive.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.staff.list.invalidate(), utils.staff.currentAssignments.invalidate()]);
    },
  });

  const assignmentsByWaiter = useMemo(() => {
    const map = new Map<number, typeof assignments.data>();
    for (const entry of assignments.data ?? []) {
      const current = map.get(entry.waiter.id) ?? [];
      current.push(entry);
      map.set(entry.waiter.id, current);
    }
    return map;
  }, [assignments.data]);

  return (
    <DashboardLayout>
      <div className="internal-info-shell space-y-8">
        <header className="waiter-header">
          <div>
            <p className="eyebrow">Administração · equipa</p>
            <h1 className="waiter-title">Garçons</h1>
            <p className="waiter-subtitle">Cadastre, active, desactive e acompanhe a equipa. O histórico nunca é apagado.</p>
          </div>
          <ShieldCheck className="h-10 w-10 text-[#C85A3F]" aria-hidden="true" />
        </header>

        <div className="rounded-lg border border-[#D9B56D]/50 bg-[#FFF8E8] p-4 text-sm text-[#5B471E]" role="note"><strong>Credenciais:</strong> a autenticação e a redefinição de palavra-passe são geridas pelo Manus OAuth. O restaurante não vê nem guarda palavras-passe locais.</div>

        <section className="space-y-4" aria-labelledby="add-waiter-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 id="add-waiter-title" className="text-xl font-semibold text-foreground">Adicionar Garçom</h2><p className="text-sm text-muted-foreground">Seleccione uma conta que já tenha entrado pelo Manus. O sistema atribui automaticamente ROLE = GARÇOM.</p></div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-card-foreground"><Plus className="h-4 w-4" /> {candidates.data?.length ?? 0} disponíveis</span>
          </div>
          {candidates.isLoading ? <div className="waiter-empty">A procurar contas OAuth disponíveis…</div> : candidates.error ? <div className="waiter-alert" role="alert">Não foi possível carregar contas disponíveis.</div> : candidates.data?.length ? <div className="grid gap-3 sm:grid-cols-2">{candidates.data.map((candidate) => <div key={candidate.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 text-card-foreground"><div className="min-w-0"><p className="truncate font-medium">{candidate.name || "Sem nome"}</p><p className="truncate text-xs text-muted-foreground">{candidate.email || candidate.openId}</p></div><Button size="sm" disabled={addWaiter.isPending} onClick={() => addWaiter.mutate({ userId: candidate.id })}><Plus className="mr-1 h-4 w-4" /> Adicionar</Button></div>)}</div> : <div className="waiter-empty">Não existem contas OAuth disponíveis para adicionar.</div>}
        </section>

        <section className="space-y-4" aria-labelledby="waiters-list-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="waiters-list-title" className="text-xl font-semibold text-foreground">Lista de garçons</h2>
              <p className="text-sm text-muted-foreground">Utilizadores OAuth existentes, sem palavras-passe locais nem fotografias.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-card-foreground"><UsersRound className="h-4 w-4" /> {waiters.data?.length ?? 0} contas</span>
          </div>

          {waiters.isLoading ? <div className="waiter-empty">A carregar garçons…</div> : waiters.error ? <div className="waiter-alert" role="alert">Não foi possível carregar a equipa.</div> : !waiters.data?.length ? <div className="waiter-empty">Ainda não existem contas de garçom registadas. A conta deve primeiro autenticar-se pelo Manus.</div> : <div className="grid gap-4 lg:grid-cols-2">
            {waiters.data.map((waiter) => {
              const active = waiter.waiterActive !== 0;
              const currentTables = assignmentsByWaiter.get(waiter.id) ?? [];
              return <article key={waiter.id} className="waiter-table-card space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="eyebrow"><UserRound className="mr-1 inline h-4 w-4" /> Garçom</p>
                    <h3 className="truncate text-lg font-semibold text-foreground">{waiter.name || "Sem nome"}</h3>
                    <p className="truncate text-sm text-muted-foreground">{waiter.email || "Email não registado"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Utilizador: {waiter.waiterCode || waiter.openId}</p>
                  </div>
                  <span className={`waiter-status shrink-0 ${active ? "waiter-status-viewed" : "waiter-status-empty"}`}>{active ? <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> : <XCircle className="mr-1 inline h-3.5 w-3.5" />}{active ? "ACTIVO" : "DESACTIVADO"}</span>
                </div>
                <div className="rounded-lg border border-border bg-background/70 p-3 text-sm text-foreground">
                  <p className="mb-2 flex items-center gap-2 font-medium"><ClipboardList className="h-4 w-4 text-[#C85A3F]" /> Mesas actuais</p>
                  {currentTables.length ? <div className="flex flex-wrap gap-2">{currentTables.map((entry) => <span key={entry.table.sessionToken} className="rounded-full bg-[#E9F1E8] px-3 py-1 text-xs text-[#214C3A]">Mesa {entry.table.tableNumber}</span>)}</div> : <p className="text-muted-foreground">Nenhuma mesa em atendimento.</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setSelectedWaiterId(waiter.id)}><History className="mr-2 h-4 w-4" /> Histórico</Button>
                  <Button variant={active ? "outline" : "default"} disabled={setActive.isPending} onClick={() => setActive.mutate({ userId: waiter.id, active: !active })}>{setActive.isPending ? "A actualizar…" : active ? "Desactivar" : "Activar"}</Button>
                </div>
              </article>;
            })}
          </div>}
        </section>

        {selectedWaiterId !== null && <section className="space-y-4" aria-labelledby="waiter-history-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="waiter-history-title" className="text-xl font-semibold text-foreground">Histórico de atendimento</h2>
              <p className="text-sm text-muted-foreground">Mesas, pedidos vistos, finalizações e operações registadas com data e hora.</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedWaiterId(null)}>Fechar histórico</Button>
          </div>
          {history.isLoading ? <div className="waiter-empty">A carregar histórico…</div> : history.error ? <div className="waiter-alert" role="alert">Não foi possível carregar o histórico deste garçom.</div> : history.data && <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Mesas</p><p className="mt-1 text-2xl font-semibold text-card-foreground">{history.data.sessions.length}</p></div>
              <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Pedidos</p><p className="mt-1 text-2xl font-semibold text-card-foreground">{history.data.sessions.reduce((sum, session) => sum + session.orderCount, 0)}</p></div>
              <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Total registado</p><p className="mt-1 text-2xl font-semibold text-card-foreground">{money(history.data.sessions.reduce((sum, session) => sum + session.total, 0))}</p></div>
            </div>
            {!history.data.sessions.length ? <div className="waiter-empty">Nenhum atendimento histórico registado.</div> : <div className="grid gap-3">{history.data.sessions.map((session) => <article key={session.sessionToken} className="rounded-lg border border-border bg-card p-4 text-card-foreground"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Mesa {session.tableNumber}</h3><p className="text-sm text-muted-foreground">Aberta: {dateTime(session.createdAt)} · Fechada: {dateTime(session.closedAt)}</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs">{session.status}</span></div><div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground"><span>{session.orderCount} pedidos</span><span>{session.viewedOrderCount} vistos</span><span>{money(session.total)}</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {dateTime(session.attendingSince)}</span></div></article>)}</div>}
            {history.data.events.length > 0 && <div className="rounded-lg border border-border bg-card p-4"><h3 className="mb-3 font-semibold text-card-foreground">Operações auditadas</h3><div className="divide-y divide-border">{history.data.events.map((event) => <div key={event.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><span className="text-card-foreground">{event.action}</span><span className="text-muted-foreground">{dateTime(event.createdAt)}</span></div>)}</div></div>}
          </div>}
        </section>}
      </div>
    </DashboardLayout>
  );
}
