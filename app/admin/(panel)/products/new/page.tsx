import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Add product" };

export default async function NewProduct() {
  await requireAdmin();
  return (
    <div>
      <Link href="/admin/products" className="text-sm font-bold text-ink-soft hover:text-ink">← Products</Link>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Add a product</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        It starts hidden, so you can add photos and check it before shoppers see it. Tick “Show in the shop” when it&apos;s ready.
      </p>
      <div className="mt-6">
        <ProductForm product={null} />
      </div>
    </div>
  );
}
