"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useLenis } from "lenis/react";
import { useEffect, useRef, useState } from "react";
import { defaultColour, RAINBOW, shadePicksFor } from "@/lib/colours";
import { isStudioShot } from "@/lib/photo";
import { CATEGORY_LABELS, STORE, inr, isSoldOut, shippingIsFree } from "@/lib/store";
import type { Product } from "@/lib/types";
import { FlowerMark } from "../art/FlowerMark";
import { Garment } from "../art/Garment";
import { QtyStepper } from "../CartDrawer";
import { useCart } from "../providers/CartProvider";
import { Lightbox } from "./Lightbox";
import { SaveButton } from "./SaveButton";
import { SizeChart } from "./SizeChart";

const VIEWS = ["Front", "Back", "Close-up"] as const;

export function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();
  const [view, setView] = useState<(typeof VIEWS)[number]>("Front");
  const [size, setSize] = useState<string | null>(null);
  const available = !isSoldOut(product);
  const [colour, setColour] = useState(() => defaultColour(product, product.colours));
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [needSize, setNeedSize] = useState(false);
  // Packs like the Day Pack: the customer picks which rainbow shades go inside
  const picks = shadePicksFor(product.slug);
  const [shades, setShades] = useState<string[]>([]);
  const [needShades, setNeedShades] = useState(false);
  const toggleShade = (name: string) =>
    setShades((s) => (s.includes(name) ? s.filter((x) => x !== name) : s.length < picks ? [...s, name] : s));
  const [openPanel, setOpenPanel] = useState<string | null>("details");
  // Phones: once the main "Add to bag" row scrolls away, a slim bar keeps it in reach
  const buyRef = useRef<HTMLDivElement>(null);
  const [buyVisible, setBuyVisible] = useState(true);
  const lenis = useLenis();
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setBuyVisible(e.isIntersecting || e.boundingClientRect.top > 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const photos = product.images;
  const [photo, setPhoto] = useState(0);
  // Where the cursor is over the photo, as percentages, so the zoom pushes
  // towards the part being looked at rather than the middle.
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const [full, setFull] = useState<number | null>(null);
  // A phone has no cursor to follow, so it gets the tap-to-open viewer only.
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setCanHover(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  // The frame takes the shape of the photo inside it, so a wide gift box does
  // not sit in a tall box with empty colour above and below it. The size is
  // read from a detached Image rather than an onLoad handler, because a photo
  // already in the browser cache finishes loading before React can listen.
  const [frameRatio, setFrameRatio] = useState(0.8);
  const current = photos[photo];
  useEffect(() => {
    if (!current) return;
    let live = true;
    const probe = new Image();
    const measure = () => {
      if (live && probe.naturalWidth && probe.naturalHeight) {
        setFrameRatio(Math.min(2, Math.max(0.6, probe.naturalWidth / probe.naturalHeight)));
      }
    };
    probe.onload = measure;
    probe.src = current;
    if (probe.complete) measure();
    return () => {
      live = false;
    };
  }, [current]);

  const pickColour = (c: (typeof product.colours)[number]) => {
    setColour(c);
    const i = c.image ? photos.indexOf(c.image) : -1;
    if (i >= 0) setPhoto(i);
  };

  const addToBag = () => {
    if (picks && shades.length !== picks) {
      setNeedShades(true);
      setTimeout(() => setNeedShades(false), 600);
      return;
    }
    if (!size) {
      setNeedSize(true);
      setTimeout(() => setNeedSize(false), 600);
      return;
    }
    add({
      productId: product.id, slug: product.slug, name: product.name, category: product.category,
      price: product.price, size, colour: picks ? shades.join(", ") : colour?.name, qty, tint: product.tint, garment: product.garment,
      image: colour?.image ?? photos[0],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const panels = [
    { key: "details", title: "The details", body: product.description },
    { key: "care", title: "Fabric & care", body: `${product.fabric}. ${product.care}` },
    {
      key: "delivery",
      title: "Delivery & exchanges",
      body: `${
        shippingIsFree
          ? "Free shipping on every order."
          : `Free shipping on orders over ${inr(STORE.freeShippingAbove)}, otherwise ${inr(STORE.shippingFlat)}.`
      } Ships in 1–2 days, arrives in 3–7 days across India. Wrong size? Easy size exchange within 7 days.`,
    },
  ];

  return (
    <section className="shell grid gap-8 pb-24 pt-28 sm:gap-10 sm:pt-32 lg:grid-cols-[minmax(0,30rem)_1fr] lg:gap-16">
      {/* Visual */}
      {/* Capped so the photo stays a product shot rather than growing to fill
          whatever width the screen offers. Full width on a phone, where the
          cap is wider than the screen anyway. */}
      <div className="mx-auto w-full max-w-[30rem] lg:sticky lg:top-28 lg:self-start">
        <div>
          <motion.div
            className={`relative overflow-hidden rounded-[2rem] ${photos.length > 0 ? "cursor-zoom-in" : "aspect-square"}`}
            style={{
              background: product.tint,
              ...(photos.length > 0 ? { aspectRatio: frameRatio } : {}),
            }}
            onMouseMove={
              canHover && photos.length > 0
                ? (e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setLens({
                      x: ((e.clientX - r.left) / r.width) * 100,
                      y: ((e.clientY - r.top) / r.height) * 100,
                    });
                  }
                : undefined
            }
            onMouseLeave={() => setLens(null)}
            onClick={photos.length > 0 ? () => setFull(photo) : undefined}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {photos.length > 0 ? (
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.img
                  key={photos[photo]}
                  src={photos[photo]}
                  alt={product.name}
                  className={`absolute inset-0 h-full w-full object-cover transition-transform duration-200 ease-out ${isStudioShot(photos[photo]) ? "mix-blend-multiply" : ""}`}
                  style={{
                    transformOrigin: lens ? `${lens.x}% ${lens.y}%` : "center",
                    transform: lens ? "scale(2.2)" : "scale(1)",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  draggable={false}
                />
              </AnimatePresence>
            ) : (
              <>
              <div className="absolute inset-[15%] rounded-full bg-paper/50 blur-3xl" />
              {[["10%", "14%"], ["82%", "18%"], ["14%", "80%"]].map(([l, t], i) => (
                <div key={i} className="anim-float absolute" style={{ left: l, top: t, animationDelay: `${i}s` }}>
                  <FlowerMark className="h-6 w-6 opacity-60" petal="#FDFBF6" />
                </div>
              ))}
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  className="absolute inset-0 grid place-items-center"
                  initial={{ opacity: 0, rotateY: view === "Back" ? -90 : 0, scale: 0.9 }}
                  animate={{ opacity: 1, rotateY: 0, scale: view === "Close-up" ? 1.9 : 1 }}
                  exit={{ opacity: 0, rotateY: view === "Front" ? 90 : 0, scale: 0.9 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="anim-float h-[78%] w-[78%]">
                    <Garment category={product.category} color={product.garment} back={view === "Back"} className="h-full w-full" />
                  </div>
                </motion.div>
              </AnimatePresence>
                </>
            )}
            {photos.length > 0 && !lens && (
              <span className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-paper/90 px-3 py-1.5 text-[0.6875rem] font-bold text-ink shadow-sm backdrop-blur">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5M11 8.5v5M8.5 11h5" />
                </svg>
                <span className="hidden sm:inline">Hover to zoom · click to enlarge</span>
                <span className="sm:hidden">Tap to enlarge</span>
              </span>
            )}
            {product.badge && (
              <span className="absolute left-5 top-5 rounded-full bg-paper px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em]">
                {product.badge}
              </span>
            )}
          </motion.div>
        </div>
        {photos.length === 1 ? null : photos.length > 1 ? (
          <div className="mt-4 flex justify-center gap-2">
            {photos.map((src, i) => (
              <button
                key={src}
                onClick={() => setPhoto(i)}
                className={`h-20 w-16 overflow-hidden rounded-2xl border-2 transition-all ${
                  i === photo ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"
                }`}
                style={{ background: product.tint }}
                aria-label={`Photo ${i + 1}`}
              >
                <img src={src} alt="" className={`h-full w-full object-cover ${isStudioShot(src) ? "mix-blend-multiply" : ""}`} />
              </button>
            ))}
          </div>
        ) : (
          <>
          <LayoutGroup id="views">
            <div className="mt-4 flex justify-center gap-2">
              {VIEWS.map((v) => (
                <button key={v} onClick={() => setView(v)} className="relative rounded-full px-4 py-2 text-sm font-bold">
                  {view === v && <motion.span layoutId="view-pill" className="absolute inset-0 rounded-full bg-paper shadow-sm" />}
                  <span className="relative">{v}</span>
                </button>
              ))}
            </div>
          </LayoutGroup>
          <p className="mt-2 text-center text-xs text-ink-soft">Illustration shown · product photos coming soon</p>
            </>
        )}
        <Lightbox
          photos={photos}
          index={full}
          onIndex={(i) => {
            setFull(i);
            setPhoto(i);
          }}
          onClose={() => setFull(null)}
          alt={product.name}
        />
      </div>

      {/* Info */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <nav className="text-sm text-ink-soft">
          <Link href="/shop" className="hover:text-ink">Shop</Link> /{" "}
          <Link href={`/shop?category=${product.category}`} className="hover:text-ink">
            {CATEGORY_LABELS[product.category]}
          </Link>
        </nav>
        <h1 className="mt-3 font-display text-4xl leading-[1.04] tracking-tight sm:text-6xl">{product.name}</h1>
        <p className="mt-3 text-base text-ink-soft sm:text-lg">
          {product.fabric} · {product.colour}
          {product.organic && <span className="ml-2 rounded-full bg-sage px-2.5 py-0.5 text-xs font-extrabold text-ink">✿ Organic</span>}
        </p>
        <p className="mt-3 font-display text-[1.75rem] sm:mt-5 sm:text-4xl">
          {inr(product.price)}
          {product.compareAt && <s className="ml-3 text-xl text-ink-soft">{inr(product.compareAt)}</s>}
        </p>

        {picks > 0 && (
          <div className="mt-6 sm:mt-8">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em]">
              Pick {picks} shades{" "}
              <span className={`ml-2 font-bold normal-case tracking-normal ${needShades ? "text-rose" : "text-ink-soft"}`}>
                {shades.length ? `${shades.join(", ")} (${shades.length} of ${picks})` : `0 of ${picks} chosen`}
              </span>
            </p>
            <motion.div
              className="mt-3 flex flex-wrap gap-1"
              role="group"
              aria-label={`Choose ${picks} shades`}
              animate={needShades ? { x: [0, -10, 10, -6, 6, 0] } : {}}
              transition={{ duration: 0.45 }}
            >
              {RAINBOW.map((c) => {
                const on = shades.includes(c.name);
                const full = !on && shades.length >= picks;
                return (
                  <button
                    key={c.name}
                    type="button"
                    aria-pressed={on}
                    aria-label={c.name}
                    title={c.name}
                    onClick={() => toggleShade(c.name)}
                    className={`grid h-9 w-9 place-items-center rounded-full outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ink/40 sm:h-11 sm:w-11 ${full ? "opacity-40" : ""}`}
                  >
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-sm font-extrabold text-ink transition-shadow ${
                        on ? "ring-2 ring-ink ring-offset-2 ring-offset-cream" : ""
                      }`}
                      style={{ background: c.hex }}
                    >
                      {on ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </div>
        )}

        {product.colours.length > 1 && colour && (
          <div className="mt-6 sm:mt-8">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em]">
              Colour <span className="ml-2 font-bold normal-case tracking-normal text-ink-soft">{colour.name}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-1" role="radiogroup" aria-label="Colour">
              {product.colours.map((c) => {
                const on = c.name === colour.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={c.name}
                    title={c.name}
                    onClick={() => pickColour(c)}
                    className="grid h-9 w-9 place-items-center rounded-full outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ink/40 sm:h-11 sm:w-11"
                  >
                    <span
                      className={`block h-9 w-9 rounded-full border border-ink/15 transition-shadow ${
                        on ? "ring-2 ring-ink ring-offset-2 ring-offset-cream" : ""
                      }`}
                      style={{ background: c.hex }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 sm:mt-8">
          <div className="flex items-center justify-between">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em]">Size</p>
            {product.category !== "nappy" && product.category !== "set" && (
              <button onClick={() => setOpenPanel(openPanel === "guide" ? null : "guide")} className="text-sm font-bold underline underline-offset-4">
                Size guide
              </button>
            )}
          </div>
          <motion.div
            className="mt-3 grid grid-cols-4 gap-2 sm:flex sm:flex-wrap"
            animate={needSize ? { x: [0, -10, 10, -6, 6, 0] } : {}}
            transition={{ duration: 0.45 }}
          >
            <LayoutGroup id="sizes">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  disabled={product.soldOutSizes.includes(s)}
                  title={product.soldOutSizes.includes(s) ? "Sold out" : undefined}
                  className={`relative rounded-2xl border px-2 py-2.5 text-sm font-bold transition-colors disabled:border-dashed disabled:bg-transparent disabled:text-ink-soft/60 disabled:line-through sm:min-w-20 sm:px-4 sm:py-3 sm:text-base ${
                    size === s ? "border-ink text-paper" : needSize ? "border-rose" : "border-line bg-paper hover:border-ink/40"
                  }`}
                >
                  {size === s && <motion.span layoutId="size-pill" className="absolute inset-0 rounded-2xl bg-ink" />}
                  <span className="relative">{s}</span>
                </button>
              ))}
            </LayoutGroup>
          </motion.div>
          <AnimatePresence>
            {openPanel === "guide" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <SizeChart highlight={size} initial={product.category === "jabla" ? "jabla" : "frock"} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={buyRef} className="mt-6 flex items-center gap-3 sm:mt-8">
          <QtyStepper value={qty} onChange={(v) => setQty(Math.max(1, v))} />
          <motion.button
            onClick={addToBag}
            disabled={!available}
            whileTap={{ scale: 0.97 }}
            className={`btn-primary flex-1 py-3.5 text-[0.9375rem] sm:py-4 sm:text-base ${added ? "!bg-sage-deep" : ""}`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={added ? "added" : size ? "add" : "pick"}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {!available ? "Sold out" : added ? "Added to bag ✓" : size ? `Add to bag · ${inr(product.price * qty)}` : "Select a size"}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>

        <SaveButton
          productId={product.id}
          label
          className="mt-4 w-full rounded-2xl border border-line bg-paper py-3.5 text-ink hover:border-ink/40"
        />

        <ul className="mt-5 grid grid-cols-2 gap-2 text-xs text-ink-soft sm:mt-6 sm:text-sm">
          {["🕒 24×7 ordering", shippingIsFree ? "🚚 Free delivery" : "🚚 Free over " + inr(STORE.freeShippingAbove), "💵 Cash on Delivery", "🔁 Easy size exchange"].map((t) => (
            <li key={t} className="rounded-2xl bg-paper px-2.5 py-2.5 font-semibold sm:px-4 sm:py-3">{t}</li>
          ))}
        </ul>

        <div className="mt-6 divide-y divide-line border-y border-line sm:mt-8">
          {panels.map((p) => (
            <div key={p.key}>
              <button
                onClick={() => setOpenPanel(openPanel === p.key ? null : p.key)}
                className="flex w-full items-center justify-between py-4 text-left font-display text-lg sm:py-5 sm:text-xl"
              >
                {p.title}
                <motion.span animate={{ rotate: openPanel === p.key ? 45 : 0 }} className="text-2xl">+</motion.span>
              </button>
              <AnimatePresence initial={false}>
                {openPanel === p.key && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pb-5 leading-relaxed text-ink-soft"
                  >
                    {p.body}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {!buyVisible && available && (
          <motion.div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_30px_-18px_rgba(38,59,54,0.5)] backdrop-blur-md lg:hidden"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
          >
            <div className="mx-auto flex max-w-xl items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base leading-tight">{product.name}</p>
                <p className="text-sm font-bold">
                  {inr(product.price)}
                  {size && <span className="ml-1.5 font-semibold text-ink-soft">· {size}</span>}
                </p>
              </div>
              <button
                onClick={() => (size ? addToBag() : buyRef.current && (lenis ? lenis.scrollTo(buyRef.current, { offset: -240 }) : buyRef.current.scrollIntoView({ block: "center" })))}
                className={`btn-primary shrink-0 px-5 py-3 text-sm ${added ? "!bg-sage-deep" : ""}`}
              >
                {added ? "Added ✓" : size ? "Add to bag" : "Choose size"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
