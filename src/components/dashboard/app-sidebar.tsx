"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

export function AppSidebar({ userName, userEmail, userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(url: string) {
    if (url === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(url);
  }

  const primaryNav = allPrimaryNav.filter((item) =>
    item.roles.includes(userRole)
  );
  const secondaryNav = allSecondaryNav.filter((item) =>
    item.roles.includes(userRole)
  );
  const showSettings = settingsNav.roles.includes(userRole);

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
                    <Link href={item.url}>
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
                        <Link href={item.url}>
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
                <Link href="/settings">
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
