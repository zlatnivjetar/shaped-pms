import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const userRole = (session.user.role as "owner" | "manager" | "front_desk") ?? "owner";

  return (
    <SidebarProvider>
      <AppSidebar
        userName={session.user.name}
        userEmail={session.user.email}
        userRole={userRole as "owner" | "manager" | "front_desk"}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </SidebarProvider>
  );
}
