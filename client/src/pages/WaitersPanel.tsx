import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { isAdminRole } from "@shared/roles";
import DashboardLayout from "@/components/DashboardLayout";
import { CheckCircle2, ClipboardList, Clock3, Edit3, History, KeyRound, Plus, Power, ShieldCheck, Trash2, UserRound, UsersRound, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

const dateTime = (value: string | Date | null | undefined) => value ? new Date(value).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" }) : "—";
const money = (value: number) => `${value.toFixed(2)} MT`;
type FormState = { id?: string; fullName: string; username: string; email: string; phone: string; password: string; accessCode: string; originalAccessCode: string; active: boolean };
type AdminFormState = { fullName: string; email: string; password: string };
type AdminEditFormState = { id: number; fullName: string; email: string; password: string };
const emptyForm: FormState = { fullName: "", username: "", email: "", phone: "", password: "", accessCode: "", originalAccessCode: "", active: true };
const emptyAdminForm: AdminFormState = { fullName: "", email: "", password: "" };

function digitsOnlyCode(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "").slice(0, 6);
}

function mapWaiterSaveError(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : "";
  if (/já está em uso|ALREADY_IN_USE/i.test(message)) return "Este código já está em uso. Escolha outro.";
  if (/6 dígitos|6 digitos|MUST_BE_6/i.test(message)) return "O código deve conter 6 dígitos.";
  if (/SAVE_FAILED|não foi possível guardar o código/i.test(message)) return "Não foi possível guardar o código de acesso. Tente novamente.";
  return "Não foi possível guardar o garçom. Verifique os dados e o código de acesso.";
}

