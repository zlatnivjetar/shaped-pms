"use client"

import * as React from "react"
import {
  LaptopMinimal,
  MoonStar,
  SunMedium,
  Monitor,
} from "lucide-react"
import { useTheme } from "next-themes"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const themeOptions = [
  { value: "light", label: "Light", icon: SunMedium },
  { value: "dark", label: "Dark", icon: MoonStar },
  { value: "system", label: "System", icon: LaptopMinimal },
] as const

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const activeTheme = mounted ? theme ?? "system" : "system"
  const CurrentIcon =
    mounted && resolvedTheme === "dark" ? MoonStar : mounted ? SunMedium : Monitor

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-9 shrink-0", !mounted && "opacity-0")}
          aria-label="Change theme"
          disabled={!mounted}
        >
          <CurrentIcon className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={activeTheme} onValueChange={setTheme}>
          {themeOptions.map((option) => {
            const Icon = option.icon

            return (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <Icon className="size-4" aria-hidden />
                <span>{option.label}</span>
              </DropdownMenuRadioItem>
            )
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
