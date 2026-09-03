import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { createClient } from "@supabase/supabase-js";
import { KeyRound, LogIn, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const ENV_SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const ENV_SUPABASE_PUBLISHABLE_KEY = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? "").trim();
const AUTH_OPERATION_TIMEOUT_MS = 15_000;
const AUTH_SIGN_OUT_TIMEOUT_MS = 5_000;

type SupabaseConfig = { supabaseUrl: string; publishableKey: string };
let supabase: ReturnType<typeof createClient> | null = null;
let supabaseConfigPromise: Promise<ReturnType<typeof createClient>> | null = null;

function withTimeout<T>(operation: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    operation.then(
      (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function getSupabaseClient() {
  if (supabase) return supabase;
  if (supabaseConfigPromise) return supabaseConfigPromise;

  supabaseConfigPromise = (async () => {
    let config: SupabaseConfig | null = null;

    if (ENV_SUPABASE_URL && ENV_SUPABASE_PUBLISHABLE_KEY) {
      config = { supabaseUrl: ENV_SUPABASE_URL, publishableKey: ENV_SUPABASE_PUBLISHABLE_KEY };
    } else {
      const response = await withTimeout(
        fetch("/api/auth-config", { credentials: "include", cache: "no-store" }),
        AUTH_OPERATION_TIMEOUT_MS,
        "AUTH_CONFIG_TIMEOUT",
      );
      if (!response.ok) throw new Error("SUPABASE_AUTH_CLIENT_CONFIGURATION_MISSING");
      const data = (await response.json()) as Partial<SupabaseConfig>;
      if (!data.supabaseUrl || !data.publishableKey) throw new Error("SUPABASE_AUTH_CLIENT_CONFIGURATION_MISSING");
      config = { supabaseUrl: data.supabaseUrl.trim(), publishableKey: data.publishableKey.trim() };
    }

    try {
      supabase = createClient(config.supabaseUrl, config.publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      return supabase;
    } catch (error) {
      console.error("[Auth configuration] Supabase client could not be initialized", error);
      throw new Error("SUPABASE_AUTH_CLIENT_CONFIGURATION_MISSING");
    }
  })();

  try {
    return await supabaseConfigPromise;
  } catch (error) {
    supabaseConfigPromise = null;
    throw error;
  }
}

function clearSupabaseBrowserState() {
  try {
    sessionStorage.removeItem("supabase-access-token");
    localStorage.removeItem("manus-runtime-user-info");
  } catch {
    // Storage can be blocked by private browsing or an embedded WebView.
  }
}

function signOutSupabaseSilently() {
  if (!supabase) return;
  void supabase.auth.signOut().catch((error) => {
    console.error("[Auth cleanup] Supabase sign out failed", error);
  });
}

function mapQuickLoginError(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : "";
  if (/rate.?limit|muitas tentativas/i.test(message)) return "Muitas tentativas de login. Aguarde alguns segundos antes de tentar novamente.";
  if (/desactivad|desativad|DISABLED|WAITER_ACCOUNT_DISABLED/i.test(message)) return "Esta conta está desativada. Contacte o administrador.";
  if (/6 dígitos|6 digitos|must contain|WAITER_CODE_MUST/i.test(message)) return "O código deve conter 6 dígitos.";
  if (/timeout|timed out|AUTH_OPERATION_TIMEOUT/i.test(message)) return "A autenticação demorou demasiado. Verifique a sua ligação e tente novamente.";
  if (/network|failed to fetch|fetch failed|connection|offline/i.test(message)) return "Não foi possível contactar o servidor. Verifique a sua ligação e tente novamente.";
  return "Código de acesso incorreto.";
}

function mapCredentialsLoginError(error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : "";
  if (/invalid login credentials|invalid_credentials|email or password/i.test(message)) return "Email ou palavra-passe inválidos, ou conta desactivada.";
  if (/timeout|timed out|AUTH_OPERATION_TIMEOUT|AUTH_SIGN_IN_TIMEOUT|AUTH_PROFILE_TIMEOUT|AUTH_STATUS_TIMEOUT|AUTH_CONFIG_TIMEOUT/i.test(message)) return "A autenticação demorou demasiado. Verifique a sua ligação e tente novamente.";
  if (/network|failed to fetch|fetch failed|connection|offline/i.test(message)) return "Não foi possível contactar o servidor. Verifique a sua ligação e tente novamente.";
  if (/configuration|SUPABASE|AUTH_STORAGE_UNAVAILABLE/i.test(message)) return "A configuração de autenticação não está disponível neste ambiente. Contacte o administrador.";
  return "Não foi possível concluir a autenticação. Tente novamente.";
}

function mapLoginStatusError(status: string | undefined): string {
  switch (status) {
    case "ADMIN_INACTIVE": return "Esta conta está desactivada. Contacte um administrador.";
    case "PROFILE_MISSING": return "O seu perfil não está configurado. Contacte o administrador.";
    case "ROLE_NOT_ALLOWED": return "Esta conta não tem acesso a este painel. Contacte o administrador.";
    case "INVALID_SESSION":
    case "UNAUTHENTICATED": return "A sessão não foi validada. Tente novamente.";
    default: return "Não foi possível validar a sessão. Tente novamente.";
  }
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
  const quickLogin = trpc.staff.quickLogin.useMutation();
  const recordLogin = trpc.auth.recordLogin.useMutation();

  const submitCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) { setError("O código deve conter 6 dígitos."); return; }
    setLoading(true); setError("");
    try {
      const client = await getSupabaseClient().catch(() => null);
      if (client) await withTimeout(client.auth.signOut(), AUTH_SIGN_OUT_TIMEOUT_MS, "AUTH_SIGN_OUT_TIMEOUT").catch(() => undefined);
      await withTimeout(quickLogin.mutateAsync({ code }), AUTH_OPERATION_TIMEOUT_MS, "AUTH_OPERATION_TIMEOUT");
      await utils.auth.me.invalidate();
      navigate("/painel/garcom");
    } catch (err) { setError(mapQuickLoginError(err)); }
    finally { setLoading(false); }
  };

  const submitCredentials = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError(""); setRecoverySent(false);
    try {
      const client = await getSupabaseClient();
      clearSupabaseBrowserState();
      await withTimeout(client.auth.signOut(), AUTH_SIGN_OUT_TIMEOUT_MS, "AUTH_SIGN_OUT_TIMEOUT").catch(() => undefined);
      const { data, error: authError } = await withTimeout(
        client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }),
        AUTH_OPERATION_TIMEOUT_MS,
        "AUTH_SIGN_IN_TIMEOUT",
      );
      if (authError || !data.session) throw new Error(authError?.message ?? "AUTH_SESSION_MISSING");
      try { sessionStorage.setItem("supabase-access-token", data.session.access_token); }
      catch { throw new Error("AUTH_STORAGE_UNAVAILABLE"); }

      const statusResult = await withTimeout(loginStatusQuery.refetch(), AUTH_OPERATION_TIMEOUT_MS, "AUTH_STATUS_TIMEOUT");
      const status = statusResult.data?.status;
      if (status !== "ACTIVE") {
        clearSupabaseBrowserState(); signOutSupabaseSilently(); setError(mapLoginStatusError(status)); return;
      }
      const profileResult = await withTimeout(profileQuery.refetch(), AUTH_OPERATION_TIMEOUT_MS, "AUTH_PROFILE_TIMEOUT");
      const profile = profileResult.data;
      if (!profile) {
        clearSupabaseBrowserState(); signOutSupabaseSilently(); setError("O seu perfil não está configurado. Contacte o administrador."); return;
      }
      void recordLogin.mutateAsync().catch((auditError) => console.error("[Auth audit] Login record failed", auditError));
      void utils.auth.me.invalidate().catch((invalidateError) => console.error("[Auth cache] Session invalidation failed", invalidateError));
      navigate(profile.role === "admin" ? "/painel/admin" : "/painel/garcom");
    } catch (err) {
      console.error("[Auth login] Authentication flow failed", err);
      clearSupabaseBrowserState(); signOutSupabaseSilently(); setError(mapCredentialsLoginError(err));
    } finally { setLoading(false); }
  };

  const recoverPassword = async () => {
    setError(""); setRecoverySent(false);
    if (!email.trim()) { setError("Introduza primeiro o email da conta."); return; }
    try {
      const client = await getSupabaseClient();
      await withTimeout(
        client.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/redefinir-senha` }),
        AUTH_OPERATION_TIMEOUT_MS,
        "AUTH_RECOVERY_TIMEOUT",
      ).then(({ error: recoveryError }) => { if (recoveryError) throw recoveryError; });
      setRecoverySent(true);
    } catch (recoveryError) {
      console.error("[Auth recovery] Password recovery failed", recoveryError);
      setError(mapCredentialsLoginError(recoveryError));
    }
  };

  if (mode === "code") return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-xl">
        <div className="mb-8 flex items-center gap-3"><div className="rounded-xl bg-[#C85A3F] p-3 text-white"><KeyRound className="h-6 w-6" /></div><div><p className="eyebrow">Pátio Zambeze</p><h1 className="text-2xl font-semibold">Acesso do Garçom</h1></div></div>
        <p className="mb-6 text-sm text-muted-foreground">Digite o seu código de acesso de 6 dígitos para entrar rapidamente.</p>
        <form onSubmit={submitCode} className="space-y-4">
          <label className="block text-sm font-medium">Código de acesso<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-1 w-full rounded-md border border-border bg-background p-4 text-center text-2xl font-semibold tracking-[0.45em]" placeholder="000000" /></label>
          {error && <p className="waiter-alert" role="alert">{error}</p>}
          <Button className="w-full" disabled={loading || code.length !== 6}>{loading ? "A autenticar…" : <><LogIn className="mr-2 h-4 w-4" /> Entrar</>}</Button>
          <button type="button" onClick={() => { setMode("credentials"); setError(""); }} className="w-full text-sm font-medium text-primary underline-offset-4 hover:underline">Acesso por email e palavra-passe</button>
        </form>
      </section>
    </main>
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-xl">
        <div className="mb-8 flex items-center gap-3"><div className="rounded-xl bg-[#C85A3F] p-3 text-white"><ShieldCheck className="h-6 w-6" /></div><div><p className="eyebrow">Pátio Zambeze</p><h1 className="text-2xl font-semibold">Acesso ao painel</h1></div></div>
        <p className="mb-6 text-sm text-muted-foreground">Administradores continuam a utilizar a autenticação por email e palavra-passe.</p>
        <form onSubmit={submitCredentials} className="space-y-4">
          <label className="block text-sm font-medium">Email<input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-3" /></label>
          <label className="block text-sm font-medium">Palavra-passe<input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-3" /></label>
          {error && <p className="waiter-alert" role="alert">{error}</p>}
          {recoverySent && <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700" role="status">Se existir uma conta com este email, receberá instruções para redefinir a palavra-passe.</p>}
          <Button className="w-full" disabled={loading}>{loading ? "A autenticar…" : <><LogIn className="mr-2 h-4 w-4" /> Entrar no painel</>}</Button>
          <button type="button" onClick={recoverPassword} disabled={loading} className="w-full text-sm font-medium text-primary underline-offset-4 hover:underline">Esqueci-me da palavra-passe</button>
          <button type="button" onClick={() => { setMode("code"); setError(""); }} className="w-full text-sm font-medium text-primary underline-offset-4 hover:underline">Voltar ao acesso rápido do garçom</button>
        </form>
      </section>
    </main>
  );
}
