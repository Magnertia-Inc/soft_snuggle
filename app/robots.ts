import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/site";

// Shop pages are for search engines; carts, accounts, orders and the admin panel aren't.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/account", "/checkout", "/order/", "/feedback/", "/wishlist", "/login"],
    },
    sitemap: `${publicSiteUrl()}/sitemap.xml`,
  };
}
