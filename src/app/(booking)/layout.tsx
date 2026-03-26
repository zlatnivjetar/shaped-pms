import { Playfair_Display } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
});

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className={`${playfair.variable} min-h-screen bg-booking-background`}>
        {children}
      </div>
    </QueryProvider>
  );
}
