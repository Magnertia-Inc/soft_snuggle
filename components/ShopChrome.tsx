"use client";

import { usePathname } from "next/navigation";
import { CartDrawer } from "./CartDrawer";
import { Footer } from "./Footer";
import { Loader } from "./Loader";
import { Navbar } from "./Navbar";
import { SmoothScroll } from "./providers/SmoothScroll";
import { WhatsAppFloat } from "./WhatsAppFloat";
import { UspToasts } from "./home/UspToasts";

/**
 * The shop's frame: smooth scrolling, intro, navbar, footer and bag. The admin
 * panel is a working tool with its own header, so it gets none of it.
 */
export function ShopChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return <>{children}</>;
  // USP pop-ups only on the home page and product pages
  const showUsp = pathname === "/" || pathname.startsWith("/product/");

  return (
    <SmoothScroll>
      <Loader />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
      <WhatsAppFloat />
      {showUsp && <UspToasts />}
    </SmoothScroll>
  );
}
