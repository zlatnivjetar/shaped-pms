"use client"

import { usePathname } from "next/navigation"

import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

const ROOT_LABEL = "Dashboard"

const SECTION_LABELS: Record<string, string> = {
  dashboard: "Overview",
  calendar: "Calendar",
  reservations: "Reservations",
  guests: "Guests",
  rates: "Rates",
  reviews: "Reviews",
  settings: "Settings",
}

function titleCase(value: string) {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length === 0) {
    return [{ label: ROOT_LABEL }]
  }

  const [section, ...rest] = segments
  const items: BreadcrumbItem[] = [{ label: ROOT_LABEL, href: "/dashboard" }]

  if (section !== "dashboard") {
    items.push({
      label: SECTION_LABELS[section] ?? titleCase(section),
      href: `/${section}`,
    })
  }

  if (rest.length === 0) {
    if (section === "dashboard") {
      items[0] = { label: ROOT_LABEL }
    }
    return items
  }

  const detailLabel =
    section === "reservations"
      ? "Reservation Details"
      : section === "reviews"
        ? "Review Details"
        : titleCase(rest[rest.length - 1])

  items.push({ label: detailLabel })
  return items
}

export function DashboardHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <SidebarTrigger className="shrink-0" />
        <Separator orientation="vertical" className="hidden h-4 md:block" />
        <div className="min-w-0">
          <Breadcrumb items={getBreadcrumbItems(pathname)} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  )
}
