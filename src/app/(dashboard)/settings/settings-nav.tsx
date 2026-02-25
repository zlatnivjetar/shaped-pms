"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Property", href: "/settings/property" },
  { label: "Room Types", href: "/settings/room-types" },
  { label: "Rooms", href: "/settings/rooms" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="border-b flex gap-0">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              isActive
                ? "border-b-2 border-primary px-4 py-2 text-sm font-medium text-foreground"
                : "border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
