import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ShieldCheck, UserRound, XCircle } from "lucide-react";

export default function WaitersPanel() {
  const waiters = trpc.staff.list.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const setActive = trpc.staff.setActive.useMutation({
    onSuccess: () => void utils.staff.list.invalidate(),
  });

  return (
    <DashboardLayout>
      <div className="internal-info-shell">
        <header className="waiter-header">
          <div>
            <p className="eyebrow">Administração · equipa</p>
            <h1 className="waiter-title">Garçons</h1>
            <p className="waiter-subtitle">Consulte e controle o estado de atendimento das contas autorizadas pelo Manus.</p>
          </div>
          <ShieldCheck className="h-10 w-10 text-[#C85A3F]" aria-hidden="true" />
        </header>

        {waiters.isLoading ? <div className="waiter-empty">A carregar garçons…</div> : waiters.error ? <div className="waiter-alert" role="alert">Não foi possível carregar a equipa.</div> : !waiters.data?.length ? <div className="waiter-empty">Ainda não existem contas de garçom registadas.</div> : <div className="internal-info-grid">
          {waiters.data.map((waiter) => {
            const active = waiter.waiterActive !== 0;
            return <article key={waiter.id} className="waiter-table-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow"><UserRound className="mr-1 inline h-4 w-4" /> Garçom</p>
                  <h2>{waiter.name || "Sem nome"}</h2>
                  <p>{waiter.email || "Email não registado"}</p>
                  <p><strong>{waiter.waiterCode || "Código a configurar"}</strong></p>
                </div>
                <span className={`waiter-status ${active ? "waiter-status-viewed" : "waiter-status-empty"}`}>{active ? <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> : <XCircle className="mr-1 inline h-3.5 w-3.5" />}{active ? "ACTIVO" : "DESACTIVADO"}</span>
              </div>
              <Button variant={active ? "outline" : "default"} disabled={setActive.isPending} onClick={() => setActive.mutate({ userId: waiter.id, active: !active })}>{setActive.isPending ? "A actualizar…" : active ? "Desactivar" : "Activar"}</Button>
            </article>;
          })}
        </div>}
      </div>
    </DashboardLayout>
  );
}
