"use client";

import { useState } from "react";
import { Download, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Shared preview-before-download modal for both the CV PDF (agent portal)
// and the invoice PDF (admin) — legacy index.html and invoice.html both
// rendered the PDF layout into a scaled-down modal before export
// (openPreview()/previewFromForm()); this replaces that with the actual
// generated PDF shown in an <iframe> via a blob URL, since these are now
// real server-rendered documents rather than an HTML layout to screenshot.
//
// The trigger is styled via `buttonVariants` classes applied straight to
// DialogTrigger's native <button>, rather than nesting a <Button> element
// through `render` — two styled primitives each stamping their own
// `data-slot` onto the same node caused a client/server hydration mismatch.
export function PdfPreviewDialog({
  pdfUrl,
  fileName,
  title,
  triggerLabel = "Preview",
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerClassName,
  triggerIconOnly = false,
  triggerAriaLabel,
}: {
  pdfUrl: string;
  fileName: string;
  title: string;
  triggerLabel?: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerSize?: React.ComponentProps<typeof Button>["size"];
  triggerClassName?: string;
  triggerIconOnly?: boolean;
  triggerAriaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadPreview() {
    if (blobUrl) return;
    setLoading(true);
    try {
      const res = await fetch(pdfUrl);
      if (!res.ok) throw new Error("Failed to load PDF");
      const blob = await res.blob();
      setBlobUrl(URL.createObjectURL(blob));
    } catch {
      toast.error("Could not load preview");
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
        className={cn(buttonVariants({ variant: triggerVariant, size: triggerSize }), triggerClassName)}
        aria-label={triggerIconOnly ? (triggerAriaLabel ?? triggerLabel) : undefined}
      >
        <Eye className="size-4" />
        {!triggerIconOnly && triggerLabel}
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] max-w-3xl sm:max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden rounded-md border bg-muted">
          {loading || !blobUrl ? (
            <div className="flex h-[70vh] items-center justify-center text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <iframe src={blobUrl} title={title} className="h-[70vh] w-full" />
          )}
        </div>
        <DialogFooter>
          <Button
            render={<a href={pdfUrl} download={fileName} />}
          >
            <Download className="size-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
