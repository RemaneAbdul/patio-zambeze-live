import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getSupabaseBrowserConfig } from "@/lib/supabaseBrowserConfig";
import { createClient } from "@supabase/supabase-js";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const supabaseConfig = getSupabaseBrowserConfig(import.meta.env);
const supabase = supabaseConfig
  ? createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: { persistSession: true, detectSessionInUrl: true, autoRefreshToken: false },
    })
  : null;

export default function PasswordReset() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const recordPasswordChange = trpc.auth.recordPasswordChange.useMutation();

  useEffect(() => {
    let mounted = true;
    if (!supabase) {
      setReady(true);
      setHasSession(false);
      return () => {
        mounted = false;
      };
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const accessToken = data.session?.access_token;
      if (accessToken) {
        sessionStorage.setItem("supabase-access-token", accessToken);
      }
      setHasSession(Boolean(data.session));
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("A nova palavra-passe deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    if (!supabase) {
      setError("O serviço de autenticação não está configurado neste ambiente.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("Não foi possível actualizar a palavra-passe. O link pode ter expirado.");
      setLoading(false);
      return;
    }

    try {
      await recordPasswordChange.mutateAsync();
    } catch {
      setError("A palavra-passe foi actualizada, mas não foi possível registar a auditoria.");
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    sessionStorage.removeItem("supabase-access-token");
    navigate("/painel/login");
  };

  return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground"><section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-xl"><div className="mb-8 flex items-center gap-3"><div className="rounded-xl bg-[#C85A3F] p-3 text-white"><ShieldCheck className="h-6 w-6" /></div><div><p className="eyebrow">Pátio Zambeze</p><h1 className="text-2xl font-semibold">Nova palavra-passe</h1></div></div>{!ready ? <p className="text-sm text-muted-foreground">A validar o link seguro…</p> : !hasSession ? <div className="space-y-4"><p className="waiter-alert" role="alert">Este link de recuperação é inválido ou expirou.</p><Button type="button" className="w-full" onClick={() => navigate("/painel/login")}>Voltar ao login</Button></div> : <form onSubmit={submit} className="space-y-4"><p className="text-sm text-muted-foreground">Defina uma nova palavra-passe para aceder ao painel interno.</p><label className="block text-sm font-medium">Nova palavra-passe<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-3" /></label><label className="block text-sm font-medium">Confirmar palavra-passe<input required minLength={8} type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-3" /></label>{error && <p className="waiter-alert" role="alert">{error}</p>}<Button className="w-full" disabled={loading}>{loading ? <><LockKeyhole className="mr-2 h-4 w-4" /> A actualizar…</> : <><LockKeyhole className="mr-2 h-4 w-4" /> Guardar nova palavra-passe</>}</Button></form>}</section></main>;
}
