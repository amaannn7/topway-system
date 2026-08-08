"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UploadSlot({
  label,
  hint,
  currentUrl,
  isPdf,
  accept,
  aspectClassName = "aspect-[3/4]",
  onUpload,
  onRemove,
}: {
  label: string;
  hint?: string;
  currentUrl: string | null;
  isPdf?: boolean;
  accept: string;
  aspectClassName?: string;
  onUpload: (formData: FormData) => Promise<void>;
  onRemove?: () => Promise<void>;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [dragActive, setDragActive] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      try {
        await onUpload(formData);
        toast.success(`${label} uploaded`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Could not upload ${label.toLowerCase()}`);
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <div
        className={cn(
          "relative flex w-full max-w-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center text-xs text-muted-foreground transition-colors",
          aspectClassName,
          dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          pending && "pointer-events-none opacity-60"
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        {currentUrl ? (
          isPdf ? (
            <div className="flex flex-col items-center gap-1 p-3">
              <FileText className="size-6" />
              <span className="break-all">{currentUrl.split("/").pop()}</span>
            </div>
          ) : (
            <Image
              src={currentUrl}
              alt={label}
              fill
              className="rounded-lg object-cover"
              sizes="192px"
            />
          )
        ) : (
          <div className="flex flex-col items-center gap-1 p-3">
            <Upload className="size-5" />
            <span>Click or drag to upload</span>
            {hint && <span className="text-[11px] text-muted-foreground/70">{hint}</span>}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {currentUrl && onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await onRemove();
                toast.success(`${label} removed`);
                router.refresh();
              } catch {
                toast.error(`Could not remove ${label.toLowerCase()}`);
              }
            })
          }
        >
          <X className="size-3.5" />
          Remove
        </Button>
      )}
    </div>
  );
}
