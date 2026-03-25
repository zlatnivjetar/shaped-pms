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
      title="Booking temporarily unavailable"
      description="We hit a problem while loading this booking step. Try again to continue your reservation."
      onReset={reset}
    />
  );
}
