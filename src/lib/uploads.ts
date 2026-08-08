import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";

// Local-disk storage under public/uploads, served directly by Next.js as
// static files. The legacy upload.php trusted the client-supplied filename
// extension with no content-type or size validation (Phase 1 §6) — this
// sniffs real magic bytes via file-type and enforces a size cap and an
// explicit allow-list per call site instead.
const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_OR_PDF_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export class UploadError extends Error {}

export type StoredUpload = { url: string; mimeType: string };

async function storeFile(
  file: File,
  subdir: string,
  allowedTypes: Set<string>
): Promise<StoredUpload> {
  if (file.size === 0) throw new UploadError("Empty file");
  if (file.size > MAX_BYTES) throw new UploadError("File is larger than 8 MB");

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected || !allowedTypes.has(detected.mime)) {
    throw new UploadError(
      `Unsupported file type${detected ? `: ${detected.mime}` : ""}. Allowed: ${[...allowedTypes].join(", ")}`
    );
  }

  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const filename = `${randomBytes(12).toString("hex")}.${EXT_BY_MIME[detected.mime]}`;
  await writeFile(path.join(dir, filename), buffer);

  return { url: `/uploads/${subdir}/${filename}`, mimeType: detected.mime };
}

export function storeImage(file: File, subdir: string) {
  return storeFile(file, subdir, IMAGE_TYPES);
}

export function storeImageOrPdf(file: File, subdir: string) {
  return storeFile(file, subdir, IMAGE_OR_PDF_TYPES);
}

// Best-effort delete — a missing file (already removed, or never existed)
// is not an error condition for the caller.
export async function deleteUpload(url: string | null | undefined) {
  if (!url || !url.startsWith("/uploads/")) return;
  const filePath = path.join(process.cwd(), "public", url);
  try {
    await unlink(filePath);
  } catch {
    // ignore
  }
}
