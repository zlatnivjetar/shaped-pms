"use client";

import type { ReactNode } from "react";
import { InlineError } from "@/components/ui/inline-error";
import { cn } from "@/lib/utils";

type FormMessageProps = {
  variant: "success" | "error";
  children: ReactNode;
  className?: string;
};

const variantStyles = {
  success: "border-success/20 bg-success/10 text-success",
  error: "border-destructive/20 bg-destructive/10 text-destructive",
} as const;

export function FormMessage({
  variant,
  children,
  className,
}: FormMessageProps) {
  if (variant === "error") {
    return <InlineError className={className}>{children}</InlineError>;
  }

  return (
    <div
      className={cn(
        "rounded-md border p-3 text-sm",
        variantStyles.success,
        className
      )}
    >
      {children}
    </div>
  );
}
