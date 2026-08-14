"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Email o contraseña incorrectos.");
      return;
    }

    router.push("/resumen");
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex flex-col justify-center px-6 py-12 max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Bienvenido</h1>
      <p className="text-muted mb-8">Entra para ver tus finanzas.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm text-muted mb-1 block">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base outline-none focus:border-positive"
          />
        </div>
        <div>
          <label className="text-sm text-muted mb-1 block">Contraseña</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-base outline-none focus:border-positive"
          />
        </div>

        {error && <p className="text-negative text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-positive text-base font-medium rounded-xl py-3 mt-2 disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="text-muted text-sm mt-6 text-center">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="text-positive">
          Regístrate
        </Link>
      </p>
    </main>
  );
}
