"use client";

import { useActionState } from "react";
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
              <Select name="paymentMode" defaultValue={property.paymentMode}>
                <SelectTrigger id="paymentMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_at_booking">Full payment at booking</SelectItem>
                  <SelectItem value="deposit_at_booking">Deposit at booking</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
