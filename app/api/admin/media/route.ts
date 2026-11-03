import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { MediaError, saveUpload } from "@/lib/media";
import { fromOwnSite } from "@/lib/site";

/** Takes one photo from the product editor and returns the address it is served at. */
export async function POST(req: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!fromOwnSite(req)) return NextResponse.json({ error: "Invalid request." }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });

  try {
    const saved = await saveUpload(file, admin.email);
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    if (err instanceof MediaError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("photo upload failed", err);
    return NextResponse.json({ error: "That photo didn't upload. Please try again." }, { status: 500 });
  }
}
