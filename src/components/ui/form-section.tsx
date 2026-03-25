"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type FormSectionProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function FormSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: FormSectionProps) {
  return (
    <Card className={cn("gap-0", className)}>
      <CardHeader className="border-b pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-4 pt-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
