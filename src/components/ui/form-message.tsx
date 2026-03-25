"use client";

import type { ReactNode } from "react";
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
  return (
    <div
      className={cn(
        "rounded-md border p-3 text-sm",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
