import { QueryProvider } from "@/components/providers/query-provider";

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-booking-background">
        {children}
      </div>
    </QueryProvider>
  );
}
