import { db } from "@/db";
import { properties } from "@/db/schema";
import { notFound } from "next/navigation";
import { PropertyForm } from "../property-form";

export default async function SettingsPropertyPage() {
  const [property] = await db.select().from(properties).limit(1);

  if (!property) {
    notFound();
  }

  return (
    <div className="max-w-3xl">
      <PropertyForm property={property} />
    </div>
  );
}
