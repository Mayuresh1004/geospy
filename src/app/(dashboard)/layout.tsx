// app/(dashboard)/layout.tsx
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
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
    <SidebarProvider>
      <div className="flex h-screen bg-muted/20">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content */}
        <main
          className="flex-1 min-w-0 overflow-y-auto"
          style={{ width: "calc(100vw - var(--sidebar-width))" }}
        >
          <div className="w-full max-w-none px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}