"use client";

import { usePathname } from "next/navigation";
import { CartDrawer } from "./CartDrawer";
import { Footer } from "./Footer";
import { Loader } from "./Loader";
import { Navbar } from "./Navbar";
import { SmoothScroll } from "./providers/SmoothScroll";
import { WhatsAppFloat } from "./WhatsAppFloat";

/**
 * The shop's frame: smooth scrolling, intro, navbar, footer and bag. The admin
 * panel is a working tool with its own header, so it gets none of it.
 */
export function ShopChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return <>{children}</>;

  return (
    <SmoothScroll>
      <Loader />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
      <WhatsAppFloat />
    </SmoothScroll>
  );
}
