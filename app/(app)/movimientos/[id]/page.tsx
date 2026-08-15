import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EditTransactionForm } from "@/components/transactions/EditTransactionForm";

export default async function EditPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: transaction } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!transaction) redirect("/movimientos");

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name, type, provider")
    .eq("user_id", user.id)
    .eq("is_archived", false);

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id);

  return (
    <EditTransactionForm
      transaction={transaction}
      accounts={accounts ?? []}
      categories={categories ?? []}
    />
  );
}
