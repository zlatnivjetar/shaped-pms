import { ShieldAlert } from "lucide-react";
import { PublicStateCard } from "@/components/public/public-state-card";

export default function AccessDeniedPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
        <PublicStateCard
          icon={ShieldAlert}
          eyebrow="403"
          title="Access denied"
          description="You don’t have permission to view this page. Sign in with an account that has access."
          tone="destructive"
          actionHref="/login"
          actionLabel="Go to login"
          secondaryActionHref="/"
          secondaryActionLabel="Go home"
        />
      </div>
    </main>
  );
}
