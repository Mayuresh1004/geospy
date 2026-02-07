// app/(dashboard)/layout.tsx
import Sidebar from "@/components/dashboard/app-sidebar";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-muted/20">
      {/* Sidebar */}
      <Sidebar user={user} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}