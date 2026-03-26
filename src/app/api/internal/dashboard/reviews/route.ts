import { apiError, apiResponse } from "@/lib/api-utils";
import { getDashboardContextFromHeaders } from "@/lib/dashboard-context";
import { getDashboardReviewsData } from "@/lib/dashboard-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = await getDashboardContextFromHeaders(request.headers);
  if (!context) {
    return apiError("Unauthorized.", 401);
  }

  const { searchParams } = new URL(request.url);
  const data = await getDashboardReviewsData(context.property.id, {
    status: searchParams.get("status") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });

  return apiResponse(data);
}
