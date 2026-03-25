import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusStyle {
  variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
  label: string;
  dot: string;
}

interface StatusBadgeProps {
  status: string;
  styleMap: Record<string, StatusStyle>;
  dot?: boolean;
  showLabel?: boolean;
  className?: string;
}

const DOT_COLORS: Record<string, string> = {
  success:     "bg-success",
  warning:     "bg-warning",
  info:        "bg-info",
  destructive: "bg-destructive",
  muted:       "bg-muted-foreground",
};

export function StatusBadge({
  status,
  styleMap,
  dot = false,
  showLabel = true,
  className,
}: StatusBadgeProps) {
  const style = styleMap[status];
  if (!style) {
    return <Badge variant="outline" className={className}>{status}</Badge>;
  }

  return (
    <Badge variant={style.variant} className={cn("whitespace-nowrap gap-1.5", className)}>
      {dot && (
        <span
          className={cn("inline-block h-1.5 w-1.5 rounded-full shrink-0", DOT_COLORS[style.dot] ?? "bg-muted-foreground")}
          aria-hidden
        />
      )}
      {showLabel && style.label}
    </Badge>
  );
}
