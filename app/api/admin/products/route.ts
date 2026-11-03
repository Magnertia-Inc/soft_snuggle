import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { ProductError, cleanProductInput, createProduct } from "@/lib/admin-products";
import { fromOwnSite } from "@/lib/site";

/** Adds a new product from the editor. */
export async function POST(req: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!fromOwnSite(req)) return NextResponse.json({ error: "Invalid request." }, { status: 403 });

  try {
    const input = cleanProductInput(await req.json().catch(() => ({})));
    const product = await createProduct(input);
    console.info(`product ${product.id} (${product.slug}) added by ${admin.email}`);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    if (err instanceof ProductError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("product create failed", err);
    return NextResponse.json({ error: "That didn't save. Please try again." }, { status: 500 });
  }
}
