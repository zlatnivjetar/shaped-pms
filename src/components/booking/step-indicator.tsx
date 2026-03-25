import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEP_LABELS: Record<string, string> = {
  search: "Dates",
  select: "Room",
  details: "Details",
  confirm: "Confirm",
};

const STEP_ORDER = ["search", "select", "details", "confirm"] as const;

interface StepIndicatorProps {
  current: string;
}

export function StepIndicator({ current }: StepIndicatorProps) {
  const currentIndex = STEP_ORDER.indexOf(current as (typeof STEP_ORDER)[number]);

  if (currentIndex === -1) {
    return null;
  }

  return (
    <nav aria-label="Booking progress" className="mb-8">
      <ol className="flex items-start justify-center gap-2 sm:gap-3">
        {STEP_ORDER.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <li
              key={step}
              aria-current={isCurrent ? "step" : undefined}
              className="flex min-w-0 flex-1 items-start gap-2"
            >
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-[var(--duration-fast)] ease-[var(--ease-default)] motion-reduce:transition-none",
                      isComplete &&
                        "border-booking-cta bg-booking-cta text-booking-cta-foreground",
                      isCurrent &&
                        "border-booking-accent bg-booking-accent text-booking-accent-foreground",
                      !isComplete &&
                        !isCurrent &&
                        "border-border bg-booking-card text-booking-muted",
                    )}
                  >
                    {isComplete ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      "hidden text-xs sm:block",
                      isCurrent && "font-semibold text-booking-accent",
                      isComplete && "text-booking-cta",
                      !isComplete && !isCurrent && "text-booking-muted",
                    )}
                  >
                    {STEP_LABELS[step]}
                  </span>
                </div>

                {index < STEP_ORDER.length - 1 && (
                  <span
                    aria-hidden
                    className={cn(
                      "mt-4 hidden h-px flex-1 rounded-full sm:block",
                      isComplete ? "bg-booking-cta" : "bg-border",
                    )}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
