import { cn } from "@/lib/utils"

function Skeleton({
  className,
  style,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-accent animate-pulse rounded-md motion-reduce:animate-none",
        className,
      )}
      style={{ animationDuration: "var(--duration-slow)", ...style }}
      {...props}
    />
  )
}

export { Skeleton }
