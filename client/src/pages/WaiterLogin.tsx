import { Button } from "@/components/ui/button";
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
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError("");
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.session) { setError("Email ou palavra-passe inválidos, ou conta desactivada."); setLoading(false); return; }
    sessionStorage.setItem("supabase-access-token", data.session.access_token);
    navigate("/painel/garcom");
  };
  return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground"><section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-xl"><div className="mb-8 flex items-center gap-3"><div className="rounded-xl bg-[#C85A3F] p-3 text-white"><ShieldCheck className="h-6 w-6" /></div><div><p className="eyebrow">Pátio Zambeze</p><h1 className="text-2xl font-semibold">Acesso do garçom</h1></div></div><p className="mb-6 text-sm text-muted-foreground">Entre com as credenciais fornecidas pela administração. O menu público não requer login.</p><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-medium">Email<input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-3" /></label><label className="block text-sm font-medium">Palavra-passe<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background p-3" /></label>{error && <p className="waiter-alert" role="alert">{error}</p>}<Button className="w-full" disabled={loading}>{loading ? "A autenticar…" : <><LogIn className="mr-2 h-4 w-4" /> Entrar no painel</>}</Button></form></section></main>;
}
