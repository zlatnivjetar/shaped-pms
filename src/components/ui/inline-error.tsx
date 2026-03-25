import { AlertCircle } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface InlineErrorProps extends ComponentProps<"div"> {
  heading?: ReactNode;
  children: ReactNode;
}

export function InlineError({
  heading,
  children,
  className,
  ...props
}: InlineErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive",
        className,
      )}
      {...props}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="space-y-1">
        {heading && <p className="font-medium leading-none">{heading}</p>}
        <div className="text-sm leading-5">{children}</div>
      </div>
    </div>
  );
}
