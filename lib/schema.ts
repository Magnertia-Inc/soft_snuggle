import { CATEGORIES } from "./types";

const CATEGORY_LIST = CATEGORIES.map((c) => `'${c}'`).join(", ");
// The old guard looked for one word, so once 'jabla' was in the constraint it
// never ran again and later categories never reached the database. Checking
// every category means the constraint rebuilds itself whenever the list grows.
const CATEGORY_GUARD = CATEGORIES.map(
  (c) => `pg_get_constraintdef(oid) LIKE '%''${c}''%'`,
).join("\n      AND ");

// Runs on every server start. Every statement is idempotent, so it is safe
// against both the embedded database and a real PostgreSQL server.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS products (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  fabric        TEXT NOT NULL,
  colour        TEXT NOT NULL,
  price         INTEGER NOT NULL CHECK (price >= 0),
  compare_at    INTEGER,
  badge         TEXT,
  organic       BOOLEAN NOT NULL DEFAULT FALSE,
  sizes         TEXT[] NOT NULL DEFAULT '{}',
  age_groups    TEXT[] NOT NULL DEFAULT '{}',
  description   TEXT NOT NULL DEFAULT '',
  care          TEXT NOT NULL DEFAULT '',
  tint          TEXT NOT NULL DEFAULT '#E3EAE0',
  garment       TEXT NOT NULL DEFAULT '#F4EEE4',
  in_stock      BOOLEAN NOT NULL DEFAULT TRUE,
  sort          INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allowed categories, rebuilt from lib/types.ts whenever the stored constraint
-- is missing any of them, so a new category reaches an existing database.
-- Only rewritten when out of date, so parallel server starts don't race each other.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_category_check'
      AND ${CATEGORY_GUARD}
  ) THEN
    ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
    ALTER TABLE products ADD CONSTRAINT products_category_check
      CHECK (category IN (${CATEGORY_LIST}));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  code            TEXT GENERATED ALWAYS AS ('SS-' || (id + 1000)::text) STORED,
  access_key      TEXT NOT NULL,
  customer_name   TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  address         TEXT NOT NULL,
  city            TEXT NOT NULL,
  state           TEXT NOT NULL,
  pincode         TEXT NOT NULL,
  items           JSONB NOT NULL,
  subtotal        INTEGER NOT NULL,
  shipping        INTEGER NOT NULL,
  total           INTEGER NOT NULL,
  payment_method  TEXT NOT NULL CHECK (payment_method IN ('upi', 'cod')),
  payment_status  TEXT NOT NULL DEFAULT 'pending',
  utr             TEXT,
  status          TEXT NOT NULL DEFAULT 'new',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS orders_code_idx ON orders (code);

-- Delivery tracking, filled in by the owner as the order moves.
-- status: new → confirmed → packed → shipped → out_for_delivery → delivered (or cancelled)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier         TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url    TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at    TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at      TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at    TIMESTAMPTZ;

-- Shoppers with an account. Guests order without one, so this is optional:
-- orders keep their own name, phone and address whatever happens here.
CREATE TABLE IF NOT EXISTS customers (
  id            SERIAL PRIMARY KEY,
  phone         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  email         TEXT,
  password_hash TEXT NOT NULL,
  address       TEXT,
  city          TEXT,
  state         TEXT,
  pincode       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

-- Saved pieces. One row per customer and product, so saving twice is harmless.
CREATE TABLE IF NOT EXISTS wishlist (
  customer_id  INTEGER NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
  product_id   INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, product_id)
);

-- Orders remember who placed them when the shopper was signed in. Guest orders
-- leave this empty and are claimed later by matching phone number.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders (customer_id);
CREATE INDEX IF NOT EXISTS orders_phone_idx ON orders (phone);

-- Sizes the owner marks sold out in the admin panel. Like in_stock, the
-- catalogue sync leaves this alone, so it survives a deploy.
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_out_sizes TEXT[] NOT NULL DEFAULT '{}';

-- Everything that happened to an order and who did it: placed, UTR sent,
-- confirmed, shipped, notes. The admin order page shows it as the history.
CREATE TABLE IF NOT EXISTS order_events (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,
  note        TEXT,
  actor       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_events_order_idx ON order_events (order_id, id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);

-- The admin panel's product editor. A product the owner has saved there has
-- edited_at set, and from then on the catalogue sync leaves it alone, so a
-- deploy never undoes a price change. origin says where a product came from:
-- 'seed' (lib/seed.ts) or 'admin' (added in the panel). hidden keeps a piece
-- out of the shop without losing it; deleted_at takes it out of the panel too,
-- and the row stays so lib/seed.ts can't bring it back on the next start.
-- images is the owner's own photo list; empty means the photos in
-- public/products/<slug> are used.
ALTER TABLE products ADD COLUMN IF NOT EXISTS edited_at  TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS origin     TEXT NOT NULL DEFAULT 'seed';
ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images     TEXT[];

-- Photos uploaded in the admin panel, kept in the database so they survive a
-- deploy and are backed up with everything else. Served at /media/p-<id>.webp.
CREATE TABLE IF NOT EXISTS media (
  id          SERIAL PRIMARY KEY,
  mime        TEXT NOT NULL,
  data        BYTEA NOT NULL,
  width       INTEGER,
  height      INTEGER,
  bytes       INTEGER NOT NULL,
  uploaded_by TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Discount codes. code is stored in capitals and matched without regard to
-- case. used_count goes up when an order is placed with the code and down
-- again if that order is cancelled.
CREATE TABLE IF NOT EXISTS coupons (
  id             SERIAL PRIMARY KEY,
  code           TEXT UNIQUE NOT NULL,
  kind           TEXT NOT NULL CHECK (kind IN ('percent', 'flat')),
  value          INTEGER NOT NULL CHECK (value > 0),
  min_order      INTEGER NOT NULL DEFAULT 0,
  max_discount   INTEGER,
  expires_at     TIMESTAMPTZ,
  max_uses       INTEGER,
  once_per_phone BOOLEAN NOT NULL DEFAULT FALSE,
  used_count     INTEGER NOT NULL DEFAULT 0,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_by     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount    INTEGER NOT NULL DEFAULT 0;

-- Google sign-in. google_sub is Google's id for the person (it never changes,
-- unlike their email). A Google-only account has no password.
ALTER TABLE customers ADD COLUMN IF NOT EXISTS google_sub TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS customers_google_idx ON customers (google_sub);
ALTER TABLE customers ALTER COLUMN password_hash DROP NOT NULL;

-- A number is verified once an order the account placed is confirmed after its
-- WhatsApp message reached the shop: the message came from that phone, so
-- whoever holds the account holds the number. Only then are guest orders from
-- the same number added to the account.
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_at TIMESTAMPTZ;

-- Google sign-in. google_sub is Google's id for the person (it never changes,
-- unlike their email). A Google-only account has no password.
ALTER TABLE customers ADD COLUMN IF NOT EXISTS google_sub TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS customers_google_idx ON customers (google_sub);
ALTER TABLE customers ALTER COLUMN password_hash DROP NOT NULL;

-- A number is verified once an order the account placed is confirmed after
-- its WhatsApp message reached the shop: the message came from that phone, so
-- whoever holds the account holds the number. Only then are guest orders from
-- the same number added to the account.
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_at TIMESTAMPTZ;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_fee INTEGER NOT NULL DEFAULT 0;
`;
