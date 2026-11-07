import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito } from "next/font/google";
import { ShopChrome } from "@/components/ShopChrome";
import { AccountProvider } from "@/components/providers/AccountProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import { IntroProvider } from "@/components/providers/IntroProvider";
import { publicSiteUrl } from "@/lib/site";
import { STORE } from "@/lib/store";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
});
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

const description =
  "Soft, thoughtful baby essentials made for milk-drunk mornings, first wiggles and every cuddle in between. 100% cotton muslin frocks, jablas, nappy covers, sets and gift packs for 0–3 years, made to order and freshly stitched.";

export const metadata: Metadata = {
  // Link previews (WhatsApp, Instagram, Google) need absolute image addresses.
  metadataBase: new URL(publicSiteUrl()),
  title: { default: `${STORE.name} · Little clothes, lots of love`, template: `%s · ${STORE.name}` },
  description,
  // The preview image itself is app/opengraph-image.png (products have their own).
  openGraph: { siteName: STORE.name, type: "website", locale: "en_IN", title: `${STORE.name} · Little clothes, lots of love`, description },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#F7F4EC" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${nunito.variable}`}>
      {/*
        Browser extensions write their own attributes onto <body> before React
        loads: Grammarly adds data-gr-ext-installed, password managers and
        translators do similar. React then sees a <body> that does not match
        what the server sent and reports a hydration mismatch that no change
        here could fix. This tells React to ignore attribute differences on
        this one element. It does not extend to anything inside it, so real
        mismatches in the app are still reported.
      */}
      <body suppressHydrationWarning>
        {/* Tells Google who the shop is and which logo to show beside it in search results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: STORE.name,
              url: publicSiteUrl(),
              logo: `${publicSiteUrl()}/logo.png`,
              email: STORE.email,
              sameAs: [STORE.instagram],
            }),
          }}
        />
        <IntroProvider>
          <AccountProvider>
            <CartProvider>
              <ShopChrome>{children}</ShopChrome>
            </CartProvider>
          </AccountProvider>
        </IntroProvider>
      </body>
    </html>
  );
}
