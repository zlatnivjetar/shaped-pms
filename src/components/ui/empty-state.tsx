import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EmptyStateSize = "table" | "page" | "compact";

const SIZE_STYLES: Record<EmptyStateSize, string> = {
  table: "py-16",
  page: "py-24",
  compact: "py-10",
};

interface EmptyStateProps {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  size?: EmptyStateSize;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "table",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-md flex-col items-center justify-center gap-4 text-center",
        SIZE_STYLES[size],
        className,
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-muted/60 text-muted-foreground/70">
        <Icon className="size-8" aria-hidden />
      </div>
      <div className="space-y-2">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
