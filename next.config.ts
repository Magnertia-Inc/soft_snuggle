import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (embedded Postgres used when DATABASE_URL is not set) ships WASM files
  // that must be loaded from node_modules at runtime, not bundled.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  // Product and hero photos are discovered by listing public/ at request time,
  // so ship those folders with the server functions on Vercel.
  outputFileTracingIncludes: {
    "/**": ["./public/products/**/*", "./public/hero/**/*"],
  },
  // Hide the floating "N" dev-tools button while developing
  devIndicators: false,
  // Order IDs used to be SS-1001 and are VVB-1001 now (same number). Links sent
  // before the change, in emails and WhatsApp, still open; ?k= is kept.
  async redirects() {
    return ["/order", "/feedback", "/admin/orders"].flatMap((base) =>
      ["SS", "ss"].map((old) => ({ source: `${base}/${old}-:num(\\d+)`, destination: `${base}/VVB-:num`, permanent: true })),
    );
  },
  webpack: (config) => {
    // node-postgres optionally uses a native driver we do not ship. Webpack
    // tries to resolve it anyway when it traces instrumentation.ts, so it is
    // declared external rather than bundled.
    config.externals = [...(config.externals ?? []), "pg-native"];
    return config;
  },
};

export default nextConfig;
