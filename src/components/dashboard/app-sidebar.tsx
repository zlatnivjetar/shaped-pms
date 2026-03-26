"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  LayoutDashboard,
  Star,
  Users,
  Settings,
  TrendingUp,
  BookOpen,
  LogOut,
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import {
  currentMonthStr,
  normalizeGuestsParams,
  normalizeReservationsParams,
  normalizeReviewsParams,
} from "@/lib/dashboard-contracts";
import {
  fetchDashboardCalendar,
  fetchDashboardGuests,
  fetchDashboardReservations,
  fetchDashboardReviews,
  fetchDashboardSummary,
} from "@/lib/client-fetchers";
import { dashboardQueryKeys } from "@/lib/query-keys";
import {
  CALENDAR_QUERY_STALE_TIME,
  DASHBOARD_QUERY_STALE_TIME,
} from "@/lib/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

type Role = "owner" | "manager" | "front_desk";

interface AppSidebarProps {
  userName: string;
  userEmail: string;
  userRole: Role;
}

const allPrimaryNav = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ["owner", "manager", "front_desk"] as Role[],
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: CalendarDays,
    roles: ["owner", "manager"] as Role[],
  },
  {
    title: "Reservations",
    url: "/reservations",
    icon: BookOpen,
    roles: ["owner", "manager", "front_desk"] as Role[],
  },
  {
    title: "Guests",
    url: "/guests",
    icon: Users,
    roles: ["owner", "manager", "front_desk"] as Role[],
  },
];

const allSecondaryNav = [
  {
    title: "Rates",
    url: "/rates",
    icon: TrendingUp,
    roles: ["owner", "manager"] as Role[],
  },
  {
    title: "Reviews",
    url: "/reviews",
    icon: Star,
    roles: ["owner", "manager"] as Role[],
  },
];

const settingsNav = {
  title: "Settings",
  url: "/settings",
  icon: Settings,
  roles: ["owner", "manager"] as Role[],
};

function canPrewarm() {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;

  return !(
    connection?.saveData ||
    connection?.effectiveType === "2g" ||
    connection?.effectiveType === "slow-2g"
  );
}

export function AppSidebar({ userName, userEmail, userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  function isActive(url: string) {
    if (url === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(url);
  }

  const primaryNav = allPrimaryNav.filter((item) =>
    item.roles.includes(userRole),
  );
  const secondaryNav = allSecondaryNav.filter((item) =>
    item.roles.includes(userRole),
  );
  const showSettings = settingsNav.roles.includes(userRole);

  function prewarm(url: string) {
    router.prefetch(url);

    if (!canPrewarm()) {
      return;
    }

    if (url === "/dashboard") {
      void queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.summary,
        queryFn: ({ signal }) => fetchDashboardSummary(signal),
        staleTime: DASHBOARD_QUERY_STALE_TIME,
      });
      return;
    }

    if (url === "/reservations") {
      const params = normalizeReservationsParams({});
      void queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.reservations(params),
        queryFn: ({ signal }) => fetchDashboardReservations(params, signal),
        staleTime: DASHBOARD_QUERY_STALE_TIME,
      });
      return;
    }

    if (url === "/guests") {
      const params = normalizeGuestsParams({});
      void queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.guests(params),
        queryFn: ({ signal }) => fetchDashboardGuests(params, signal),
        staleTime: DASHBOARD_QUERY_STALE_TIME,
      });
      return;
    }

    if (url === "/reviews") {
      const params = normalizeReviewsParams({});
      void queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.reviews(params),
        queryFn: ({ signal }) => fetchDashboardReviews(params, signal),
        staleTime: DASHBOARD_QUERY_STALE_TIME,
      });
      return;
    }

    if (url === "/calendar") {
      const month = currentMonthStr();
      void queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.calendar({ month }),
        queryFn: ({ signal }) => fetchDashboardCalendar(month, signal),
        staleTime: CALENDAR_QUERY_STALE_TIME,
      });
    }
  }

  useEffect(() => {
    if (!canPrewarm()) {
      return;
    }

    const prewarmRoutes = () => {
      for (const item of primaryNav) {
        prewarm(item.url);
      }

      for (const item of secondaryNav) {
        router.prefetch(item.url);
      }

      if (showSettings) {
        router.prefetch(settingsNav.url);
      }
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(prewarmRoutes);
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(prewarmRoutes, 500);
    return () => clearTimeout(timeoutId);
  }, [primaryNav, queryClient, router, secondaryNav, showSettings]);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-3 py-4">
        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <Building2 className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold leading-none">
              Shaped PMS
            </span>
            <span className="mt-1 block text-xs text-sidebar-foreground/70">
              Property Manager
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link
                      href={item.url}
                      onMouseEnter={() => prewarm(item.url)}
                      onFocus={() => prewarm(item.url)}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {secondaryNav.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Operations</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {secondaryNav.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        tooltip={item.title}
                      >
                        <Link
                          href={item.url}
                          onMouseEnter={() => prewarm(item.url)}
                          onFocus={() => prewarm(item.url)}
                        >
                          <item.icon className="size-4 shrink-0" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          {showSettings && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/settings")}
                tooltip="Settings"
              >
                <Link
                  href="/settings"
                  onMouseEnter={() => prewarm("/settings")}
                  onFocus={() => prewarm("/settings")}
                >
                  <Settings className="size-4 shrink-0" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <div className="rounded-lg border border-sidebar-border/70 bg-sidebar-accent/30 px-3 py-2">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-sidebar-foreground/70">
                {userEmail}
              </p>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip="Sign out"
              className="text-sidebar-foreground/80"
            >
              <LogOut className="size-4 shrink-0" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
