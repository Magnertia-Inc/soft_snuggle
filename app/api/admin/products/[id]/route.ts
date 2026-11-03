import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { ProductError, cleanProductInput, deleteProduct, setProductHidden, updateProduct } from "@/lib/admin-products";
import { AdminError, setStock } from "@/lib/admin-queries";
import { fromOwnSite } from "@/lib/site";

type Ctx = { params: Promise<{ id: string }> };

async function guard(req: Request, { params }: Ctx) {
  const admin = await currentAdmin();
  if (!admin) return { error: NextResponse.json({ error: "Please sign in again." }, { status: 401 }) };
  if (!fromOwnSite(req)) return { error: NextResponse.json({ error: "Invalid request." }, { status: 403 }) };
  const productId = Number((await params).id);
  if (!Number.isInteger(productId)) return { error: NextResponse.json({ error: "Invalid request." }, { status: 400 }) };
  return { admin, productId };
}

/** Marks a product, or some of its sizes, sold out or back in stock, or hides it from the shop. */
export async function POST(req: Request, ctx: Ctx) {
  const g = await guard(req, ctx);
  if (g.error) return g.error;
  const { admin, productId } = g;

  const body = await req.json().catch(() => ({}));
  const inStock = typeof body.inStock === "boolean" ? body.inStock : undefined;
  const hidden = typeof body.hidden === "boolean" ? body.hidden : undefined;
  const soldOutSizes = Array.isArray(body.soldOutSizes)
    ? body.soldOutSizes.filter((s: unknown): s is string => typeof s === "string").slice(0, 20)
    : undefined;
  if (inStock === undefined && soldOutSizes === undefined && hidden === undefined) {
    return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  }

  try {
    if (hidden !== undefined) await setProductHidden(productId, hidden);
    if (inStock !== undefined || soldOutSizes !== undefined) await setStock(productId, { inStock, soldOutSizes });
    console.info(`stock changed by ${admin.email}: product ${productId}`, { inStock, soldOutSizes, hidden });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminError || err instanceof ProductError) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error("stock update failed", err);
    return NextResponse.json({ error: "That didn't save. Please try again." }, { status: 500 });
  }
}

/** Saves everything in the product editor. */
export async function PUT(req: Request, ctx: Ctx) {
  const g = await guard(req, ctx);
  if (g.error) return g.error;
  const { admin, productId } = g;

  try {
    const input = cleanProductInput(await req.json().catch(() => ({})));
    const product = await updateProduct(productId, input);
    console.info(`product ${productId} edited by ${admin.email}`);
    return NextResponse.json({ product });
  } catch (err) {
    if (err instanceof ProductError) return NextResponse.json({ error: err.message }, { status: 422 });
    console.error("product update failed", err);
    return NextResponse.json({ error: "That didn't save. Please try again." }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const g = await guard(req, ctx);
  if (g.error) return g.error;
  const { admin, productId } = g;

  try {
    await deleteProduct(productId);
    console.info(`product ${productId} deleted by ${admin.email}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("product delete failed", err);
    return NextResponse.json({ error: "That didn't delete. Please try again." }, { status: 500 });
  }
}
