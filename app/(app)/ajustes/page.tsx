"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function AjustesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthlyReport, setMonthlyReport] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    async function loadPreferences() {
      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("monthly_report_email")
          .eq("user_id", user!.id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            await supabase.from("user_preferences").insert({
              user_id: user!.id, monthly_report_email: true,
            });
            setMonthlyReport(true);
          } else {
            setError("Error cargando preferencias");
          }
        } else if (data) {
          setMonthlyReport(data.monthly_report_email ?? true);
        }
      } catch {
        setError("Error inesperado");
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true); setMessage(""); setError("");
    try {
      const { error } = await supabase.from("user_preferences").upsert(
        { user_id: user.id, monthly_report_email: monthlyReport, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
      if (error) setError("Error guardando preferencias");
      else { setMessage("Preferencias guardadas correctamente"); setTimeout(() => setMessage(""), 3000); }
    } catch {
      setError("Error inesperado");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestEmail() {
    if (!user) return;
    setSaving(true); setMessage(""); setError("");
    try {
      const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).single();
      if (!profile?.email) { setError("No se encontró tu email"); setSaving(false); return; }

      const response = await fetch("/api/test-monthly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-test-secret": "test-secret-fint-123" },
        body: JSON.stringify({ userId: user.id, email: profile.email }),
      });

      if (response.ok) setMessage("¡Email de prueba enviado! Revisa tu bandeja de entrada.");
      else { const data = await response.json(); setError(data.error || "Error enviando email de prueba"); }
    } catch {
      setError("Error enviando email de prueba");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-6">Ajustes</h1>

        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/10">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Notificaciones por email
          </h2>

          <div className="flex items-center justify-between py-4 border-b border-white/5">
            <div>
              <p className="font-medium">Resumen mensual</p>
              <p className="text-sm text-gray-400 mt-1">
                Recibe un email el día 1 de cada mes con un resumen de tus finanzas del mes anterior.
              </p>
            </div>
            <button
              onClick={() => setMonthlyReport(!monthlyReport)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${monthlyReport ? "bg-emerald-500" : "bg-gray-600"}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${monthlyReport ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              onClick={handleTestEmail}
              disabled={saving}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              Enviar email de prueba
            </button>
          </div>

          {message && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">{message}</div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
          )}
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-medium mb-4">Sobre el resumen mensual</h2>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">&#10003;</span> Se envía el día 1 de cada mes a las 8:00 AM</li>
            <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">&#10003;</span> Incluye balance, top categorías, comparaciones e insights</li>
            <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">&#10003;</span> Si no tuviste movimientos, recibirás un email corto de recordatorio</li>
            <li className="flex items-start gap-3"><span className="text-emerald-400 mt-0.5">&#10003;</span> Puedes desactivarlo en cualquier momento desde aquí</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
