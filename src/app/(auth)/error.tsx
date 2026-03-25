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
      title="Authentication unavailable"
      description="This sign-in flow could not be loaded right now. Try again in a moment."
      onReset={reset}
    />
  );
}
