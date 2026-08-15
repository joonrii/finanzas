"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function generateRecurringForUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { count: 0 };

  const { data, error } = await supabase.rpc("generate_recurring_transactions", {
    p_user_id: user.id,
  });

  if (error) {
    console.error("Error generando recurrentes:", error);
    return { count: 0, error: error.message };
  }

  const count = data ?? 0;
  if (count > 0) {
    revalidatePath("/resumen");
    revalidatePath("/movimientos");
  }

  return { count };
}
