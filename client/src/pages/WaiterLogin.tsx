import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { createClient } from "@supabase/supabase-js";
import { KeyRound, LogIn, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

function mapQuickLoginError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message: unknown }).message)
        : "";

  // Never expose tRPC procedure names, endpoints, stack traces or account-enumeration details.
  if (/rate.?limit|muitas tentativas/i.test(message)) {
    return "Muitas tentativas de login. Aguarde alguns segundos antes de tentar novamente.";
  }
  if (/desactivad|desativad|DISABLED|WAITER_ACCOUNT_DISABLED/i.test(message)) {
    return "Esta conta está desativada. Contacte o administrador.";
  }
  if (/6 dígitos|6 digitos|must contain|WAITER_CODE_MUST/i.test(message)) {
    return "O código deve conter 6 dígitos.";
  }
  return "Código de acesso incorreto.";
}

export default function WaiterLogin() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"code" | "credentials">("code");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const utils = trpc.useUtils();
  const profileQuery = trpc.staff.profile.useQuery(undefined, { enabled: false, retry: false });
  const loginStatusQuery = trpc.staff.loginStatus.useQuery(undefined, { enabled: false, retry: false });
  const recordLogin = trpc.auth.recordLogin.useMutation();
  const quickLogin = trpc.staff.quickLogin.useMutation();

  const submitCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("O código deve conter 6 dígitos.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await supabase.auth.signOut().catch(() => undefined);
      await quickLogin.mutateAsync({ code });
      await utils.auth.me.invalidate();
      navigate("/painel/garcom");
    } catch (err) {
      setError(mapQuickLoginError(err));
    } finally {
      setLoading(false);
    }
  };

  const submitCredentials = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setRecoverySent(false);
    try {
      sessionStorage.removeItem("supabase-access-token");
      localStorage.removeItem("manus-runtime-user-info");
    } catch {}
    try {
      await supabase.auth.signOut();
    } catch {}
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError || !data.session) {
      setError("Email ou palavra-passe inválidos, ou conta desactivada.");
      setLoading(false);
      return;
    }
    sessionStorage.setItem("supabase-access-token", data.session.access_token);
    const statusResult = await loginStatusQuery.refetch();
    if (statusResult.data?.status === "ADMIN_INACTIVE") {
      sessionStorage.removeItem("supabase-access-token");
      await supabase.auth.signOut();
      setError("Esta conta está desactivada. Contacte um administrador.");
      setLoading(false);
      return;
    }
    const profileResult = await profileQuery.refetch();
    const profile = profileResult.data;
    if (!profile) {
      sessionStorage.removeItem("supabase-access-token");
      await supabase.auth.signOut();
      setError("O seu perfil não está configurado. Contacte o administrador.");
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
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (recoveryError) {
      setError("Não foi possível enviar o email de recuperação. Tente novamente.");
      return;
    }
    setRecoverySent(true);
  };

  if (mode === "code") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
        <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-xl bg-[#C85A3F] p-3 text-white">
              <KeyRound className="h-6 w-6" />
            </div>
            <div>
              <p className="eyebrow">Pátio Zambeze</p>
              <h1 className="text-2xl font-semibold">Acesso do Garçom</h1>
            </div>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            Digite o seu código de acesso de 6 dígitos para entrar rapidamente.
          </p>
          <form onSubmit={submitCode} className="space-y-4">
            <label className="block text-sm font-medium">
              Código de acesso
              <input
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="mt-1 w-full rounded-md border border-border bg-background p-4 text-center text-2xl font-semibold tracking-[0.45em]"
                placeholder="000000"
              />
            </label>
            {error && (
              <p className="waiter-alert" role="alert">
                {error}
              </p>
            )}
            <Button className="w-full" disabled={loading || code.length !== 6}>
              {loading ? (
                "A autenticar…"
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" /> Entrar
                </>
              )}
            </Button>
            <button
              type="button"
              onClick={() => {
                setMode("credentials");
                setError("");
              }}
              className="w-full text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Acesso por email e palavra-passe
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-[#C85A3F] p-3 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="eyebrow">Pátio Zambeze</p>
            <h1 className="text-2xl font-semibold">Acesso ao painel</h1>
          </div>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          Administradores continuam a utilizar a autenticação por email e palavra-passe.
        </p>
        <form onSubmit={submitCredentials} className="space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background p-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Palavra-passe
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background p-3"
            />
          </label>
          {error && (
            <p className="waiter-alert" role="alert">
              {error}
            </p>
          )}
          {recoverySent && (
            <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700" role="status">
              Se existir uma conta com este email, receberá instruções para redefinir a palavra-passe.
            </p>
          )}
          <Button className="w-full" disabled={loading}>
            {loading ? (
              "A autenticar…"
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" /> Entrar no painel
              </>
            )}
          </Button>
          <button
            type="button"
            onClick={recoverPassword}
            disabled={loading}
            className="w-full text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Esqueci-me da palavra-passe
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("code");
              setError("");
            }}
            className="w-full text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Voltar ao acesso rápido do garçom
          </button>
        </form>
      </section>
    </main>
  );
}
