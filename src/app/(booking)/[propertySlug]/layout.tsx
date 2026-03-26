import { headers } from "next/headers";
import { buildLodgingBusinessJsonLd } from "@/lib/jsonld";
import { getBookingShellData } from "@/lib/booking-data";

interface Props {
  children: React.ReactNode;
  params: Promise<{ propertySlug: string }>;
}

export default async function PropertyBookingLayout({ children, params }: Props) {
  const { propertySlug } = await params;
  const shellData = await getBookingShellData(propertySlug);

  if (!shellData) {
    return <>{children}</>;
  }

  const headersList = await headers();
  const host = headersList.get("host") ?? "";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${proto}://${host}`;

  const jsonLd = buildLodgingBusinessJsonLd(
    shellData.property,
    shellData.activeRoomTypes,
    shellData.propertyAmenities,
    baseUrl,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
