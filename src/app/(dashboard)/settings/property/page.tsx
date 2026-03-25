import { notFound } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { PropertyForm } from "../property-form";
import { SettingsNav } from "../settings-nav";

export default async function SettingsPropertyPage() {
  const [property] = await db.select().from(properties).limit(1);

  if (!property) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Property Settings"
        description="Core identity, operations, policies, and contact details for the property."
      />
      <SettingsNav />

      <section className="max-w-5xl space-y-4">
        <SectionHeader
          title="Property Profile"
          description="Update the information used across the dashboard, booking flow, and guest communications."
        />
        <div className="max-w-3xl">
          <PropertyForm property={property} />
        </div>
      </section>
    </div>
  );
}
