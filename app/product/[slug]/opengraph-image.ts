import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getMedia } from "@/lib/media";
import { getProduct } from "@/lib/queries";
import { STORE } from "@/lib/store";

// The picture WhatsApp, Instagram and Google show when a product link is shared:
// the product's first photo on the shop's cream, as a JPEG (WhatsApp doesn't
// reliably show WebP, which is how the photos are stored).

export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";
export const alt = `A piece from ${STORE.name}`;

const CREAM = { r: 247, g: 244, b: 236 };

async function photo(src: string | undefined): Promise<Buffer | null> {
  if (!src) return null;
  const media = src.match(/^\/media\/p-(\d{1,9})\./);
  if (media) {
    const m = await getMedia(Number(media[1]));
    return m ? Buffer.from(m.data) : null;
  }
  // A photo shipped with the site, e.g. /products/lemon-frock/1.webp. Kept inside public/.
  const file = path.join(process.cwd(), "public", path.normalize(src).replace(/^([/\\])+/, ""));
  if (!file.startsWith(path.join(process.cwd(), "public"))) return null;
  return readFile(file).catch(() => null);
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);
  const source = (await photo(product?.images[0])) ?? (await readFile(path.join(process.cwd(), "public", "logo.png")));
  const jpeg = await sharp(source)
    .resize(size.width, size.height, { fit: "contain", background: CREAM })
    .flatten({ background: CREAM })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=3600" },
  });
}
