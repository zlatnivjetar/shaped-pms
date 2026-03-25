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
      title="Review page unavailable"
      description="We could not load this review form. Try again and submit your feedback once the page recovers."
      onReset={reset}
    />
  );
}
