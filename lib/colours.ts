import type { ColourOption, Product } from "./types";

// Colour choices shown as round swatches on every product page.
//
// RAINBOW is the seven-colour set, kept in rainbow order so the swatches read
// left to right as a rainbow. Add `image` (a path under /public) to any colour
// and picking it switches the main photo, e.g.
//   { name: "Cherry Red", hex: "#DE6B63", image: "/products/cherry-frock/1-red.webp" }
//
// OVERRIDES gives one product (by slug) its own list instead of the seven.
//
// Colour names are stored with every cart item and past order, so renaming one
// changes what old orders read. Add and remove freely; rename sparingly.

export const RAINBOW: ColourOption[] = [
  { name: "Cherry Red", hex: "#DE6B63" },
  { name: "Apricot Orange", hex: "#F2A86B" },
  { name: "Butter Yellow", hex: "#F3E3A3" },
  { name: "Leaf Green", hex: "#A8C9A0" },
  { name: "Sky Blue", hex: "#9FC4E0" },
  { name: "Periwinkle Indigo", hex: "#8E96C9" },
  { name: "Lilac Violet", hex: "#C4A5D1" },
];

const OVERRIDES: Record<string, ColourOption[]> = {
  // "cherry-jabla": [
  //   { name: "Butter Yellow", hex: "#F3E3A3", image: "/products/cherry-jabla/1-front.webp" },
  //   { name: "Cherry Red", hex: "#DE6B63", image: "/products/cherry-jabla/1-red.webp" },
  // ],
};

// Each printed piece is made in one colourway only, so by default a product
// offers no colour choice and the picker stays hidden. A product that really
// is made in several shades gets its own list in OVERRIDES above (ideally with
// a photo per shade), and only then does the picker appear.
export function coloursFor(p: Pick<Product, "slug" | "colour" | "garment" | "category">): ColourOption[] {
  return OVERRIDES[p.slug] ?? [];
}

// Packs where the customer chooses which rainbow shades go in the box, and
// how many. The choice is saved on the order as "Cherry Red, Sky Blue, ...".
const SHADE_PICKS: Record<string, number> = { "day-pack": 3 };

/** How many rainbow shades the customer picks for this product (0 = none). */
export function shadePicksFor(slug: string): number {
  return SHADE_PICKS[slug] ?? 0;
}

/** Checks a saved shade choice ("A, B, C") for a pack; returns it tidied, or null if invalid. */
export function checkShadePicks(slug: string, value: string | undefined): string | null {
  const need = shadePicksFor(slug);
  if (!need || !value) return null;
  const names = value.split(",").map((s) => s.trim()).filter(Boolean);
  const valid = new Set(RAINBOW.map((c) => c.name));
  if (names.length !== need || new Set(names).size !== need || names.some((n) => !valid.has(n))) return null;
  return names.join(", ");
}

/** The swatch a product opens on: its own colour when that is one of the seven. */
export function defaultColour(p: Pick<Product, "colour">, colours: ColourOption[]): ColourOption | undefined {
  const own = p.colour.toLowerCase();
  return colours.find((c) => own.startsWith(c.name.toLowerCase())) ?? colours[0];
}
