import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { createClient } from "@supabase/supabase-js";
import { KeyRound, LogIn, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
const QUICK_CODE_PATTERN = /^\d{6}$/;
const QUICK_CODE_ERROR = "Código de acesso incorreto.";
type LoginMode = "waiter" | "admin";

export default function WaiterLogin() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<LoginMode>("waiter");
  const [accessCode, setAccessCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const utils = trpc.useUtils();
  const profileQuery = trpc.staff.profile.useQuery(undefined, { enabled: false, retry: false });
  const loginStatusQuery = trpc.staff.loginStatus.useQuery(undefined, { enabled: false, retry: false });
  const quickLogin = trpc.staff.quickLogin.useMutation();
  const recordLogin = trpc.auth.recordLogin.useMutation();
  const logout = trpc.auth.logout.useMutation();

  const clearClientAuth = () => {
    try {
      sessionStorage.removeItem("supabase-access-token");
      localStorage.removeItem("manus-runtime-user-info");
    } catch {
      // Storage may be unavailable in private browsing.
    }
  };

  const selectMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    setError("");
    setRecoverySent(false);
  };

  const submitQuickLogin = async () => {
    if (!QUICK_CODE_PATTERN.test(accessCode)) {
      setError(QUICK_CODE_ERROR);
      return;
    }
    await quickLogin.mutateAsync({ code: accessCode });
    const profileResult = await profileQuery.refetch();
    const profile = profileResult.data;
    if (!profile || profile.role !== "garcom") throw new Error(QUICK_CODE_ERROR);
    await recordLogin.mutateAsync();
    await utils.auth.me.invalidate();
    navigate("/painel/garcom");
  };

  const submitAdminLogin = async () => {
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError || !data.session) {
      setError("Email ou palavra-passe inválidos, ou conta desactivada.");
      return;
    }

    sessionStorage.setItem("supabase-access-token", data.session.access_token);
    const statusResult = await loginStatusQuery.refetch();
    if (statusResult.data?.status === "ADMIN_INACTIVE") {
      clearClientAuth();
      await supabase.auth.signOut();
      setError("Esta conta está desactivada. Contacte um administrador.");
      return;
    }
    const profileResult = await profileQuery.refetch();
    const profile = profileResult.data;
    if (!profile || profile.role !== "admin") {
      clearClientAuth();
      await supabase.auth.signOut();
      setError("O seu perfil de administrador não está configurado. Contacte o administrador.");
      return;
    }

    await recordLogin.mutateAsync();
    await utils.auth.me.invalidate();
    navigate("/painel/admin");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setRecoverySent(false);
    utils.auth.me.setData(undefined, null);
    clearClientAuth();
    try {
      await supabase.auth.signOut();
      await logout.mutateAsync();
    } catch {
      // A limpeza local/servidor é best effort; o fluxo actual continua.
    }

    try {
      if (mode === "waiter") await submitQuickLogin();
      else await submitAdminLogin();
    } catch {
      clearClientAuth();
      try { await supabase.auth.signOut(); } catch { /* sessão já inválida ou ausente */ }
      setError(mode === "waiter" ? QUICK_CODE_ERROR : "Não foi possível concluir o acesso. Verifique os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const recoverPassword = async () => {
    setError("");
    setRecoverySent(false);
    if (!email.trim()) {
      setError("Introduza primeiro o email da conta.");
      return;
    }
    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (recoveryError) {
      setError("Não foi possível enviar o email de recuperação. Tente novamente.");
      return;
    }
    setRecoverySent(true);
  };

  return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground"><section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-xl"><div className="mb-8 flex items-center gap-3"><div className="rounded-xl bg-[#C85A3F] p-3 text-white"><ShieldCheck className="h-6 w-6" /></div><div><p className="eyebrow">Pátio Zambeze</p><h1 className="text-2xl font-semibold">Acesso ao painel</h1></div></div><div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-muted p-1" role="tablist" aria-label="Tipo de acesso"><button type="button" role="tab" aria-selected={mode === "waiter"} onClick={() => selectMode("waiter")} className={`rounded-md px-3 py-2 text-sm font-medium ${mode === "waiter" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}><KeyRound className="mr-1 inline h-4 w-4" /> Garçom</button><button type="button" role="tab" aria-selected={mode === "admin"} onClick={() => selectMode("admin")} className={`rounded-md px-3 py-2 text-sm font-medium ${mode === "admin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}><ShieldCheck className="mr-1 inline h-4 w-4" /> Administrador</button></div><p className="mb-6 text-sm text-muted-foreground">{mode === "waiter" ? "Introduza o código de acesso de 6 dígitos fornecido pelo administrador." : "Entre com o email e palavra-passe da conta de administrador."}</p><form onSubmit={submit} className="space-y-4">{mode === "waiter" ? <label className="block text-sm font-medium">Código de acesso<input required type="text" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} autoComplete="one-time-code" value={accessCode} onChange={e => setAccessCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-1 w-full rounded-md border border-border bg-background p-3 text-center text-2xl tracking-[0.5em]" aria-describedby="quick-code-help" autoFocus /><span id="quick-code-help" className="mt-1 block text-xs text-muted-foreground">O código deve conter exactamente 6 números.</span></label> : <><label className="block text-sm font-medium">Email<input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-3" /></label><label className="block text-sm font-medium">Palavra-passe<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-3" /></label></>}{error && <p className="waiter-alert" role="alert">{error}</p>}{recoverySent && <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700" role="status">Se existir uma conta com este email, receberá instruções para redefinir a palavra-passe.</p>}<Button className="w-full" disabled={loading || (mode === "waiter" && accessCode.length !== 6)}>{loading ? "A autenticar…" : <><LogIn className="mr-2 h-4 w-4" /> Entrar no painel</>}</Button>{mode === "admin" && <button type="button" onClick={recoverPassword} disabled={loading} className="w-full text-sm font-medium text-primary underline-offset-4 hover:underline">Esqueci-me da palavra-passe</button>}</form></section></main>;
}
