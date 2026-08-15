import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RecurringForm from "@/components/recurring/RecurringForm";

export default async function NuevaRecurrentePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: accounts }, { data: categories }] = await Promise.all([
    supabase.from("accounts").select("id, name").eq("user_id", user.id).eq("is_archived", false),
    supabase.from("categories").select("id, name, icon, kind").eq("user_id", user.id).eq("is_archived", false),
  ]);

  return (
    <main className="max-w-lg mx-auto px-5 pt-6 pb-28 safe-bottom">
      <h1 className="text-2xl font-bold text-white mb-6">Nueva recurrente</h1>
      <RecurringForm accounts={accounts ?? []} categories={categories ?? []} />
    </main>
  );
}
