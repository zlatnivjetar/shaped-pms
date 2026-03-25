import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
}

interface FilterBarFieldProps {
  label: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
  className?: string;
  htmlFor?: string;
}

interface FilterBarButtonProps extends ComponentProps<typeof Button> {
  children: ReactNode;
}

interface FilterBarResetLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function FilterBar({
  title,
  description,
  children,
  actions,
  className,
  bodyClassName,
}: FilterBarProps) {
  return (
    <section
      data-slot="filter-bar"
      className={cn(
        "rounded-xl border bg-card shadow-sm",
        className,
      )}
    >
      {(title || description || actions) && (
        <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div className="space-y-1">
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("flex flex-wrap items-end gap-3 px-4 py-4 sm:px-5", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

export function FilterBarField({
  label,
  children,
  hint,
  className,
  htmlFor,
}: FilterBarFieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label
        className="text-sm font-medium text-foreground"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      <div className="min-w-0">{children}</div>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function FilterBarInput({
  className,
  ...props
}: ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="filter-bar-input"
      className={cn("h-9 w-full sm:w-56", className)}
      {...props}
    />
  );
}

export function FilterBarSelectTrigger({
  className,
  ...props
}: ComponentProps<typeof SelectTrigger>) {
  return (
    <SelectTrigger
      data-slot="filter-bar-select-trigger"
      size="sm"
      className={cn("h-9 w-full min-w-[12rem] sm:w-56", className)}
      {...props}
    />
  );
}

export function FilterBarTrigger({
  children,
  className,
  ...props
}: FilterBarButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "h-9 w-full min-w-[12rem] justify-between gap-2 font-normal sm:w-auto",
        className,
      )}
      {...props}
    >
      <span className="min-w-0 truncate text-left">{children}</span>
      <ChevronDown className="size-4 shrink-0 opacity-60" />
    </Button>
  );
}

export function FilterBarActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

export function FilterBarResetLink({
  href,
  children,
  className,
}: FilterBarResetLinkProps) {
  return (
    <Button asChild variant="ghost" size="sm" className={className}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}
