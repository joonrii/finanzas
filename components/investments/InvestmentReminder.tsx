"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function InvestmentReminder() {
  const [show, setShow] = useState(false);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    checkInvestments();
  }, []);

  async function checkInvestments() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Verificar si ya se descartó hoy
    const dismissed = localStorage.getItem("investment_reminder_dismissed");
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      // Si se descartó hace menos de 3 días, no molestar
      if (now.getTime() - dismissedDate.getTime() < 3 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Buscar cuentas de inversión
    const { data: accounts } = await supabase
      .from("accounts")
      .select("id, name")
      .eq("user_id", user.id)
      .eq("type", "investment")
      .eq("is_archived", false);

    if (!accounts || accounts.length === 0) return;

    // Para cada cuenta, verificar último snapshot
    for (const account of accounts) {
      const { data: snapshots } = await supabase
        .from("investment_snapshots")
        .select("snapshot_date")
        .eq("account_id", account.id)
        .order("snapshot_date", { ascending: false })
        .limit(1);

      const lastDate = snapshots?.[0]?.snapshot_date;
      const today = new Date().toISOString().slice(0, 10);

      if (!lastDate) {
        // Nunca se ha actualizado
        setAccountName(account.name);
        setAccountId(account.id);
        setShow(true);
        return;
      }

      const daysDiff = Math.floor(
        (new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff >= 10) {
        setAccountName(account.name);
        setAccountId(account.id);
        setShow(true);
        return;
      }
    }
  }

  function dismiss() {
    localStorage.setItem("investment_reminder_dismissed", new Date().toISOString());
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="mx-5 mb-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 animate-fade-in-up">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <TrendingUp className="text-amber-400" size={20} />
          </div>
          <div>
            <p className="text-white text-sm font-medium">
              ¿Has actualizado {accountName ?? "tu cartera"}?
            </p>
            <p className="text-muted text-xs mt-0.5">
              Hace 10+ días que no registras el valor actual.
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-muted hover:text-white transition p-1"
        >
          <X size={16} />
        </button>
      </div>
      {accountId && (
        <Link
          href={`/cuentas/${accountId}`}
          onClick={dismiss}
          className="mt-3 flex items-center justify-center gap-1.5 w-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-medium rounded-xl py-2.5 hover:bg-amber-500/25 transition"
        >
          Actualizar valor
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
