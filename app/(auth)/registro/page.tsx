"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Wallet } from "lucide-react";

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
      <main className="min-h-dvh flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm relative z-10 text-center">
          <div className="relative mb-6 inline-block">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mx-auto">
              <Wallet className="w-8 h-8 text-black" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Revisa tu email</h1>
          <p className="text-zinc-400">
            Te hemos enviado un enlace de confirmación a{" "}
            <span className="text-emerald-400">{email}</span>.
          </p>
          <Link
            href="/login"
            className="inline-block mt-8 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            Volver al login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl" />
            <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Wallet className="w-8 h-8 text-black" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
            Fint
          </h1>
          <p className="text-sm text-zinc-400">
            Empieza a ver tus finanzas claras.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 outline-none transition-all duration-200 focus:border-emerald-500/50 focus:bg-white/[0.07] focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block uppercase tracking-wider">
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
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-zinc-600 outline-none transition-all duration-200 focus:border-emerald-500/50 focus:bg-white/[0.07] focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-black font-bold rounded-xl py-3.5 mt-2 transition-all duration-200 disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-emerald-500/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Creando cuenta...
              </span>
            ) : (
              "Crear cuenta"
            )}
          </button>
        </form>

        <p className="text-zinc-500 text-sm mt-8 text-center">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            Entra
          </Link>
        </p>
      </div>
    </main>
  );
}
