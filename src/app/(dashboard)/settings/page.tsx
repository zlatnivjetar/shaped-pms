import { db } from "@/db";
import { properties } from "@/db/schema";
import { notFound } from "next/navigation";
import { PropertyForm } from "./property-form";

export default async function SettingsPage() {
  const allProperties = await db.select().from(properties).limit(1);
  const property = allProperties[0];

  if (!property) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your property details.</p>
      </div>
      <PropertyForm property={property} />
    </div>
  );
}
