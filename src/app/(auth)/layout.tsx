import { Building2 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <aside className="relative hidden overflow-hidden border-r border-border bg-muted/40 lg:flex">
          <div className="absolute -left-16 top-0 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-secondary blur-3xl" />
          <div className="relative flex h-full flex-col justify-between px-10 py-12">
            <div className="space-y-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="max-w-md space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                  Shaped PMS
                </p>
                <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                  Calm operations for every stay.
                </h1>
                <p className="text-base leading-7 text-muted-foreground">
                  Sign in to manage bookings, pricing, rooms, and guest experience from
                  one coherent workspace.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card/80 p-5 shadow-sm">
                <p className="text-sm font-medium text-foreground">One system</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Reservations, rates, reviews, and operations in one workflow.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card/80 p-5 shadow-sm">
                <p className="text-sm font-medium text-foreground">Clear focus</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Warm surfaces, strong contrast, and predictable controls throughout.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="relative flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/10 to-transparent lg:hidden" />
          <div className="relative w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
