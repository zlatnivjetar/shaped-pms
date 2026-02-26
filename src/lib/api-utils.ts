import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { Property } from "@/db/schema";

// ─── Response helpers ─────────────────────────────────────────────────────────

export function apiResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    { data, meta: { timestamp: new Date().toISOString() } },
    { status }
  );
}

export function apiError(message: string, status: number): NextResponse {
  return NextResponse.json(
    { error: message, meta: { timestamp: new Date().toISOString() } },
    { status }
  );
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

/**
 * Validates a Bearer token (API key) against the property identified by slug.
 * Returns the property if auth succeeds, or an error response if it fails.
 *
 * TODO: add rate limiting via Upstash Ratelimit before production use.
 */
export async function getAuthenticatedProperty(
  req: NextRequest,
  slug: string
): Promise<{ property: Property } | { error: NextResponse }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: apiError("Missing or invalid Authorization header.", 401) };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return { error: apiError("Missing API key.", 401) };
  }

  const property = await db.query.properties.findFirst({
    where: and(eq(properties.slug, slug), eq(properties.apiKey, token)),
  });

  if (!property) {
    return { error: apiError("Invalid API key or property not found.", 401) };
  }

  return { property };
}
