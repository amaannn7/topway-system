"use client";

import { useState } from "react";
import { Eye, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// Matches the legacy invoice.html previewFromForm() behavior — preview
// the invoice PDF from whatever is currently in the form, before it's
// ever saved. Posts the raw (not-yet-validated) form values to a
// preview-only render endpoint that validates them server-side with the
// same schema the real save uses, and persists nothing.
export function InvoiceFormPreviewButton({
  getValues,
}: {
  getValues: () => unknown;
}) {
  const [open, setOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadPreview() {
    setLoading(true);
    setBlobUrl(null);
    try {
      const res = await fetch("/admin/invoices/preview-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getValues()),
      });
      if (!res.ok) throw new Error("Failed to render preview");
      const blob = await res.blob();
      setBlobUrl(URL.createObjectURL(blob));
    } catch {
      toast.error("Could not generate preview. Check required fields.");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) loadPreview();
    else if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline">
            <Eye className="size-4" />
            Preview
          </Button>
        }
      />
      <DialogContent className="flex max-h-[90vh] max-w-3xl sm:max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>Invoice preview</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden rounded-md border bg-muted">
          {loading || !blobUrl ? (
            <div className="flex h-[70vh] items-center justify-center text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <iframe src={blobUrl} title="Invoice preview" className="h-[70vh] w-full" />
          )}
        </div>
        <DialogFooter>
          {blobUrl && (
            <Button render={<a href={blobUrl} download="invoice-preview.pdf" />}>
              <Download className="size-4" />
              Download this preview
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
