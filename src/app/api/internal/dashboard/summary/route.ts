import { apiError, apiResponse } from "@/lib/api-utils";
import { getDashboardContextFromHeaders } from "@/lib/dashboard-context";
import { getDashboardSummaryData } from "@/lib/dashboard-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = await getDashboardContextFromHeaders(request.headers);
  if (!context) {
    return apiError("Unauthorized.", 401);
  }

  const data = await getDashboardSummaryData(
    context.property.id,
    context.property.currency,
  );

  return apiResponse(data);
}
