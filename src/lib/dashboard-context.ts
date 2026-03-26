import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { auth } from "@/lib/auth";

type Role = "owner" | "manager" | "front_desk";

type DashboardSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export interface DashboardContext {
  session: DashboardSession;
  property: typeof properties.$inferSelect;
  userRole: Role;
}

async function resolveActiveProperty(preferredPropertyId?: string | null) {
  if (preferredPropertyId) {
    const property = await db.query.properties.findFirst({
      where: and(
        eq(properties.id, preferredPropertyId),
        eq(properties.status, "active"),
      ),
    });

    if (property) {
      return property;
    }
  }

  return db.query.properties.findFirst({
    where: eq(properties.status, "active"),
    orderBy: [asc(properties.createdAt)],
  });
}

export async function getDashboardContextFromHeaders(
  requestHeaders: HeadersInit,
): Promise<DashboardContext | null> {
  const session = await auth.api.getSession({
    headers: new Headers(requestHeaders),
  });

  if (!session) {
    return null;
  }

  const property = await resolveActiveProperty(session.user.propertyId);
  if (!property) {
    return null;
  }

  return {
    session,
    property,
    userRole: (session.user.role as Role | undefined) ?? "owner",
  };
}

export const getDashboardContext = cache(async (): Promise<DashboardContext> => {
  const requestHeaders = await headers();
  const context = await getDashboardContextFromHeaders(requestHeaders);

  if (!context) {
    redirect("/login");
  }

  return context;
});
