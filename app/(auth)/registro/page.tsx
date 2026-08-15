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
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              Volver al login
              <Arrow
