import { apiError, apiResponse } from "@/lib/api-utils";
import { getBookingAvailabilityData, getBookingShellData } from "@/lib/booking-data";
import { searchParamsSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const shellData = await getBookingShellData(slug);

  if (!shellData) {
    return apiError("Property not found.", 404);
  }

  const { searchParams } = new URL(request.url);
  const parsed = searchParamsSchema.safeParse({
    checkIn: searchParams.get("checkIn"),
    checkOut: searchParams.get("checkOut"),
    adults: searchParams.get("adults"),
    children: searchParams.get("children"),
  });

  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "Invalid request parameters.",
      400,
    );
  }

  if (parsed.data.checkIn >= parsed.data.checkOut) {
    return apiError("checkOut must be after checkIn.", 400);
  }

  const data = await getBookingAvailabilityData(shellData.property.id, {
    checkIn: parsed.data.checkIn,
    checkOut: parsed.data.checkOut,
    adults: parsed.data.adults,
    children: parsed.data.children,
  });

  return apiResponse(data);
}
