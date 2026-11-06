import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { ProductCard } from "@/components/shop/ProductCard";
import { Reveal } from "@/components/Reveal";
import { getProduct, getProducts } from "@/lib/queries";
import { STORE, inr } from "@/lib/store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};
  // The preview photo comes from ./opengraph-image.ts.
  const title = `${product.name} · ${inr(product.price)}`;
  return {
    title: product.name,
    description: product.description,
    openGraph: { siteName: STORE.name, type: "website", locale: "en_IN", title, description: product.description },
  };
}

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = (await getProducts())
    .filter((p) => p.id !== product.id)
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
    .slice(0, 4);

  return (
    <div className="speckle">
      <ProductDetail product={product} />
      <section className="shell pb-24">
        <Reveal>
          <h2 className="mb-6 font-display text-3xl tracking-tight sm:mb-8 sm:text-4xl">
            You might <em className="text-sage-deep">also love</em>
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {related.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
