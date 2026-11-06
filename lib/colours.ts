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

// Every garment is sold in the seven colours. Gift packs are the exception:
// a pack holds several pieces and already names the shades inside, so one
// colour choice there would be a promise the pack cannot keep.
const WITHOUT_COLOURS: Product["category"][] = ["gift-set"];

export function coloursFor(p: Pick<Product, "slug" | "colour" | "garment" | "category">): ColourOption[] {
  if (OVERRIDES[p.slug]) return OVERRIDES[p.slug];
  return WITHOUT_COLOURS.includes(p.category) ? [] : RAINBOW;
}

/** The swatch a product opens on: its own colour when that is one of the seven. */
export function defaultColour(p: Pick<Product, "colour">, colours: ColourOption[]): ColourOption {
  const own = p.colour.toLowerCase();
  return colours.find((c) => own.startsWith(c.name.toLowerCase())) ?? colours[0];
}
