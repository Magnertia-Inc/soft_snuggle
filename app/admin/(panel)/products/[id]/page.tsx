import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/admin";
import { folderPhotos, getAdminProduct } from "@/lib/admin-products";

export const metadata = { title: "Edit product" };

export default async function EditProduct({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ added?: string }>;
}) {
  await requireAdmin();
  const id = Number((await params).id);
  const product = Number.isInteger(id) && id > 0 && id < 2 ** 31 ? await getAdminProduct(id) : null;
  if (!product) notFound();
  const { added } = await searchParams;

  return (
    <div>
      <Link href="/admin/products" className="text-sm font-bold text-ink-soft hover:text-ink">← Products</Link>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{product.name}</h1>
      {added && (
        <p className="mt-3 rounded-2xl bg-sage/60 px-4 py-3 text-sm font-bold">
          Added. It&apos;s {product.hidden ? "hidden for now: tick “Show in the shop” and save when it’s ready." : "in the shop now."}
        </p>
      )}
      <div className="mt-6">
        <ProductForm product={product} folderPhotos={folderPhotos(product.slug)} />
      </div>
    </div>
  );
}
