import { getDb } from "./db";

// Photos uploaded in the admin panel. They live in the database rather than on
// the server's disk, which Railway wipes on every deploy, and are served from
// /media/p-<id>.<ext> (app/media/[file]/route.ts).
//
// Each upload is turned the right way up, shrunk to fit 1600×2000 and saved as
// WebP, so a 6 MB phone photo becomes a couple of hundred KB. That needs sharp,
// which Next.js installs alongside itself; if it is missing, small JPEG, PNG
// and WebP files are kept as they are and anything else is refused.

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_UNPROCESSED_BYTES = 2 * 1024 * 1024;
const KEPT_AS_IS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export class MediaError extends Error {}

export const mediaUrl = (id: number, mime: string) => `/media/p-${id}.${KEPT_AS_IS[mime] ?? "webp"}`;

/** True for a photo uploaded here, as opposed to one in public/products. */
export const isMediaUrl = (url: string) => /^\/media\/p-\d+\.(webp|jpg|png)$/.test(url);

type Processed = { data: Buffer; mime: string; width: number | null; height: number | null };

async function shrink(input: Buffer): Promise<Processed | null> {
  let sharp: typeof import("sharp").default;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    return null;
  }
  try {
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width: 1600, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    return { data, mime: "image/webp", width: info.width, height: info.height };
  } catch {
    throw new MediaError("That file couldn't be read as a photo. Try saving it as a JPEG first (iPhone HEIC photos need this).");
  }
}

export async function saveUpload(file: File, uploadedBy: string) {
  if (!file.size) throw new MediaError("That file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new MediaError("Photos can be up to 12 MB.");
  if (!file.type.startsWith("image/")) throw new MediaError("Only photos can be uploaded (JPEG, PNG or WebP).");

  const input = Buffer.from(await file.arrayBuffer());
  let out = await shrink(input);
  if (!out) {
    if (!KEPT_AS_IS[file.type]) throw new MediaError("Only JPEG, PNG or WebP photos can be uploaded.");
    if (input.length > MAX_UNPROCESSED_BYTES) throw new MediaError("Photos can be up to 2 MB here. Make it smaller and try again.");
    out = { data: input, mime: file.type, width: null, height: null };
  }

  const db = await getDb();
  const { rows } = await db.query<{ id: number }>(
    "INSERT INTO media (mime, data, width, height, bytes, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    [out.mime, out.data, out.width, out.height, out.data.length, uploadedBy],
  );
  return { id: rows[0].id, url: mediaUrl(rows[0].id, out.mime) };
}

export async function getMedia(id: number) {
  const db = await getDb();
  const { rows } = await db.query<{ mime: string; data: Uint8Array }>("SELECT mime, data FROM media WHERE id = $1", [id]);
  return rows[0] ?? null;
}
