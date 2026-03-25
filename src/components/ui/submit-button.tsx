"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "type" | "children"
> & {
  children: ReactNode;
  pendingLabel?: ReactNode;
  isPending?: boolean;
};

export function SubmitButton({
  children,
  pendingLabel = "Saving...",
  isPending = false,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending: formPending } = useFormStatus();
  const pending = formPending || isPending;

  return (
    <Button type="submit" disabled={disabled || pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
