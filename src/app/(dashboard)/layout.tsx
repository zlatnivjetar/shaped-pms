import { QueryProvider } from "@/components/providers/query-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { getDashboardContext } from "@/lib/dashboard-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getDashboardContext();

  return (
    <QueryProvider>
      <SidebarProvider>
        <AppSidebar
          userName={context.session.user.name}
          userEmail={context.session.user.email}
          userRole={context.userRole}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
        </div>
      </SidebarProvider>
    </QueryProvider>
  );
}
