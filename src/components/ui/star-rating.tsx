"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE_STYLES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-7 w-7",
} as const;

type StarRatingSize = keyof typeof SIZE_STYLES;

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  max?: number;
  size?: StarRatingSize;
  className?: string;
  "aria-label"?: string;
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  max = 5,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: StarRatingProps) {
  const [hoveredValue, setHoveredValue] = useState(0);
  const interactive = !readOnly && typeof onChange === "function";
  const activeValue = interactive && hoveredValue > 0 ? hoveredValue : value;

  function setValue(nextValue: number) {
    if (!interactive || !onChange) {
      return;
    }

    onChange(nextValue);
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    starValue: number,
  ) {
    if (!interactive) {
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setValue(Math.min(max, starValue + 1));
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setValue(Math.max(1, starValue - 1));
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setValue(1);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setValue(max);
    }
  }

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={ariaLabel ?? `Rated ${value} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= activeValue;

        if (!interactive) {
          return (
            <Star
              key={starValue}
              aria-hidden
              className={cn(
                SIZE_STYLES[size],
                filled ? "fill-rating-star text-rating-star" : "text-border",
              )}
            />
          );
        }

        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`Rate ${starValue} out of ${max} stars`}
            onClick={() => setValue(starValue)}
            onMouseEnter={() => setHoveredValue(starValue)}
            onMouseLeave={() => setHoveredValue(0)}
            onKeyDown={(event) => handleKeyDown(event, starValue)}
            className="rounded-sm p-1 text-muted-foreground transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-booking-accent/30"
          >
            <Star
              className={cn(
                SIZE_STYLES[size],
                filled ? "fill-rating-star text-rating-star" : "text-border",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
