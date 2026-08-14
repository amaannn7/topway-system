import path from "node:path";
import { readFileSync } from "node:fs";

// react-pdf's <Image> resolves a string `src` by parsing it as a URL and,
// for local paths, going through @react-pdf/image's getAbsoluteLocalPath —
// which destructures `pathname` from `url.parse()` but then calls
// `path.resolve()` on the *original* string instead of that pathname. On
// Windows this mis-happens twice over: a bare "C:\..." path is parsed with
// "C:" as the URL protocol (silently failing), and even a "file://..." URL
// gets mangled by the same resolve-on-the-wrong-value bug, producing a
// bogus concatenated path. Neither a bare path nor a file:// URL survives
// on Windows — the only path that actually works is a Buffer, which
// react-pdf embeds directly without going through any of that URL parsing
// (see resolveBufferImage in @react-pdf/image). So every local asset read
// for a PDF goes through here rather than being passed as a path string.
function readLocalFile(absolutePath: string): Buffer | null {
  try {
    return readFileSync(absolutePath);
  } catch {
    return null;
  }
}

// Uploads live on Vercel Blob in production (see src/lib/uploads.ts) and on
// local disk under /uploads in dev. A stored URL is either an absolute
// https:// Blob URL or a "/uploads/..." local path — this reads whichever
// one it actually is into bytes react-pdf can embed directly. Returns null
// for anything missing, unrecognized, or that fails to read/fetch.
export async function uploadPathToPdfSrc(url: string | null | undefined): Promise<Buffer | null> {
  if (!url) return null;
  if (url.startsWith("/uploads/")) {
    return readLocalFile(path.join(process.cwd(), "public", url));
  }
  if (url.startsWith("https://") || url.startsWith("http://")) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
  }
  return null;
}

// Resolves a path under /public (e.g. "brand/topway-logo.png") into image
// bytes react-pdf can embed directly.
export function staticAssetToPdfSrc(publicRelativePath: string): Buffer | null {
  return readLocalFile(path.join(process.cwd(), "public", publicRelativePath));
}
