import Link from "next/link";
import { StockRow } from "@/components/admin/StockRow";
import { requireAdmin } from "@/lib/admin";
import { listAdminProducts } from "@/lib/admin-products";

export const metadata = { title: "Products" };

export default async function Products() {
  await requireAdmin();
  const products = await listAdminProducts();
  const hidden = products.filter((p) => p.hidden).length;
  const off = products.filter((p) => !p.inStock).length;
  const sizesOut = products.reduce((n, p) => n + (p.inStock ? p.soldOutSizes.filter((s) => p.sizes.includes(s)).length : 0), 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Products</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">What&apos;s in the shop</h1>
        </div>
        <Link href="/admin/products/new" className="btn-primary">+ Add product</Link>
      </div>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Tap a product&apos;s name to change its price, photos, sizes or wording. Tap a size to mark it sold out (it shows
        crossed out in the shop and can&apos;t be ordered); tap again to put it back. “On sale” takes the whole piece off or
        puts it back. Changes are live straight away.
      </p>
      <p className="mt-3 text-sm font-bold">
        {products.length} pieces · {hidden} hidden · {off} sold out · {sizesOut} {sizesOut === 1 ? "size" : "sizes"} sold out
      </p>

      <ul className="mt-6 divide-y divide-line overflow-hidden rounded-[1.5rem] border border-line bg-paper">
        {products.map((p) => <StockRow key={p.id} product={p} />)}
      </ul>
    </div>
  );
}
