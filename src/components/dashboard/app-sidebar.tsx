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
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none">
              Shaped PMS
            </span>
            <span className="text-xs text-muted-foreground">
              Property Manager
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNav.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url}>
                      <item.icon />
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
              <SidebarGroupContent>
                <SidebarMenu>
                  {secondaryNav.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <Link href={item.url}>
                          <item.icon />
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
              >
                <Link href="/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <div className="px-2 py-1">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {userEmail}
              </p>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
