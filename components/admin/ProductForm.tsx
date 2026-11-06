"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CATEGORY_LABELS, STANDARD_SIZES, inr } from "@/lib/store";
import { CATEGORIES, type Category, type Product } from "@/lib/types";

interface Fields {
  name: string;
  category: Category;
  price: string;
  compareAt: string;
  badge: string;
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

const BLANK: Fields = {
  name: "",
  category: "frock",
  price: "",
  compareAt: "",
  badge: "New",
  fabric: "100% cotton",
  colour: "",
  sizes: [...STANDARD_SIZES],
  description: "",
  care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
  organic: false,
  tint: "#E3EAE0",
  garment: "#F4EEE4",
  // A new piece starts hidden, so it can be checked before shoppers see it.
  hidden: true,
  images: [],
};

const fromProduct = (p: Product): Fields => ({
  name: p.name,
  category: p.category,
  price: String(p.price),
  compareAt: p.compareAt ? String(p.compareAt) : "",
  badge: p.badge ?? "",
  fabric: p.fabric,
  colour: p.colour,
  sizes: p.sizes,
  description: p.description,
  care: p.care,
  organic: p.organic,
  tint: p.tint,
  garment: p.garment,
  hidden: p.hidden,
  images: p.images,
});

/**
 * Adds or edits one product. `folderPhotos` are the photos that ship with the
 * site for this product, offered back if the owner removes one by mistake.
 */
export function ProductForm({ product, folderPhotos = [] }: { product: Product | null; folderPhotos?: string[] }) {
  const router = useRouter();
  const [f, setF] = useState<Fields>(product ? fromProduct(product) : BLANK);
  const [newSize, setNewSize] = useState("");
  const [uploading, setUploading] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    setNotice(null);
  };
  const text = (k: "name" | "price" | "compareAt" | "badge" | "fabric" | "colour" | "description" | "care") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value);

  const toggleSize = (s: string) =>
    set("sizes", f.sizes.includes(s) ? f.sizes.filter((x) => x !== s) : [...f.sizes, s]);
  const addSize = () => {
    const s = newSize.trim();
    if (s && !f.sizes.includes(s)) set("sizes", [...f.sizes, s]);
    setNewSize("");
  };
  // Standard sizes first, youngest to oldest, then any others in the order they were added.
  const orderedSizes = [
    ...STANDARD_SIZES.filter((s) => f.sizes.includes(s)),
    ...f.sizes.filter((s) => !STANDARD_SIZES.includes(s)),
  ];

  const move = (i: number, by: number) => {
    const next = [...f.images];
    const [img] = next.splice(i, 1);
    next.splice(Math.max(0, Math.min(next.length, i + by)), 0, img);
    set("images", next);
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const list = [...files];
    setUploading(list.length);
    const added: string[] = [];
    for (const file of list) {
      try {
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/admin/media", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "That photo didn't upload.");
        added.push(data.url);
        setF((x) => ({ ...x, images: [...x.images, data.url] }));
      } catch (err) {
        setError(`${file.name}: ${err instanceof Error ? err.message : "didn't upload."}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileInput.current) fileInput.current.value = "";
    if (added.length) setNotice(`${added.length} photo${added.length === 1 ? "" : "s"} added. Press Save to keep ${added.length === 1 ? "it" : "them"}.`);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
        method: product ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...f, sizes: orderedSizes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "That didn't save.");
      if (!product) {
        router.push(`/admin/products/${data.product.id}?added=1`);
        return;
      }
      setF(fromProduct(data.product));
      setNotice(data.product.hidden ? "Saved. It's hidden, so shoppers can't see it yet." : "Saved. The shop shows the change now.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't save.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!product) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "That didn't delete.");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't delete.");
      setSaving(false);
    }
  };

  const missingFolderPhotos = folderPhotos.filter((u) => !f.images.includes(u));
  const price = Number(f.price);
  const card = "rounded-[1.5rem] border border-line bg-paper p-5 sm:p-6";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="pb-28"
    >
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <section className={card}>
            <h2 className="font-display text-2xl">Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Name" className="sm:col-span-2">
                <input className="field" required maxLength={80} value={f.name} onChange={text("name")} placeholder="e.g. Lemon Grove Frock" />
              </Field>
              <Field label="Category">
                <select className="field" value={f.category} onChange={(e) => set("category", e.target.value as Category)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Badge (optional)" hint="A short tag on the photo, like New or Best value.">
                <input className="field" maxLength={24} value={f.badge} onChange={text("badge")} />
              </Field>
              <Field label="Fabric">
                <input className="field" maxLength={80} value={f.fabric} onChange={text("fabric")} />
              </Field>
              <Field label="Colour / print">
                <input className="field" maxLength={80} value={f.colour} onChange={text("colour")} placeholder="e.g. Ivory, lemon print" />
              </Field>
              <Field label="Description" className="sm:col-span-2">
                <textarea className="field min-h-32" maxLength={2000} value={f.description} onChange={text("description")} />
              </Field>
              <Field label="Care" className="sm:col-span-2">
                <textarea className="field min-h-20" maxLength={600} value={f.care} onChange={text("care")} />
              </Field>
              <label className="flex items-center gap-2.5 text-sm font-bold sm:col-span-2">
                <input type="checkbox" className="h-4 w-4 accent-[#263B36]" checked={f.organic} onChange={(e) => set("organic", e.target.checked)} />
                Organic cotton
              </label>
            </div>
          </section>

          <section className={card}>
            <h2 className="font-display text-2xl">Price</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Price (₹)">
                <input className="field" required inputMode="numeric" pattern="[0-9]*" value={f.price}
                  onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} />
              </Field>
              <Field label="“Was” price (₹, optional)" hint="Shown crossed out next to the price, for a sale.">
                <input className="field" inputMode="numeric" pattern="[0-9]*" value={f.compareAt}
                  onChange={(e) => set("compareAt", e.target.value.replace(/\D/g, ""))} />
              </Field>
            </div>
            {price > 0 && (
              <p className="mt-3 text-sm text-ink-soft">
                Shoppers see <b className="text-ink">{inr(price)}</b>
                {Number(f.compareAt) > price && (
                  <> <s>{inr(Number(f.compareAt))}</s> ({Math.round((1 - price / Number(f.compareAt)) * 100)}% off)</>
                )}
              </p>
            )}
          </section>

          <section className={card}>
            <h2 className="font-display text-2xl">Sizes</h2>
            <p className="mt-1 text-sm text-ink-soft">Tick the sizes this piece is made in. To mark one sold out, use the Products page.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[...STANDARD_SIZES, ...f.sizes.filter((s) => !STANDARD_SIZES.includes(s))].map((s) => {
                const on = f.sizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    aria-pressed={on}
                    className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                      on ? "border-sage-deep bg-sage" : "border-line bg-paper text-ink-soft"
                    }`}
                  >
                    {on ? "✓ " : ""}{s}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex max-w-sm gap-2">
              <input
                className="field"
                maxLength={20}
                value={newSize}
                placeholder="Another size, e.g. 12–18M"
                onChange={(e) => setNewSize(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSize();
                  }
                }}
              />
              <button type="button" onClick={addSize} disabled={!newSize.trim()} className="btn-ghost shrink-0 px-4 disabled:opacity-50">Add</button>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className={card}>
            <h2 className="font-display text-2xl">In the shop</h2>
            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[#263B36]" checked={!f.hidden} onChange={(e) => set("hidden", !e.target.checked)} />
              <span>
                <span className="block font-bold">Show in the shop</span>
                <span className="block text-sm text-ink-soft">
                  {f.hidden ? "Hidden: only you can see it, here in the admin panel." : "Shoppers can see and buy it."}
                </span>
              </span>
            </label>
            {product && !product.hidden && (
              <a href={`/product/${product.slug}`} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold underline underline-offset-4">
                View in shop ↗
              </a>
            )}
          </section>

          <section className={card}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl">Photos</h2>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading > 0 || f.images.length >= 12}
                className="btn-ghost px-4 py-2 text-sm disabled:opacity-50"
              >
                {uploading ? `Uploading ${uploading}…` : "+ Upload"}
              </button>
              <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              The first photo is the one on the shop card. Photos on a white background look best. Up to 12.
            </p>

            {f.images.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-cream px-4 py-6 text-center text-sm text-ink-soft">
                No photos yet. The shop shows a drawing of the garment until you add some.
              </p>
            ) : (
              <ul className="mt-4 grid grid-cols-3 gap-3">
                {f.images.map((src, i) => (
                  <li key={src} className="group relative">
                    <div className="aspect-[4/5] overflow-hidden rounded-xl border border-line" style={{ background: f.tint }}>
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </div>
                    {i === 0 && (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-ink px-2 py-0.5 text-[0.625rem] font-extrabold text-paper">Cover</span>
                    )}
                    <div className="mt-1 flex justify-between text-xs font-bold">
                      <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move earlier" className="px-1.5 disabled:opacity-30">←</button>
                      <button type="button" onClick={() => set("images", f.images.filter((x) => x !== src))} className="text-[#a0573f] underline underline-offset-2">
                        Remove
                      </button>
                      <button type="button" disabled={i === f.images.length - 1} onClick={() => move(i, 1)} aria-label="Move later" className="px-1.5 disabled:opacity-30">→</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {missingFolderPhotos.length > 0 && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="text-sm font-bold">Other photos of this piece</p>
                <p className="text-xs text-ink-soft">Tap one to add it back.</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {missingFolderPhotos.map((src) => (
                    <li key={src}>
                      <button
                        type="button"
                        onClick={() => set("images", [...f.images, src])}
                        title="Put this photo back"
                        className="relative block h-16 w-14 overflow-hidden rounded-lg border border-line opacity-70 hover:opacity-100"
                        style={{ background: f.tint }}
                      >
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        <span className="absolute inset-x-0 bottom-0 bg-ink/80 text-[0.625rem] font-bold text-paper">+ Add</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className={card}>
            <h2 className="font-display text-2xl">Card colours</h2>
            <p className="mt-1 text-sm text-ink-soft">The soft background behind the photo, and the colour of the drawing used when there are no photos.</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <ColourField label="Background" value={f.tint} onChange={(v) => set("tint", v)} />
              <ColourField label="Drawing" value={f.garment} onChange={(v) => set("garment", v)} />
            </div>
          </section>

          {product && (
            <section className={card}>
              <h2 className="font-display text-2xl">Delete</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Takes it out of the shop and this list for good. Past orders keep their own copy of what was bought.
                To take it off sale for a while, untick “Show in the shop” instead.
              </p>
              {confirmDelete ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={remove} disabled={saving} className="rounded-full bg-[#a0573f] px-4 py-2 text-sm font-bold text-paper disabled:opacity-60">
                    Yes, delete {product.name}
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="btn-ghost px-4 py-2 text-sm">Keep it</button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="mt-3 text-sm font-bold text-[#a0573f] underline underline-offset-4">
                  Delete this product
                </button>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Save bar, always in reach on a long form. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1 text-sm" aria-live="polite">
            {error ? (
              <p role="alert" className="font-bold text-[#a0573f]">{error}</p>
            ) : notice ? (
              <p className="font-bold text-sage-deep">{notice}</p>
            ) : (
              <p className="text-ink-soft">{product ? `Editing ${product.name}` : "New product"}</p>
            )}
          </div>
          <Link href="/admin/products" className="btn-ghost px-5 py-2.5 text-sm">Back</Link>
          <button type="submit" disabled={saving || uploading > 0} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-60">
            {saving ? "Saving…" : product ? "Save changes" : "Add product"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-sm font-bold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

function ColourField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-3">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-paper p-1" />
      <span>
        <span className="block text-sm font-bold">{label}</span>
        <span className="block font-mono text-xs text-ink-soft">{value}</span>
      </span>
    </label>
  );
}
