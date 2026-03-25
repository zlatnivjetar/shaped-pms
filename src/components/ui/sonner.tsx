"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import * as React from "react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 640px)")
    const update = () => setIsMobile(mediaQuery.matches)

    update()
    mediaQuery.addEventListener("change", update)

    return () => mediaQuery.removeEventListener("change", update)
  }, [])

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={isMobile ? "bottom-center" : "bottom-right"}
      duration={4000}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border bg-popover text-popover-foreground shadow-lg",
          title: "text-sm font-semibold",
          description: "text-sm text-muted-foreground",
          success: "border-success/20 bg-success/10 text-success",
          error: "border-destructive/20 bg-destructive/10 text-destructive",
          info: "border-info/20 bg-info/10 text-info",
          warning: "border-warning/20 bg-warning/10 text-warning",
          loading: "border-border bg-popover text-popover-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
