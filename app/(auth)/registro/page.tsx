"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Wallet, ArrowRight, MailCheck } from "lucide-react";

export default function RegistroPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <main className="min-h-dvh flex items-center justify-center relative overflow-hidden bg-[#050505] px-6 py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-black to-teal-950/20" />
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] animate-float" />
        <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-teal-500/15 rounded-full blur-[100px] animate-float-reverse" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

        <div className="relative z-10 w-full max-w-[420px] opacity-0 animate-fade-in-up text-center">
          <div className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.06] rounded-3xl p-10 shadow-2xl shadow-black/50">
            <div className="relative mb-6 inline-block">
              <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-2xl" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.35)] mx-auto">
                <MailCheck className="w-10 h-10 text-black" strokeWidth={2} />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Revisa tu email</h1>
            <p className="text-zinc-400 mb-8">
              Te hemos enviado un enlace de confirmación a{" "}
              <span className="text-emerald-400 font-medium">{email}</span>
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              Volver al login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center relative overflow-hidden bg-[#050505] px-6 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-black to-teal-950/20" />
      <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] animate-float" />
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-teal-500/15 rounded-full blur-[100px] animate-float-reverse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-lime-500/10 rounded-full blur-[90px] animate-float" style={{ animationDelay: '5s' }} />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="relative z-10 w-full max-w-[420px] opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.06] rounded-3xl p-8 shadow-2xl shadow-black/50">
          
          <div className="flex flex-col items-center mb-10">
            <div className="relative mb-5 opacity-0 animate-fade-in-up delay-200">
              <div className="absolute inset-0 bg-emerald-500/30 rounded-2xl blur-2xl" />
              <div className="relative w-[72px] h-[72px] bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.35)]">
                <Wallet className="w-9 h-9 text-black" strokeWidth={2} />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2 opacity-0 animate-fade-in-up delay-300">
              Fint
            </h1>
            <p className="text-sm text-zinc-500 opacity-0 animate-fade-in-up delay-300">
              Empieza a ver tus finanzas claras.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="opacity-0 animate-fade-in-up delay-300">
              <label className="text-[11px] font-semibold text-zinc-500 mb-2 block uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 outline-none transition-all duration-300 focus:border-emerald-500/40 focus:ring-[3px] focus:ring-emerald-500/10 focus:bg-black/40"
              />
            </div>

            <div className="opacity-0 animate-fade-in-up delay-400">
              <label className="text-[11px] font-semibold text-zinc-500 mb-2 block uppercase tracking-widest">
                Contraseña
              </label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 outline-none transition-all duration-300 focus:border-emerald-500/40 focus:ring-[3px] focus:ring-emerald-500/10 focus:bg-black/40"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 opacity-0 animate-fade-in-up delay-400">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="opacity-0 animate-fade-in-up delay-400 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-xl py-4 font-bold text-black transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.35)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-[length:200%_auto] transition-all duration-500 group-hover:bg-[length:300%_auto]" />
                <span className="relative flex items-center justify-center gap-2 text-base">
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      Crear cuenta
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>

          <p className="text-zinc-600 text-sm mt-8 text-center opacity-0 animate-fade-in-up delay-400">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              Entra
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
