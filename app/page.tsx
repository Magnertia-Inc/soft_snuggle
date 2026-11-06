import Link from "next/link";
import { AgeTiles } from "@/components/home/AgeTiles";
import { Brands } from "@/components/home/Brands";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { Journey } from "@/components/home/Journey";
import { Marquee } from "@/components/home/Marquee";
import { Statement } from "@/components/home/Statement";
import { Story } from "@/components/home/Story";
import { Reveal } from "@/components/Reveal";
import { ProductCard } from "@/components/shop/ProductCard";
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
      <Journey />
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
        {/* A taste of the shop: six dresses and pieces, then the button to see everything */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3">
          {products
            .filter((p) => p.category !== "gift-set")
            .slice(0, 6)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
        <div className="mt-12 flex justify-center">
          <Link href="/shop" className="btn-primary">
            Shop all →
          </Link>
        </div>
      </section>

      <Story photo={storyImage()} />
    </>
  );
}
