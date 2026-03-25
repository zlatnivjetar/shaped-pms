"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: ReactNode;
  htmlFor?: string;
  description?: ReactNode;
  error?: string | string[] | null;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  description,
  error,
  children,
  className,
}: FormFieldProps) {
  const errorMessage = Array.isArray(error) ? error[0] : error;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
