import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
});

export default function ReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${playfair.variable} min-h-screen bg-booking-background`}>{children}</div>;
}
