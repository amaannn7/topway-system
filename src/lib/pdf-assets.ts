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

// Converts a public-relative upload URL (e.g. "/uploads/logos/x.png") into
// image bytes react-pdf can embed directly. Returns null for anything that
// isn't a local upload (missing, external URL, etc) or that fails to read.
export function uploadPathToPdfSrc(url: string | null | undefined): Buffer | null {
  if (!url || !url.startsWith("/uploads/")) return null;
  return readLocalFile(path.join(process.cwd(), "public", url));
}

// Resolves a path under /public (e.g. "brand/topway-logo.png") into image
// bytes react-pdf can embed directly.
export function staticAssetToPdfSrc(publicRelativePath: string): Buffer | null {
  return readLocalFile(path.join(process.cwd(), "public", publicRelativePath));
}
