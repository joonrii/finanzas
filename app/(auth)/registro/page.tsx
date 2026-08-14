"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
      <main className="min-h-dvh flex flex-col justify-center px-6 py-12 max-w-sm mx-auto text-center">
        <h1 className="text-2xl font-semibold mb-2">Revisa tu email</h1>
        <p className="text-muted">
          Te hemos enviado un enlace de confirmación a {email}.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex flex-col justify-center px-6 py-12 max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Crea tu cuenta</h1>
      <p className="text-muted mb-8">Empieza a ver tus finanzas claras.</p>

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
            minLength={6}
            autoComplete="new-password"
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
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="text-muted text-sm mt-6 text-center">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-positive">
          Entra
        </Link>
      </p>
    </main>
  );
}
