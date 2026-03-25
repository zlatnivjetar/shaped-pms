"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/ui/error-boundary";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Dashboard unavailable"
      description="We could not load this dashboard view. Try again or return in a moment."
      onReset={reset}
    />
  );
}
