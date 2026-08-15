import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/nav/BottomNav";
import { Toaster } from "@/components/ui/Toaster";
import { generateRecurringForUser } from "@/app/actions/recurring";
import InvestmentReminder from "@/components/investments/InvestmentReminder";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Generar transacciones recurrentes automáticamente al entrar
  await generateRecurringForUser();

  return (
    <div className="min-h-screen pb-20">
      <InvestmentReminder />
      {children}
      <BottomNav />
      <Toaster />
    </div>
  );
}
