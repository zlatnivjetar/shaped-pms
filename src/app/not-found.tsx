import { SearchX } from "lucide-react";
import { PublicStateCard } from "@/components/public/public-state-card";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
        <PublicStateCard
          icon={SearchX}
          eyebrow="404"
          title="Page not found"
          description="The page you’re looking for doesn’t exist or may have moved."
          tone="warning"
          actionHref="/"
          actionLabel="Go home"
        />
      </div>
    </main>
  );
}