export default function WaitersPanel() {
  const [selectedWaiterId, setSelectedWaiterId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState("");
  const [adminForm, setAdminForm] = useState<AdminFormState | null>(null);
  const [adminSuccess, setAdminSuccess] = useState(false);
  const [adminEditForm, setAdminEditForm] = useState<AdminEditFormState | null>(null);
  const [adminActionSuccess, setAdminActionSuccess] = useState("");
  const { user } = useAuth();
  const isAdmin = isAdminRole(user?.role);
  const waiters = trpc.staff.list.useQuery(undefined, { enabled: isAdmin, retry: false });
  const admins = trpc.staff.admins.useQuery(undefined, { enabled: isAdmin, retry: false });
  const assignments = trpc.staff.currentAssignments.useQuery(undefined, { enabled: isAdmin, retry: false });
  const history = trpc.staff.serviceHistory.useQuery({ userId: selectedWaiterId ?? 0 }, { enabled: isAdmin && selectedWaiterId !== null, retry: false });
  const utils = trpc.useUtils();
  const addWaiter = trpc.staff.add.useMutation({
    onSuccess: async () => {
      setForm(null);
      setFormError("");
      await Promise.all([utils.staff.list.invalidate(), utils.tableHistory.receiptWaiters.invalidate()]);
      await utils.staff.list.refetch();
    },
  });
  const createAdmin = trpc.staff.createAdmin.useMutation({ onSuccess: async () => { setAdminForm(null); setAdminSuccess(true); await utils.staff.admins.invalidate(); } });
  const updateAdmin = trpc.staff.updateAdmin.useMutation({ onSuccess: async () => { setAdminEditForm(null); setAdminActionSuccess("Administrador actualizado com sucesso."); await utils.staff.admins.invalidate(); } });
  const setAdminActive = trpc.staff.setAdminActive.useMutation({ onSuccess: async (result) => { setAdminActionSuccess(`Administrador ${result.waiterActive === 1 ? "activado" : "desactivado"} com sucesso.`); await utils.staff.admins.invalidate(); } });
  const deleteAdmin = trpc.staff.deleteAdmin.useMutation({ onSuccess: async () => { setAdminActionSuccess("Administrador apagado. O histórico foi preservado."); await utils.staff.admins.invalidate(); } });
  const updateWaiter = trpc.staff.update.useMutation({
    onSuccess: async () => {
      setForm(null);
      setFormError("");
      await Promise.all([utils.staff.list.invalidate(), utils.staff.currentAssignments.invalidate(), utils.tableHistory.receiptWaiters.invalidate()]);
      await utils.staff.list.refetch();
    },
  });
  const setActive = trpc.staff.setActive.useMutation({ onSuccess: async () => { await Promise.all([utils.staff.list.invalidate(), utils.staff.currentAssignments.invalidate(), utils.tableHistory.receiptWaiters.invalidate()]); } });
  const deleteWaiter = trpc.staff.delete.useMutation({ onSuccess: async () => { setSelectedWaiterId(null); setForm(null); await Promise.all([utils.staff.list.invalidate(), utils.staff.currentAssignments.invalidate(), utils.tableHistory.receiptWaiters.invalidate()]); } });
  const assignmentsByWaiter = useMemo(() => {
    const map = new Map<number, typeof assignments.data>();
    for (const entry of assignments.data ?? []) { const current = map.get(entry.waiter.id) ?? []; current.push(entry); map.set(entry.waiter.id, current); }
    return map;
  }, [assignments.data]);
  const pending = addWaiter.isPending || updateWaiter.isPending;

  const openEditWaiter = (garcon: { id: string; fullName: string; username: string; email: string; phone: string | null }, waiterCode: string | null | undefined, active: boolean) => {
    const code = digitsOnlyCode(waiterCode);
    setFormError("");
    setForm({
      id: garcon.id,
      fullName: garcon.fullName,
      username: garcon.username,
      email: garcon.email,
      phone: garcon.phone ?? "",
      password: "",
      accessCode: code,
      originalAccessCode: code,
      active,
    });
  };

  const submitForm = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setFormError("");

    if (form.id) {
      const code = digitsOnlyCode(form.accessCode);
      if (!/^\d{6}$/.test(code)) {
        setFormError("O código deve conter 6 dígitos.");
        return;
      }

      const codeChanged = code !== form.originalAccessCode;
      if (codeChanged) {
        const confirmed = window.confirm("O código de acesso deste garçom será alterado. O código anterior deixará de funcionar.");
        if (!confirmed) return;
      }

      // Always send accessCode on edit so the backend persists the credential used by quick login.
      updateWaiter.mutate({
        id: form.id,
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password || undefined,
        accessCode: code,
        active: form.active,
      });
    } else {
      addWaiter.mutate({
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        active: form.active,
      });
    }
  };

  const submitAdminForm = (event: React.FormEvent) => { event.preventDefault(); if (!adminForm) return; setAdminSuccess(false); createAdmin.mutate(adminForm); };
  const submitAdminEditForm = (event: React.FormEvent) => { event.preventDefault(); if (!adminEditForm) return; updateAdmin.mutate({ ...adminEditForm, password: adminEditForm.password.trim() || undefined }); };

  return <DashboardLayout>
    <div className="internal-info-shell space-y-8">
      <header className="waiter-header"><div><p className="eyebrow">Administração · equipa</p><h1 className="waiter-title">Garçons</h1><p className="waiter-subtitle">Cadastre, active, desactive e acompanhe a equipa. O histórico nunca é apagado.</p></div><ShieldCheck className="h-10 w-10 text-[#C85A3F]" aria-hidden="true" /></header>

      <section className="space-y-4" aria-labelledby="add-waiter-title"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="add-waiter-title" className="text-xl font-semibold text-foreground">Adicionar Garçom</h2><p className="text-sm text-muted-foreground">Crie uma conta operacional com autenticação segura. Um código rápido de 6 dígitos será gerado automaticamente.</p></div><Button onClick={() => { setFormError(""); setForm(emptyForm); }}><Plus className="mr-1 h-4 w-4" /> Adicionar Garçom</Button></div>
        {form && <form onSubmit={submitForm} className="rounded-lg border border-border bg-card p-4 text-card-foreground space-y-4" aria-label="Formulário de garçom"><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-sm">Nome completo<input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="w-full rounded-md border border-border bg-background p-2" /></label><label className="space-y-1 text-sm">Nome de utilizador<input required pattern="[a-z0-9._-]+" minLength={3} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full rounded-md border border-border bg-background p-2" /></label><label className="space-y-1 text-sm">Email<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full rounded-md border border-border bg-background p-2" /></label><label className="space-y-1 text-sm">Telefone<input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full rounded-md border border-border bg-background p-2" /></label>{!form.id ? <label className="space-y-1 text-sm">Palavra-passe<input required type="password" minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full rounded-md border border-border bg-background p-2" /></label> : <label className="space-y-1 text-sm">Código de acesso<span className="ml-1 text-xs text-muted-foreground">(6 dígitos)</span><input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={form.accessCode} onChange={e => setForm({ ...form, accessCode: e.target.value.replace(/\D/g, "").slice(0, 6) })} className="w-full rounded-md border border-border bg-background p-2 text-center text-lg font-semibold tracking-[0.35em]" placeholder="000000" /></label>}<label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Activo</label></div>{form.id && form.accessCode.length > 0 && form.accessCode.length !== 6 && <p className="text-sm text-destructive">O código deve conter 6 dígitos.</p>}<div className="flex flex-wrap gap-2"><Button type="submit" disabled={pending || (Boolean(form.id) && form.accessCode.length !== 6)}>{pending ? "A guardar…" : form.id ? "Guardar alterações" : "Criar Garçom"}</Button><Button type="button" variant="outline" onClick={() => { setForm(null); setFormError(""); }}>Cancelar</Button></div>{(formError || addWaiter.error || updateWaiter.error) && <p className="waiter-alert" role="alert">{formError || mapWaiterSaveError(addWaiter.error || updateWaiter.error)}</p>}</form>}
      </section>

      <section className="space-y-4" aria-labelledby="create-admin-title"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="create-admin-title" className="text-xl font-semibold text-foreground">Criar Administrador</h2><p className="text-sm text-muted-foreground">Adicione outro administrador com as mesmas permissões do painel actual.</p></div><Button onClick={() => { setAdminSuccess(false); setAdminActionSuccess(""); setAdminForm(emptyAdminForm); }}> <ShieldCheck className="mr-1 h-4 w-4" /> Criar Administrador</Button></div>{adminForm && <form onSubmit={submitAdminForm} className="rounded-lg border border-border bg-card p-4 text-card-foreground space-y-4" aria-label="Formulário de administrador"><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-sm">Nome completo<input required value={adminForm.fullName} onChange={e => setAdminForm({ ...adminForm, fullName: e.target.value })} className="w-full rounded-md border border-border bg-background p-2" /></label><label className="space-y-1 text-sm">Email<input required type="email" value={adminForm.email} onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} className="w-full rounded-md border border-border bg-background p-2" /></label><label className="space-y-1 text-sm">Palavra-passe<input required type="password" minLength={6} value={adminForm.password} onChange={e => setAdminForm({ ...adminForm, password: e.target.value })} className="w-full rounded-md border border-border bg-background p-2" /></label><label className="space-y-1 text-sm">Perfil<input readOnly value="Administrador" className="w-full rounded-md border border-border bg-muted p-2 text-muted-foreground" /></label></div><div className="flex flex-wrap gap-2"><Button type="submit" disabled={createAdmin.isPending}>{createAdmin.isPending ? "A criar…" : "Criar Administrador"}</Button><Button type="button" variant="outline" onClick={() => setAdminForm(null)}>Cancelar</Button></div>{createAdmin.error && <p className="waiter-alert" role="alert">{createAdmin.error.message.includes("ADMIN_EMAIL_ALREADY_EXISTS") ? "Este email já está cadastrado." : "Não foi possível criar o administrador. Verifique se os dados são válidos."}</p>}{adminSuccess && <p className="waiter-success" role="status">Administrador criado com sucesso.</p>}</form>}{adminActionSuccess && <p className="waiter-success" role="status">{adminActionSuccess}</p>}{adminEditForm && <form onSubmit={submitAdminEditForm} className="rounded-lg border border-border bg-card p-4 text-card-foreground space-y-4" aria-label="Editar administrador"><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-sm">Nome completo<input required value={adminEditForm.fullName} onChange={e => setAdminEditForm({ ...adminEditForm, fullName: e.target.value })} className="w-full rounded-md border border-border bg-background p-2" /></label><label className="space-y-1 text-sm">Email<input required type="email" value={adminEditForm.email} onChange={e => setAdminEditForm({ ...adminEditForm, email: e.target.value })} className="w-full rounded-md border border-border bg-background p-2" /></label><label className="space-y-1 text-sm">Nova palavra-passe<span className="ml-1 text-xs text-muted-foreground">(opcional)</span><input type="password" minLength={8} autoComplete="new-password" value={adminEditForm.password} onChange={e => setAdminEditForm({ ...adminEditForm, password: e.target.value })} placeholder="Deixe vazio para manter" className="w-full rounded-md border border-border bg-background p-2" /></label><label className="space-y-1 text-sm">Perfil<input readOnly value="Administrador" className="w-full rounded-md border border-border bg-muted p-2 text-muted-foreground" /></label></div><div className="flex flex-wrap gap-2"><Button type="submit" disabled={updateAdmin.isPending}>{updateAdmin.isPending ? "A guardar…" : "Guardar alterações"}</Button><Button type="button" variant="outline" onClick={() => setAdminEditForm(null)}>Cancelar</Button></div>{updateAdmin.error && <p className="waiter-alert" role="alert">Não foi possível actualizar este administrador. Verifique o email.</p>}</form>}<div className="rounded-lg border border-border bg-card p-4 text-card-foreground"><div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold">Administradores existentes</h3><span className="rounded-full border border-border px-3 py-1 text-xs">{admins.data?.length ?? 0} contas</span></div>{admins.isLoading ? <p className="text-sm text-muted-foreground">A carregar administradores…</p> : admins.error ? <p className="waiter-alert" role="alert">Não foi possível carregar os administradores.</p> : <div className="grid gap-4 lg:grid-cols-2">{(admins.data ?? []).map(admin => { const active = admin.waiterActive === 1; const currentEmail = user?.email?.trim().toLowerCase(); const adminEmail = admin.email?.trim().toLowerCase(); const isSelf = admin.id === user?.id || Boolean(currentEmail && adminEmail && currentEmail === adminEmail); const canManage = admin.openId.startsWith("supabase:"); return <article key={admin.id} className="waiter-table-card space-y-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="eyebrow"><ShieldCheck className="mr-1 inline h-4 w-4" /> Administrador</p><h4 className="truncate text-lg font-semibold text-foreground">{admin.name || "Sem nome"}</h4><p className="truncate text-sm text-muted-foreground">{admin.email || "Sem email"}</p></div><span className={`waiter-status shrink-0 ${active ? "waiter-status-viewed" : "waiter-status-empty"}`}>{active ? <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> : <XCircle className="mr-1 inline h-3.5 w-3.5" />}{active ? "ACTIVO" : "INACTIVO"}</span></div><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!canManage} onClick={() => setAdminEditForm({ id: admin.id, fullName: admin.name ?? "", email: admin.email ?? "", password: "" })}><Edit3 className="mr-2 h-4 w-4" /> Editar</Button><Button variant={active ? "outline" : "default"} disabled={setAdminActive.isPending || isSelf || !canManage} onClick={() => { if (!isSelf && window.confirm(`Tem certeza que deseja ${active ? "desactivar" : "activar"} esta conta de administrador?`)) setAdminActive.mutate({ id: admin.id, active: !active }); }}><Power className="mr-2 h-4 w-4" />{setAdminActive.isPending ? "A actualizar…" : active ? "Desactivar" : "Activar"}</Button><Button variant="ghost" disabled={deleteAdmin.isPending || isSelf || !canManage} className="text-destructive hover:text-destructive" onClick={() => { if (!isSelf && window.confirm(`Tem certeza que deseja apagar permanentemente a conta de ${admin.name || admin.email || "este administrador"}? O histórico será preservado.`)) deleteAdmin.mutate({ id: admin.id }); }}><Trash2 className="mr-2 h-4 w-4" />{deleteAdmin.isPending ? "A apagar…" : "Apagar"}</Button></div>{isSelf && <p className="text-xs text-muted-foreground">A sua própria conta não pode ser desactivada ou apagada.</p>}{!canManage && <p className="text-xs text-muted-foreground">Conta legada sem identidade Supabase gerível.</p>}{(setAdminActive.error || deleteAdmin.error) && <p className="waiter-alert" role="alert">Não foi possível concluir a operação.</p>}</article>; })}</div>}</div></section>

      <section className="space-y-4" aria-labelledby="waiters-list-title"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="waiters-list-title" className="text-xl font-semibold text-foreground">Lista de garçons</h2><p className="text-sm text-muted-foreground">Cada garçom possui um código rápido exclusivo para entrar sem email e palavra-passe. Altere o código em Editar.</p></div><span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm text-card-foreground"><UsersRound className="h-4 w-4" /> {waiters.data?.length ?? 0} contas</span></div>
        {waiters.isLoading ? <div className="waiter-empty">A carregar garçons…</div> : waiters.error ? <div className="waiter-alert" role="alert">Não foi possível carregar a equipa.</div> : !waiters.data?.length ? <div className="waiter-empty">Ainda não existem garçons registados neste restaurante.</div> : <div className="grid gap-4 lg:grid-cols-2">{waiters.data.map(({ garcon, user: waiterUser }) => { const active = garcon.status === "ATIVO"; const currentTables = assignmentsByWaiter.get(waiterUser.id) ?? []; const displayCode = digitsOnlyCode(waiterUser.waiterCode) || waiterUser.waiterCode || "—"; return <article key={garcon.id} className="waiter-table-card space-y-4"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="eyebrow"><UserRound className="mr-1 inline h-4 w-4" /> Garçom</p><h3 className="truncate text-lg font-semibold text-foreground">{garcon.fullName}</h3><p className="truncate text-sm text-muted-foreground">{garcon.email}</p><p className="mt-1 text-xs text-muted-foreground">Utilizador: {garcon.username} · {garcon.phone || "Telefone não registado"}</p></div><span className={`waiter-status shrink-0 ${active ? "waiter-status-viewed" : "waiter-status-empty"}`}>{active ? <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> : <XCircle className="mr-1 inline h-3.5 w-3.5" />}{active ? "ACTIVO" : "INACTIVO"}</span></div><div className="rounded-lg border border-border bg-background/70 p-3 text-sm text-foreground"><div className="flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 font-medium"><KeyRound className="h-4 w-4 text-[#C85A3F]" /> Código de acesso</p><code className="rounded-md bg-muted px-3 py-1 text-base font-bold tracking-widest">{displayCode}</code></div><p className="mt-1 text-xs text-muted-foreground">Código exclusivo. Só pode ser alterado pelo administrador em Editar.</p></div><div className="rounded-lg border border-border bg-background/70 p-3 text-sm text-foreground"><p className="mb-2 flex items-center gap-2 font-medium"><ClipboardList className="h-4 w-4 text-[#C85A3F]" /> Mesas actuais</p>{currentTables.length ? <div className="flex flex-wrap gap-2">{currentTables.map(entry => <span key={entry.table.sessionToken} className="rounded-full bg-[#E9F1E8] px-3 py-1 text-xs text-[#214C3A]">Mesa {entry.table.tableNumber}</span>)}</div> : <p className="text-muted-foreground">Nenhuma mesa em atendimento.</p>}</div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => openEditWaiter(garcon, waiterUser.waiterCode, active)}><Edit3 className="mr-2 h-4 w-4" /> Editar</Button><Button variant="outline" onClick={() => setSelectedWaiterId(waiterUser.id)}><History className="mr-2 h-4 w-4" /> Histórico</Button><Button variant={active ? "outline" : "default"} disabled={setActive.isPending || deleteWaiter.isPending} onClick={() => setActive.mutate({ id: garcon.id, active: !active })}>{setActive.isPending ? "A actualizar…" : active ? "Desactivar" : "Activar"}</Button><Button variant="ghost" disabled={deleteWaiter.isPending || setActive.isPending} className="text-destructive hover:text-destructive" onClick={() => { if (window.confirm(`Apagar a conta de ${garcon.fullName}? O histórico será preservado, mas o acesso será removido.`)) deleteWaiter.mutate({ id: garcon.id }); }}>{deleteWaiter.isPending ? "A apagar…" : "Apagar garçom"}</Button></div></article>; })}</div>}
      </section>

      {selectedWaiterId !== null && <section className="space-y-4" aria-labelledby="waiter-history-title"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="waiter-history-title" className="text-xl font-semibold text-foreground">Histórico de atendimento</h2><p className="text-sm text-muted-foreground">Mesas, pedidos vistos, finalizações e operações registadas com data e hora.</p></div><Button variant="outline" onClick={() => setSelectedWaiterId(null)}>Fechar histórico</Button></div>{history.isLoading ? <div className="waiter-empty">A carregar histórico…</div> : history.error ? <div className="waiter-alert" role="alert">Não foi possível carregar o histórico deste garçom.</div> : history.data && <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-border bg-card p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Mesas</p><p className="mt-1 text-2xl font-semibold text-card-foreground">{history.data.sessions.length}</p></div><div className="rounded-lg border border-border bg-card p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Pedidos</p><p className="mt-1 text-2xl font-semibold text-card-foreground">{history.data.sessions.reduce((sum, session) => sum + session.orderCount, 0)}</p></div><div className="rounded-lg border border-border bg-card p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Total registado</p><p className="mt-1 text-2xl font-semibold text-card-foreground">{money(history.data.sessions.reduce((sum, session) => sum + session.total, 0))}</p></div></div>{!history.data.sessions.length ? <div className="waiter-empty">Nenhum atendimento histórico registado.</div> : <div className="grid gap-3">{history.data.sessions.map(session => <article key={session.sessionToken} className="rounded-lg border border-border bg-card p-4 text-card-foreground"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Mesa {session.tableNumber}</h3><p className="text-sm text-muted-foreground">Aberta: {dateTime(session.createdAt)} · Fechada: {dateTime(session.closedAt)}</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs">{session.status}</span></div><div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground"><span>{session.orderCount} pedidos</span><span>{session.viewedOrderCount} vistos</span><span>{money(session.total)}</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {dateTime(session.attendingSince)}</span></div></article>)}</div>}{history.data.events.length > 0 && <div className="rounded-lg border border-border bg-card p-4"><h3 className="mb-3 font-semibold text-card-foreground">Operações auditadas</h3><div className="divide-y divide-border">{history.data.events.map(event => <div key={event.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><span className="text-card-foreground">{event.action}</span><span className="text-muted-foreground">{dateTime(event.createdAt)}</span></div>)}</div></div>}</div>}</section>}
    </div>
  </DashboardLayout>;
}
