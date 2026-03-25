import { cn } from "@/lib/utils";

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  muted?: boolean;
  className?: string;
}

export function DetailRow({ label, value, muted = false, className }: DetailRowProps) {
  return (
    <div className={cn("flex justify-between items-baseline gap-4 py-1.5", className)}>
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-sm text-right", muted ? "text-muted-foreground" : "font-medium")}>
        {value}
      </span>
    </div>
  );
}
