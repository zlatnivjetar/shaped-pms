"use client";

import { useActionState, useState } from "react";
import { updateProperty, type UpdatePropertyState } from "./actions";
import type { Property } from "@/db/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { InlineError } from "@/components/ui/inline-error";
import { SubmitButton } from "@/components/ui/submit-button";

export function PropertyForm({ property }: { property: Property }) {
  const [state, formAction] = useActionState<UpdatePropertyState, FormData>(
    updateProperty.bind(null, property.id),
    {}
  );
  const [paymentMode, setPaymentMode] = useState(property.paymentMode);

  return (
    <form action={formAction} className="space-y-6">
      {state.success && (
        <Alert variant="success">
          <AlertDescription>Property updated successfully.</AlertDescription>
        </Alert>
      )}
      {state.error && <InlineError>{state.error}</InlineError>}

      <FormSection
        title="Basic Information"
        description="The property name and public-facing details."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Property Name"
            htmlFor="name"
            error={state.fieldErrors?.name}
          >
            <Input id="name" name="name" defaultValue={property.name} />
          </FormField>
          <FormField
            label="Slug"
            htmlFor="slug"
            description="Used in booking URLs"
            error={state.fieldErrors?.slug}
          >
            <Input id="slug" name="slug" defaultValue={property.slug} />
          </FormField>
        </div>
        <FormField
          label="Description"
          htmlFor="description"
          error={state.fieldErrors?.description}
        >
          <Textarea
            id="description"
            name="description"
            defaultValue={property.description ?? ""}
            rows={4}
          />
        </FormField>
      </FormSection>

      <FormSection title="Location">
        <FormField label="Street Address" htmlFor="address">
          <Input id="address" name="address" defaultValue={property.address ?? ""} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="City" htmlFor="city">
            <Input id="city" name="city" defaultValue={property.city ?? ""} />
          </FormField>
          <FormField
            label="Country Code"
            htmlFor="country"
            description="ISO 2-letter code (e.g. HR, DE, US)"
          >
            <Input
              id="country"
              name="country"
              defaultValue={property.country ?? ""}
              placeholder="HR"
              maxLength={2}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Operations"
        description="Check-in/out times and currency settings."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Check-in Time" htmlFor="checkInTime">
            <Input
              id="checkInTime"
              name="checkInTime"
              type="time"
              defaultValue={property.checkInTime ?? "15:00"}
            />
          </FormField>
          <FormField label="Check-out Time" htmlFor="checkOutTime">
            <Input
              id="checkOutTime"
              name="checkOutTime"
              type="time"
              defaultValue={property.checkOutTime ?? "11:00"}
            />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Currency" htmlFor="currency">
            <Input
              id="currency"
              name="currency"
              defaultValue={property.currency}
              maxLength={3}
              placeholder="EUR"
            />
          </FormField>
          <FormField label="Timezone" htmlFor="timezone">
            <Input
              id="timezone"
              name="timezone"
              defaultValue={property.timezone}
              placeholder="Europe/Zagreb"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Payment Settings">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Payment Mode" htmlFor="paymentMode">
            <Select
              name="paymentMode"
              defaultValue={property.paymentMode}
              onValueChange={(v) => setPaymentMode(v as typeof paymentMode)}
            >
              <SelectTrigger id="paymentMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_at_booking">Full payment at booking</SelectItem>
                <SelectItem value="deposit_at_booking">Deposit at booking</SelectItem>
                <SelectItem value="scheduled">Scheduled (charge before arrival)</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          {paymentMode === "deposit_at_booking" && (
            <FormField
              label="Deposit Percentage"
              htmlFor="depositPercentage"
              error={state.fieldErrors?.depositPercentage}
            >
              <Input
                id="depositPercentage"
                name="depositPercentage"
                type="number"
                min={0}
                max={100}
                defaultValue={property.depositPercentage}
              />
            </FormField>
          )}
          {paymentMode !== "deposit_at_booking" && (
            <input type="hidden" name="depositPercentage" value={property.depositPercentage} />
          )}
          {paymentMode === "scheduled" && (
            <FormField
              label="Charge X days before check-in"
              htmlFor="scheduledChargeThresholdDays"
              description="Card saved at booking; charged this many days before arrival"
              error={state.fieldErrors?.scheduledChargeThresholdDays}
            >
              <Input
                id="scheduledChargeThresholdDays"
                name="scheduledChargeThresholdDays"
                type="number"
                min={1}
                max={365}
                defaultValue={property.scheduledChargeThresholdDays ?? 7}
              />
            </FormField>
          )}
        </div>
      </FormSection>

      <FormSection
        title="Cancellation Policy"
        description="Determines what refund guests receive when they cancel."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Policy"
            htmlFor="cancellationPolicy"
            error={state.fieldErrors?.cancellationPolicy}
          >
            <Select
              name="cancellationPolicy"
              defaultValue={property.cancellationPolicy}
            >
              <SelectTrigger id="cancellationPolicy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flexible">
                  Flexible - full refund before deadline
                </SelectItem>
                <SelectItem value="moderate">
                  Moderate - 50% refund before deadline
                </SelectItem>
                <SelectItem value="strict">Strict - no refund</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            label="Deadline (days before check-in)"
            htmlFor="cancellationDeadlineDays"
            description="Refund applies when cancelled this many days before check-in"
            error={state.fieldErrors?.cancellationDeadlineDays}
          >
            <Input
              id="cancellationDeadlineDays"
              name="cancellationDeadlineDays"
              type="number"
              min={1}
              max={365}
              defaultValue={property.cancellationDeadlineDays}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Branding & Contact"
        description="Shown in the booking engine, emails, and structured data for SEO."
      >
        <FormField label="Tagline" htmlFor="tagline">
          <Input
            id="tagline"
            name="tagline"
            defaultValue={property.tagline ?? ""}
            placeholder="Your home away from home in Rijeka"
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Phone" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              defaultValue={property.phone ?? ""}
              placeholder="+385 51 123 456"
            />
          </FormField>
          <FormField
            label="Contact Email"
            htmlFor="email"
            error={state.fieldErrors?.email}
          >
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={property.email ?? ""}
              placeholder="hello@preelook.com"
            />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Logo URL"
            htmlFor="logoUrl"
            error={state.fieldErrors?.logoUrl}
          >
            <Input
              id="logoUrl"
              name="logoUrl"
              defaultValue={property.logoUrl ?? ""}
              placeholder="https://..."
            />
          </FormField>
          <FormField
            label="Website URL"
            htmlFor="websiteUrl"
            error={state.fieldErrors?.websiteUrl}
          >
            <Input
              id="websiteUrl"
              name="websiteUrl"
              defaultValue={property.websiteUrl ?? ""}
              placeholder="https://preelook.com"
            />
          </FormField>
        </div>
        <FormField
          label="Google Maps Link"
          htmlFor="mapsUrl"
          error={state.fieldErrors?.mapsUrl}
        >
          <Input
            id="mapsUrl"
            name="mapsUrl"
            defaultValue={property.mapsUrl ?? ""}
            placeholder="https://maps.google.com/..."
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Latitude"
            htmlFor="latitude"
            error={state.fieldErrors?.latitude}
          >
            <Input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              defaultValue={property.latitude ?? ""}
              placeholder="45.3271"
            />
          </FormField>
          <FormField
            label="Longitude"
            htmlFor="longitude"
            error={state.fieldErrors?.longitude}
          >
            <Input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              defaultValue={property.longitude ?? ""}
              placeholder="14.4422"
            />
          </FormField>
        </div>
        <FormField
          label="Check-in Instructions"
          htmlFor="checkInInstructions"
          description="Included in the pre-arrival email sent the day before check-in."
        >
          <Textarea
            id="checkInInstructions"
            name="checkInInstructions"
            defaultValue={property.checkInInstructions ?? ""}
            rows={4}
            placeholder="Key box is at the front entrance, code 1234..."
          />
        </FormField>
      </FormSection>

      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving...">Save changes</SubmitButton>
      </div>
    </form>
  );
}
