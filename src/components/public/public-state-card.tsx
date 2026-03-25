import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "destructive" | "info";

const TONE_STYLES: Record<Tone, { icon: string; eyebrow: string }> = {
  default: {
    icon: "bg-muted text-foreground",
    eyebrow: "text-muted-foreground",
  },
  success: {
    icon: "bg-success/10 text-success",
    eyebrow: "text-success",
  },
  warning: {
    icon: "bg-warning/10 text-warning",
    eyebrow: "text-warning",
  },
  destructive: {
    icon: "bg-destructive/10 text-destructive",
    eyebrow: "text-destructive",
  },
  info: {
    icon: "bg-info/10 text-info",
    eyebrow: "text-info",
  },
};

interface PublicStateCardProps {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  eyebrow?: string;
  tone?: Tone;
  className?: string;
  actionHref?: string;
  actionLabel?: string;
  secondaryActionHref?: string;
  secondaryActionLabel?: string;
}

export function PublicStateCard({
  icon: Icon,
  title,
  description,
  eyebrow,
  tone = "default",
  className,
  actionHref,
  actionLabel,
  secondaryActionHref,
  secondaryActionLabel,
}: PublicStateCardProps) {
  const styles = TONE_STYLES[tone];

  return (
    <Card className={cn("mx-auto w-full max-w-lg bg-card py-0 text-center", className)}>
      <CardContent className="flex flex-col items-center gap-5 px-8 py-10 sm:px-10">
        <div className={cn("flex h-14 w-14 items-center justify-center rounded-full", styles.icon)}>
          <Icon className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          {eyebrow && (
            <p className={cn("text-xs font-semibold uppercase tracking-[0.24em]", styles.eyebrow)}>
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <div className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
            {description}
          </div>
        </div>
        {(actionHref || secondaryActionHref) && (
          <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
            {actionHref && actionLabel && (
              <Button asChild className="min-w-40">
                <Link href={actionHref}>{actionLabel}</Link>
              </Button>
            )}
            {secondaryActionHref && secondaryActionLabel && (
              <Button asChild variant="outline" className="min-w-40">
                <Link href={secondaryActionHref}>{secondaryActionLabel}</Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
