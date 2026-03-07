import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Sidebar } from "./sidebar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isAdmin = user.id === process.env.ADMIN_USER_ID;

  return (
    <div className="flex min-h-screen">
      <Sidebar email={user.email ?? ""} isAdmin={isAdmin} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
