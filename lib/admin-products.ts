import { getDb } from "./db";
import { productImages } from "./images";
import { isMediaUrl } from "./media";
import { toProduct, type ProductRow } from "./queries";
import { ageGroupsFor } from "./store";
import { CATEGORIES, type Category, type Product } from "./types";

// The product editor in the admin panel. Saving a product sets edited_at,
// which tells the catalogue sync (lib/db.ts) to stop overwriting it from
// lib/seed.ts, so the owner's prices and wording stick.

export class ProductError extends Error {}

/** Every product the owner can manage, hidden ones included, in shop order. */
export async function listAdminProducts(): Promise<Product[]> {
  const db = await getDb();
  const { rows } = await db.query<ProductRow>("SELECT * FROM products WHERE deleted_at IS NULL ORDER BY sort, id");
  return rows.map(toProduct);
}

export async function getAdminProduct(id: number): Promise<Product | null> {
  const db = await getDb();
  const { rows } = await db.query<ProductRow>("SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL", [id]);
  return rows[0] ? toProduct(rows[0]) : null;
}

export interface ProductInput {
  name: string;
  category: Category;
  price: number;
  compareAt: number | null;
  badge: string | null;
  fabric: string;
  colour: string;
  sizes: string[];
  description: string;
  care: string;
  organic: boolean;
  tint: string;
  garment: string;
  hidden: boolean;
  images: string[];
}

const HEX = /^#[0-9a-f]{6}$/i;

/** A photo that really is in public/products/<slug>, not just a path that looks like one. */
function isFolderPhoto(url: string) {
  const slug = url.match(/^\/products\/([a-z0-9-]+)\/[\w.-]+$/i)?.[1];
  return !!slug && productImages(slug).includes(url);
}

/** Checks and tidies what the editor sent. Throws ProductError with a message for the owner. */
export function cleanProductInput(raw: Record<string, unknown>): ProductInput {
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const money = (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v));

  const name = text(raw.name, 80);
  const category = raw.category as Category;
  const price = money(raw.price);
  const compareAt = money(raw.compareAt);
  const sizes = [...new Set((Array.isArray(raw.sizes) ? raw.sizes : []).map((s) => text(s, 20)).filter(Boolean))].slice(0, 12);
  const images = [...new Set((Array.isArray(raw.images) ? raw.images : []).filter((u): u is string => typeof u === "string"))];

  if (name.length < 2) throw new ProductError("Give the product a name.");
  if (!CATEGORIES.includes(category)) throw new ProductError("Pick a category.");
  if (price === null || !Number.isInteger(price) || price < 1 || price > 100000) {
    throw new ProductError("The price is a whole number of rupees, at least ₹1.");
  }
  if (compareAt !== null && (!Number.isInteger(compareAt) || compareAt <= price)) {
    throw new ProductError("The “was” price must be higher than the price, or left empty.");
  }
  if (!sizes.length) throw new ProductError("Tick at least one size.");
  if (images.length > 12) throw new ProductError("A product can have up to 12 photos.");
  if (images.some((u) => !isMediaUrl(u) && !isFolderPhoto(u))) {
    throw new ProductError("One of the photos isn't recognised. Remove it and upload it again.");
  }

  const tint = text(raw.tint, 7);
  const garment = text(raw.garment, 7);
  return {
    name,
    category,
    price,
    compareAt,
    badge: text(raw.badge, 24) || null,
    fabric: text(raw.fabric, 80),
    colour: text(raw.colour, 80),
    sizes,
    description: text(raw.description, 2000),
    care: text(raw.care, 600),
    organic: raw.organic === true,
    tint: HEX.test(tint) ? tint : "#E3EAE0",
    garment: HEX.test(garment) ? garment : "#F4EEE4",
    hidden: raw.hidden === true,
    images,
  };
}

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .slice(0, 60) || "product"
  );
}

/** Adds a product from the panel. Its web address comes from the name and never changes. */
export async function createProduct(input: ProductInput): Promise<Product> {
  const db = await getDb();
  const base = slugify(input.name);
  // Deleted products keep their row (and so their address), so those count as taken too.
  const { rows: taken } = await db.query<{ slug: string }>(
    "SELECT slug FROM products WHERE slug = $1 OR slug LIKE $2",
    [base, `${base}-%`],
  );
  const used = new Set(taken.map((r) => r.slug));
  let slug = base;
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;

  const { rows } = await db.query<ProductRow>(
    `INSERT INTO products
       (slug, name, category, fabric, colour, price, compare_at, badge, organic, sizes, age_groups,
        description, care, tint, garment, hidden, images, origin, edited_at, sort)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'admin',now(),
             (SELECT COALESCE(MAX(sort), 0) + 1 FROM products))
     RETURNING *`,
    [
      slug, input.name, input.category, input.fabric, input.colour, input.price, input.compareAt,
      input.badge, input.organic, input.sizes, ageGroupsFor(input.sizes), input.description, input.care,
      input.tint, input.garment, input.hidden, input.images,
    ],
  );
  return toProduct(rows[0]);
}

export async function updateProduct(id: number, input: ProductInput): Promise<Product> {
  const db = await getDb();
  const { rows: current } = await db.query<{ sold_out_sizes: string[] | null }>(
    "SELECT sold_out_sizes FROM products WHERE id = $1 AND deleted_at IS NULL",
    [id],
  );
  if (!current[0]) throw new ProductError("This product has been deleted.");
  // A size taken off the product can't stay marked sold out.
  const soldOut = (current[0].sold_out_sizes ?? []).filter((s) => input.sizes.includes(s));

  const { rows } = await db.query<ProductRow>(
    `UPDATE products SET
       name = $2, category = $3, fabric = $4, colour = $5, price = $6, compare_at = $7, badge = $8,
       organic = $9, sizes = $10, age_groups = $11, description = $12, care = $13, tint = $14,
       garment = $15, hidden = $16, images = $17, sold_out_sizes = $18, edited_at = now()
     WHERE id = $1
     RETURNING *`,
    [
      id, input.name, input.category, input.fabric, input.colour, input.price, input.compareAt, input.badge,
      input.organic, input.sizes, ageGroupsFor(input.sizes), input.description, input.care, input.tint,
      input.garment, input.hidden, input.images, soldOut,
    ],
  );
  return toProduct(rows[0]);
}

/** Shows or hides a product in the shop without opening the editor. */
export async function setProductHidden(id: number, hidden: boolean) {
  const db = await getDb();
  const { rows } = await db.query(
    "UPDATE products SET hidden = $2 WHERE id = $1 AND deleted_at IS NULL RETURNING id",
    [id, hidden],
  );
  if (!rows.length) throw new ProductError("This product has been deleted.");
}

/**
 * Takes a product out of the shop and the panel. The row is kept, marked
 * deleted, so lib/seed.ts can't add it back on the next start (the sync only
 * updates a row that exists, and never clears deleted_at). Saved-for-later
 * entries go with it.
 */
export async function deleteProduct(id: number) {
  const db = await getDb();
  await db.query(
    "UPDATE products SET deleted_at = now(), hidden = TRUE WHERE id = $1",
    [id],
  );
  await db.query("DELETE FROM wishlist WHERE product_id = $1", [id]);
}

/** Photos in public/products/<slug> that the editor can offer back after one is removed. */
export function folderPhotos(slug: string) {
  return productImages(slug);
}
