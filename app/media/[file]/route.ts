import { getMedia } from "@/lib/media";

/**
 * Photos uploaded in the admin panel, e.g. /media/p-12.webp. An id's photo
 * never changes (a new upload gets a new id), so browsers may keep it for a year.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const match = (await params).file.match(/^p-(\d{1,9})\.(webp|jpg|png)$/);
  const media = match ? await getMedia(Number(match[1])) : null;
  if (!media) return new Response("Not found", { status: 404 });

  return new Response(Buffer.from(media.data), {
    headers: {
      "Content-Type": media.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
