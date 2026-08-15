import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/nav/BottomNav";
import { Toaster } from "@/components/ui/Toaster";

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

  return (
    <div className="min-h-dvh pb-24">
      <Toaster />
      <div className="max-w-md mx-auto px-4 pt-6">{children}</div>
      <BottomNav />
    </div>
  );
}
