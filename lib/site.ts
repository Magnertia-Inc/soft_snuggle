/**
 * The address people reach the site at, e.g. https://soft-snuggle-production.up.railway.app.
 *
 * Behind Railway's proxy the server itself listens on http://localhost:8080,
 * so req.url points there: a redirect built from it sends the browser nowhere,
 * and Google refuses a sign-in whose return address it doesn't recognise.
 * SITE_URL wins when set (needed once a custom domain is added); otherwise the
 * proxy's forwarded host and protocol are used.
 */
export function siteOrigin(req: Request) {
  const configured = process.env.SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  return requestOrigin(req);
}

/**
 * The public address when there's no request to read it from (link previews,
 * the sitemap, emails sent later): SITE_URL, else the domain Railway gives the
 * service. Null when neither is set, as on a laptop.
 */
export function configuredSiteUrl(): string | null {
  const configured = process.env.SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  if (process.env.RAILWAY_PUBLIC_DOMAIN) return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  return null;
}

/** configuredSiteUrl, falling back to a local address so absolute URLs can still be built. */
export const publicSiteUrl = () => configuredSiteUrl() ?? `http://localhost:${process.env.PORT ?? 3000}`;

function requestOrigin(req: Request) {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0] ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

/**
 * True when a state-changing request came from one of our own pages. Browsers
 * always send Origin on fetch POSTs, so a form on another site posting here
 * (cross-site request forgery) is turned away even if the cookie went along.
 */
export function fromOwnSite(req: Request) {
  const origin = req.headers.get("origin");
  return !!origin && origin === siteOrigin(req);
}
