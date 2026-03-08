"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateProperty, type UpdatePropertyState } from "./actions";
import type { Property } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-destructive mt-1">{errors[0]}</p>;
}

export function PropertyForm({ property }: { property: Property }) {
  const [state, formAction] = useActionState<UpdatePropertyState, FormData>(
    updateProperty.bind(null, property.id),
    {}
  );
  const [paymentMode, setPaymentMode] = useState(property.paymentMode);

  return (
    <form action={formAction} className="space-y-6">
      {state.success && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          Property updated successfully.
        </div>
      )}
      {state.error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>The property name and public-facing details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="name">Property Name</Label>
              <Input id="name" name="name" defaultValue={property.name} />
              <FieldError errors={state.fieldErrors?.name} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" name="slug" defaultValue={property.slug} />
              <p className="text-xs text-muted-foreground">Used in booking URLs</p>
              <FieldError errors={state.fieldErrors?.slug} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={property.description ?? ""}
              rows={4}
            />
            <FieldError errors={state.fieldErrors?.description} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="address">Street Address</Label>
            <Input id="address" name="address" defaultValue={property.address ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={property.city ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="country">Country Code</Label>
              <Input
                id="country"
                name="country"
                defaultValue={property.country ?? ""}
                placeholder="HR"
                maxLength={2}
              />
              <p className="text-xs text-muted-foreground">ISO 2-letter code (e.g. HR, DE, US)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operations</CardTitle>
          <CardDescription>Check-in/out times and currency settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="checkInTime">Check-in Time</Label>
              <Input
                id="checkInTime"
                name="checkInTime"
                type="time"
                defaultValue={property.checkInTime ?? "15:00"}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="checkOutTime">Check-out Time</Label>
              <Input
                id="checkOutTime"
                name="checkOutTime"
                type="time"
                defaultValue={property.checkOutTime ?? "11:00"}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue={property.currency}
                maxLength={3}
                placeholder="EUR"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                name="timezone"
                defaultValue={property.timezone}
                placeholder="Europe/Zagreb"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="paymentMode">Payment Mode</Label>
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
            </div>
            {paymentMode === "deposit_at_booking" && (
              <div className="space-y-1">
                <Label htmlFor="depositPercentage">Deposit Percentage</Label>
                <Input
                  id="depositPercentage"
                  name="depositPercentage"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={property.depositPercentage}
                />
                <FieldError errors={state.fieldErrors?.depositPercentage} />
              </div>
            )}
            {paymentMode !== "deposit_at_booking" && (
              <input type="hidden" name="depositPercentage" value={property.depositPercentage} />
            )}
            {paymentMode === "scheduled" && (
              <div className="space-y-1">
                <Label htmlFor="scheduledChargeThresholdDays">Charge X days before check-in</Label>
                <Input
                  id="scheduledChargeThresholdDays"
                  name="scheduledChargeThresholdDays"
                  type="number"
                  min={1}
                  max={365}
                  defaultValue={property.scheduledChargeThresholdDays ?? 7}
                />
                <p className="text-xs text-muted-foreground">
                  Card saved at booking; charged this many days before arrival
                </p>
                <FieldError errors={state.fieldErrors?.scheduledChargeThresholdDays} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cancellation Policy</CardTitle>
          <CardDescription>
            Determines what refund guests receive when they cancel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="cancellationPolicy">Policy</Label>
              <Select
                name="cancellationPolicy"
                defaultValue={property.cancellationPolicy}
              >
                <SelectTrigger id="cancellationPolicy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flexible">
                    Flexible — full refund before deadline
                  </SelectItem>
                  <SelectItem value="moderate">
                    Moderate — 50% refund before deadline
                  </SelectItem>
                  <SelectItem value="strict">
                    Strict — no refund
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldError errors={state.fieldErrors?.cancellationPolicy} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cancellationDeadlineDays">
                Deadline (days before check-in)
              </Label>
              <Input
                id="cancellationDeadlineDays"
                name="cancellationDeadlineDays"
                type="number"
                min={1}
                max={365}
                defaultValue={property.cancellationDeadlineDays}
              />
              <p className="text-xs text-muted-foreground">
                Refund applies when cancelled this many days before check-in
              </p>
              <FieldError
                errors={state.fieldErrors?.cancellationDeadlineDays}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding &amp; Contact</CardTitle>
          <CardDescription>
            Shown in the booking engine, emails, and structured data for SEO.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              name="tagline"
              defaultValue={property.tagline ?? ""}
              placeholder="Your home away from home in Rijeka"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={property.phone ?? ""}
                placeholder="+385 51 123 456"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={property.email ?? ""}
                placeholder="hello@preelook.com"
              />
              <FieldError errors={state.fieldErrors?.email} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                name="logoUrl"
                defaultValue={property.logoUrl ?? ""}
                placeholder="https://..."
              />
              <FieldError errors={state.fieldErrors?.logoUrl} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                defaultValue={property.websiteUrl ?? ""}
                placeholder="https://preelook.com"
              />
              <FieldError errors={state.fieldErrors?.websiteUrl} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="mapsUrl">Google Maps Link</Label>
            <Input
              id="mapsUrl"
              name="mapsUrl"
              defaultValue={property.mapsUrl ?? ""}
              placeholder="https://maps.google.com/..."
            />
            <FieldError errors={state.fieldErrors?.mapsUrl} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                defaultValue={property.latitude ?? ""}
                placeholder="45.3271"
              />
              <FieldError errors={state.fieldErrors?.latitude} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                defaultValue={property.longitude ?? ""}
                placeholder="14.4422"
              />
              <FieldError errors={state.fieldErrors?.longitude} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="checkInInstructions">Check-in Instructions</Label>
            <Textarea
              id="checkInInstructions"
              name="checkInInstructions"
              defaultValue={property.checkInInstructions ?? ""}
              rows={4}
              placeholder="Key box is at the front entrance, code 1234..."
            />
            <p className="text-xs text-muted-foreground">
              Included in the pre-arrival email sent the day before check-in.
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator className="sr-only" />

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
