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
};

export function SubmitButton({
  children,
  pendingLabel = "Saving...",
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
