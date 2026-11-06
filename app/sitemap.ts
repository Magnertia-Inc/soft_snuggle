import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/queries";
import { publicSiteUrl } from "@/lib/site";

// Every page a shopper can land on from a search, with each listed product.
// Built on request: the product list lives in the database, which the build can't reach.
export const dynamic = "force-dynamic";

const PAGES = ["/", "/shop", "/about", "/contact", "/track", "/policies/shipping", "/policies/returns", "/policies/privacy", "/policies/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = publicSiteUrl();
  const products = await getProducts();
  return [
    ...PAGES.map((p) => ({ url: `${site}${p === "/" ? "" : p}`, changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.5 })),
    ...products.map((p) => ({ url: `${site}/product/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
