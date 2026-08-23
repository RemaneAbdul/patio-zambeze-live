import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { createClient } from "@supabase/supabase-js";
import { LogIn, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });

export default function WaiterLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const utils = trpc.useUtils();
  const profileQuery = trpc.staff.profile.useQuery(undefined, { enabled: false, retry: false });
  const recordLogin = trpc.auth.recordLogin.useMutation();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setRecoverySent(false);
    utils.auth.me.setData(undefined, null);
    try {
      sessionStorage.removeItem("supabase-access-token");
      localStorage.removeItem("manus-runtime-user-info");
    } catch {
      // Storage may be unavailable in private browsing; authentication still proceeds.
    }
    try {
      await supabase.auth.signOut();
    } catch {
      // A sessão local já foi limpa; prosseguir com a autenticação actual.
    }
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError || !data.session) {
      setError("Email ou palavra-passe inválidos, ou conta desactivada.");
      setLoading(false);
      return;
    }

    sessionStorage.setItem("supabase-access-token", data.session.access_token);
    const profileResult = await profileQuery.refetch();
    const profile = profileResult.data;
    if (!profile) {
      sessionStorage.removeItem("supabase-access-token");
      await supabase.auth.signOut();
      setError("O seu perfil não está configurado ou está inactivo. Contacte o administrador.");
      setLoading(false);
      return;
    }

    await recordLogin.mutateAsync();
    await utils.auth.me.invalidate();
    navigate(profile.role === "admin" ? "/painel/admin" : "/painel/garcom");
    setLoading(false);
  };

  const recoverPassword = async () => {
    setError("");
    setRecoverySent(false);
    if (!email.trim()) {
      setError("Introduza primeiro o email da conta.");
      return;
    }
    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/painel/login`,
    });
    if (recoveryError) {
      setError("Não foi possível enviar o email de recuperação. Tente novamente.");
      return;
    }
    setRecoverySent(true);
  };

  return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground"><section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-xl"><div className="mb-8 flex items-center gap-3"><div className="rounded-xl bg-[#C85A3F] p-3 text-white"><ShieldCheck className="h-6 w-6" /></div><div><p className="eyebrow">Pátio Zambeze</p><h1 className="text-2xl font-semibold">Acesso ao painel</h1></div></div><p className="mb-6 text-sm text-muted-foreground">Entre com o seu email e palavra-passe. Administradores e garçons serão encaminhados para a área correspondente.</p><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-medium">Email<input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-3" /></label><label className="block text-sm font-medium">Palavra-passe<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-3" /></label>{error && <p className="waiter-alert" role="alert">{error}</p>}{recoverySent && <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700" role="status">Se existir uma conta com este email, receberá instruções para redefinir a palavra-passe.</p>}<Button className="w-full" disabled={loading}>{loading ? "A autenticar…" : <><LogIn className="mr-2 h-4 w-4" /> Entrar no painel</>}</Button><button type="button" onClick={recoverPassword} disabled={loading} className="w-full text-sm font-medium text-primary underline-offset-4 hover:underline">Esqueci-me da palavra-passe</button></form></section></main>;
}
