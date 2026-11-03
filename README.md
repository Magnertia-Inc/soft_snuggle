# Soft Snuggle — babywear store

Next.js 15 (App Router) + React 19 + Tailwind CSS 4 + Motion + Lenis, with a PostgreSQL backend.

## Run it

```bash
npm install
cp .env.example .env.local   # then edit the values
npm run dev                  # http://localhost:3000
```

## Database

- **No `DATABASE_URL` set** → uses an embedded Postgres (PGlite) stored in `./.data`. Good for development only.
- **`DATABASE_URL` set** → connects to real PostgreSQL (Neon, Supabase, your own server).

Tables (`products`, `orders`, `subscribers`) are created automatically on first start (`lib/schema.ts`),
and the 8 catalogue products from the PDF are seeded if `products` is empty (`lib/seed.ts`).
Orders get IDs like `SS-1001` automatically.

Orders and stock are managed in the admin panel (below). Products, prices and photos still live in
`lib/seed.ts` and `public/products/`.

## Order flow

1. Customer adds items (size + qty) → bag is kept in the browser.
2. Checkout: name, WhatsApp number, address, pincode, **UPI** or **Cash on Delivery**.
3. `POST /api/orders` re-prices everything from the database and saves the order.
4. Order page (`/order/SS-1001?k=…`, private link):
   - **UPI** → QR code (desktop) or "Pay in UPI app" button (mobile) with amount + order ID filled in → customer enters the UTR → saved to the order.
   - **COD** → goes straight to the WhatsApp step.
5. "Send order on WhatsApp" opens WhatsApp with a pre-filled message (items, total, UTR or COD, address). The customer taps Send.

## Admin panel (`/admin`)

Sign in with Google. Only the accounts in `ADMIN_EMAILS` get in, checked on every request, so removing
an address locks it out immediately. Needs `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` (see `.env.example`).

- **Dashboard**: orders and sales today / 7 days / 30 days (Indian time), and what needs doing: UPI
  payments to check, COD to confirm, to pack, to ship, in transit.
- **Orders**: tabs by status, search by order ID, phone or name. Each order shows items, address
  (copy, call, WhatsApp), UTR, and the next step:
  `new → confirmed → packed → shipped (courier + tracking no.) → out for delivery → delivered`, or cancelled
  (with a reason; can be reopened). Confirming a UPI order marks it paid. Every step and note is kept in
  the order's history with who did it.
- **Products**: add, edit, hide or delete products: name, price and "was" price, sizes, wording, badge,
  card colours and photos (uploaded from the phone or computer, shrunk to WebP and kept in the database,
  served at `/media/p-<id>.webp`). New products start hidden. The same page takes a piece off sale or marks
  single sizes sold out; sold-out sizes are crossed out in the shop and refused at checkout.
- **Coupons**: discount codes (% or ₹ off the items, optional cap, minimum order, last day, total uses,
  once per mobile number). Shoppers enter them at checkout; the order is re-priced on the server.
  Cancelling an order gives its use of the code back. A used code can only be switched off, not deleted.

`lib/seed.ts` is only the starting catalogue. Once a product has been saved in the panel, the panel owns
it and edits to `lib/seed.ts` no longer reach it (a deploy can't undo the owner's price). New products
added to `lib/seed.ts` still appear on the next deploy.

Customers follow the same steps at `/track` (order ID + mobile number), or from their account.

The code is in `app/admin/`, `app/api/admin/`, `components/admin/` and `lib/admin*.ts`. Admin APIs refuse
requests from other sites (Origin check), and admin pages are marked noindex.

## Where to change things

| What | File |
| --- | --- |
| WhatsApp number, UPI ID, payee name, shipping rules | `.env.local` |
| Hero carousel slides (title, text, character look) | `lib/collections.ts` |
| Baby characters (swap for 3D PNGs later) | `components/art/Baby.tsx` |
| Product prices, wording, photos, new products, discount codes | admin panel → Products / Coupons |
| Product photos (front/back/close-up/lifestyle) | drop into `public/products/<slug>/1.jpg … 4.jpg` — prompts in `IMAGE-PROMPTS.md` |
| Real photos on their own background | name them e.g. `1-photo.webp`, `2-photo.webp` (only files named exactly `1`/`2`/`3` are treated as white-background studio shots and blended into the card colour) |
| Hero 3D characters | drop into `public/hero/<collection>.png` (white background) |
| Product illustrations (shown until photos exist) | `components/art/Garment.tsx` |
| Loading screen (clothesline) | `components/Loader.tsx` |
| Logo | `public/logo.webp` (favicon: `app/icon.png`) |
| Size charts (Frock in inches, Jabla in cm) | `components/shop/SizeChart.tsx` |
| Email, Instagram, WhatsApp | `lib/store.ts` / `.env.local` |
| Age groups | `lib/store.ts` |
| Policy page wording (drafts) | `app/policies/[slug]/page.tsx` |
| Colours & fonts | `app/globals.css`, `app/layout.tsx` |

## Deploying

Needs Node.js hosting (Vercel, Railway, Render, a VPS) plus a Postgres database. Plain cPanel shared
hosting usually cannot run a Next.js server. Set the same env vars there, with `DATABASE_URL` pointing at
your Postgres.

On Vercel and Railway the site refuses to start without `DATABASE_URL` and `SESSION_SECRET`: the embedded
database would be wiped on every deploy, and the fallback secret is public in this repo.

### Railway

The live site runs on Railway (`soft-snuggle-production.up.railway.app`), deployed automatically from the
`suve` branch of `Magnertia-Inc/soft_snuggle`.

1. In the project, **+ Create → Database → PostgreSQL**. The service is named `Postgres`.
2. On the app service's **Variables**, add:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (Railway's private network; no SSL setting needed)
   - `SESSION_SECRET` = a long random value (`openssl rand -base64 32`)
   - `ADMIN_EMAILS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` for the admin panel
   - the WhatsApp, UPI and shipping values from `.env.example`
3. Redeploy. The first start creates the tables and loads the catalogue.

To work against the Railway database from your own computer, put the Postgres service's
`DATABASE_PUBLIC_URL` into `.env.local` with `?sslmode=no-verify` on the end. Railway's certificate is
self-signed, so `sslmode=require` fails. This is the live shop's data: anything you order or sign up
locally is real.
