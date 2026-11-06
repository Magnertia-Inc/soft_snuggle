import Link from "next/link";
import { AgeTiles } from "@/components/home/AgeTiles";
import { Brands } from "@/components/home/Brands";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { Marquee } from "@/components/home/Marquee";
import { Statement } from "@/components/home/Statement";
import { Story } from "@/components/home/Story";
import { Reveal } from "@/components/Reveal";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { AGE_GROUPS } from "@/lib/store";
import { ageImages, heroImages, storyImage } from "@/lib/images";
import { getProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getProducts();
  const counts = Object.fromEntries(
    AGE_GROUPS.map((g) => [g.slug, products.filter((p) => p.ageGroups.includes(g.slug)).length]),
  );

  return (
    <>
      <HeroCarousel heroImages={heroImages()} />
      <Marquee />
      <Brands />
      <Statement />
      <AgeTiles counts={counts} photos={ageImages()} />

      <section id="favourites" className="shell py-20 sm:py-32">
        <Reveal className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">The soft stuff</p>
            <h2 className="mt-3 font-display text-4xl tracking-tight sm:text-6xl">
              Little <em className="text-sage-deep">favourites</em>
            </h2>
            <p className="mt-3 text-lg text-ink-soft">Everyday pieces made for the beautifully messy bits.</p>
          </div>
          <Link href="/shop" className="btn-ghost w-fit">
            View all →
          </Link>
        </Reveal>
        <ProductGrid products={products} />
      </section>

      <Story photo={storyImage()} />
    </>
  );
}
