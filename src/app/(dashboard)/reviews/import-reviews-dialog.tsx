"use client";

import { useState, useTransition } from "react";
import { importOtaReviews, type ImportResult } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const EXAMPLE_JSON = `[
  {
    "reviewer_name": "Maria K.",
    "rating": 9.2,
    "title": "Wonderful stay",
    "body": "Clean rooms, great location, friendly staff.",
    "stay_date_start": "2025-07-10",
    "stay_date_end": "2025-07-14",
    "external_id": "bdc_123456",
    "source": "booking_com",
    "source_url": "https://www.booking.com/..."
  }
]`;

export default function ImportReviewsDialog() {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await importOtaReviews(json);
      setResult(res);
      if (res.imported > 0 && res.errors.length === 0) {
        setTimeout(() => setOpen(false), 1500);
      }
    });
  }

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (!val) {
      setJson("");
      setResult(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Import OTA Reviews
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import OTA Reviews</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-stone-500">
            Paste a JSON array of reviews from Booking.com, Google, Airbnb, or
            other platforms. Duplicates (matched by{" "}
            <code className="font-mono bg-stone-100 px-1 rounded">
              external_id
            </code>
            ) are automatically skipped.
          </p>

          <details className="text-xs text-stone-500">
            <summary className="cursor-pointer hover:text-stone-700">
              Show example format
            </summary>
            <pre className="mt-2 bg-stone-50 border border-stone-200 rounded p-3 overflow-auto text-xs font-mono leading-relaxed">
              {EXAMPLE_JSON}
            </pre>
          </details>

          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            rows={12}
            placeholder="Paste JSON array here…"
            className="w-full text-xs font-mono rounded border border-stone-300 px-3 py-2 focus:outline-none focus:border-stone-500 resize-y"
          />

          {result && (
            <div
              className={`rounded-md px-4 py-3 text-sm space-y-1 ${
                result.errors.length > 0
                  ? "bg-red-50 border border-red-200 text-red-700"
                  : "bg-green-50 border border-green-200 text-green-700"
              }`}
            >
              <p className="font-medium">
                {result.imported} imported, {result.skipped} skipped
              </p>
              {result.errors.length > 0 && (
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !json.trim()}>
              {isPending ? "Importing…" : "Import"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
