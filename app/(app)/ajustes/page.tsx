import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";

export default async function AjustesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Obtener preferencias del usuario
  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("monthly_report_email")
    .eq("user_id", user.id)
    .single();

  // Si no existe, crear con defaults
  if (!preferences) {
    await supabase.from("user_preferences").insert({
      user_id: user.id,
      monthly_report_email: true,
    });
  }

  const monthlyReport = preferences?.monthly_report_email ?? true;

  // Obtener email del perfil
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-6">Ajustes</h1>

        <SettingsForm
          userId={user.id}
          email={profile?.email ?? ""}
          initialMonthlyReport={monthlyReport}
        />
      </div>
    </div>
  );
}
