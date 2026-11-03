import type { BabyLook } from "@/components/art/Baby";

export interface Collection {
  slug: string;
  productSlug: string;
  eyebrow: string;
  title: string;
  accent: string;
  label: string;
  blurb: string;
  glow: string;
  look: BabyLook;
}

// One slide per piece in the shop. Every productSlug here must exist in
// lib/seed.ts: a slide pointing at a retired piece sends shoppers to a missing
// page, which is how the demo catalogue used to break this hero.
//
// A photo at public/hero/<slug>.(png|webp) replaces the drawing for that slide.
export const COLLECTIONS: Collection[] = [
  {
    slug: "lemon",
    productSlug: "lemon-frock",
    eyebrow: "New in",
    title: "Lemon",
    accent: "Grove",
    label: "Lemon Grove Frock",
    blurb: "Watercolour lemons across airy crinkled muslin, with snaps down the front and a skirt that swings.",
    glow: "#F7F3E0",
    look: {
      skin: "#E8BE9C", hair: "#3A2A1E", hairStyle: "curls", outfit: "#F6F1E2",
      kind: "bodysuit", detail: "flower", accessory: "bow", accessoryColor: "#F2DE9A", prop: "none",
    },
  },
  {
    slug: "zebra",
    productSlug: "zebra-jabla",
    eyebrow: "New in",
    title: "Zebra",
    accent: "Doodle",
    label: "Zebra Doodle Jabla",
    blurb: "One hand-drawn zebra on soft ivory muslin, tied at the back of the neck for easy changes.",
    glow: "#F1EDE5",
    look: {
      skin: "#D9A47F", hair: "#2F2420", hairStyle: "tuft", outfit: "#F6F3EC",
      kind: "bodysuit", detail: "dots", accessory: "none", prop: "star",
    },
  },
  {
    slug: "butterfly",
    productSlug: "butterfly-nappy",
    eyebrow: "New in",
    title: "Butterfly",
    accent: "Flutter",
    label: "Butterfly Print Muslin Baby Nappy Cover",
    blurb: "A tie-up muslin nappy scattered with butterflies and hearts, with long ties for a fit you set yourself.",
    glow: "#F6EFE6",
    look: {
      skin: "#F6D5BE", hair: "#B98955", hairStyle: "tuft", outfit: "#F7F3EA",
      kind: "bodysuit", detail: "flower", accessory: "bow", accessoryColor: "#E86A9B", prop: "none",
    },
  },
  {
    slug: "zebra-wrap",
    productSlug: "zebra-wrap-jabla",
    eyebrow: "New in",
    title: "Zebra",
    accent: "Wrap",
    label: "Muslin Zebra Wrap Vest",
    blurb: "A crossover wrap jabla in white muslin with braided side ties, so nothing has to go over the head.",
    glow: "#F3F0EA",
    look: {
      skin: "#E8BE9C", hair: "#2F2420", hairStyle: "curls", outfit: "#FBFAF7",
      kind: "bodysuit", detail: "dots", accessory: "none", prop: "none",
    },
  },
  {
    slug: "peaks",
    productSlug: "peaks-frock",
    eyebrow: "New in",
    title: "Tiny",
    accent: "Peaks",
    label: "Triangle-Print Baby Dress",
    blurb: "Little brown triangles across white muslin, with flutter sleeves and buttons all the way down.",
    glow: "#F4EFE6",
    look: {
      skin: "#D9A47F", hair: "#3A2A1E", hairStyle: "curls", outfit: "#FBF9F4",
      kind: "bodysuit", detail: "heart", accessory: "bow", accessoryColor: "#C9A27A", prop: "none",
    },
  },
  {
    slug: "reef",
    productSlug: "reef-jabla",
    eyebrow: "New in",
    title: "Little",
    accent: "Reef",
    label: "Colourful Sea Creature Muslin Vest",
    blurb: "Turtles, starfish and a smiling stingray across white muslin, on a strappy top that ties at the shoulders.",
    glow: "#EFEBF4",
    look: {
      skin: "#C68E6B", hair: "#2F2420", hairStyle: "tuft", outfit: "#FBFAF8",
      kind: "bodysuit", detail: "dots", accessory: "none", prop: "star",
    },
  },
  {
    slug: "moonbeam-wrap",
    productSlug: "moonbeam-jabla",
    eyebrow: "New in",
    title: "Moonbeam",
    accent: "Jabla",
    label: "Moonbeam Wrap Jabla",
    blurb: "The Moonbeam print on a sleeveless crossover jabla, tying twice down the side and opening flat.",
    glow: "#EAF0F7",
    look: {
      skin: "#F3CDB0", hair: "#3A2A1E", hairStyle: "tuft", outfit: "#FBFCFE",
      kind: "bodysuit", detail: "cloud", accessory: "none", prop: "none",
    },
  },
  {
    slug: "panda",
    productSlug: "panda-jabla",
    eyebrow: "New in",
    title: "Panda",
    accent: "Bamboo",
    label: "Panda and Bear Muslin Baby Vest",
    blurb: "Pandas and little brown bears nibbling bamboo, on a soft V-neck jabla that buttons down the front.",
    glow: "#EFF3EA",
    look: {
      skin: "#D9A47F", hair: "#24190F", hairStyle: "curls", outfit: "#FBFBF8",
      kind: "bodysuit", detail: "flower", accessory: "none", prop: "teddy",
    },
  },
  {
    slug: "moonbeam-summer",
    productSlug: "moonbeam-summer-set",
    eyebrow: "New in",
    title: "Moonbeam",
    accent: "Summer",
    label: "Crescent Moon Baby Outfit",
    blurb: "The Moonbeam print on a short-sleeved top and shorts, buttoning down the front for warm days.",
    glow: "#E9EFF7",
    look: {
      skin: "#E8BE9C", hair: "#2F2420", hairStyle: "curls", outfit: "#FBFCFE",
      kind: "romper", detail: "cloud", accessory: "none", prop: "star",
    },
  },
  {
    slug: "moonbeam-wrap-set",
    productSlug: "moonbeam-wrap-set",
    eyebrow: "New in",
    title: "Moonbeam",
    accent: "Wrap Set",
    label: "Moonlit Muslin Babywear Set",
    blurb: "A sleeveless crossover top tying at the side with matching shorts, so nothing goes over the head.",
    glow: "#EAF1F8",
    look: {
      skin: "#F3CDB0", hair: "#3A2A1E", hairStyle: "tuft", outfit: "#FBFCFE",
      kind: "romper", detail: "dots", accessory: "none", prop: "none",
    },
  },
  {
    slug: "olive-sprig",
    productSlug: "olive-sprig-frock",
    eyebrow: "New in",
    title: "Olive",
    accent: "Sprig",
    label: "Ivory Gauze Baby Dress",
    blurb: "A plain butter-yellow frock with a little olive sprig embroidered at the chest and frilled flutter sleeves.",
    glow: "#F7F0D8",
    look: {
      skin: "#E8BE9C", hair: "#3A2A1E", hairStyle: "curls", outfit: "#FBF3D9",
      kind: "bodysuit", detail: "flower", accessory: "none", prop: "none",
    },
  },
  {
    slug: "rainbow-check",
    productSlug: "rainbow-check-set",
    eyebrow: "New in",
    title: "Rainbow",
    accent: "Check",
    label: "Pastel Plaid Children's Outfit",
    blurb: "A pastel check shirt and shorts with coconut buttons, for days that need no thinking about.",
    glow: "#F6F0E6",
    look: {
      skin: "#D9A47F", hair: "#2F2420", hairStyle: "tuft", outfit: "#FAF6EE",
      kind: "romper", detail: "dots", accessory: "none", prop: "star",
    },
  },
  {
    slug: "sunbeam",
    productSlug: "sunbeam-set",
    eyebrow: "New in",
    title: "Sunbeam",
    accent: "Day",
    label: "Pastel Yellow Linen Shirt and Shorts Set",
    blurb: "A plain butter-yellow shirt and shorts in slubby cotton, with a mandarin collar and an easy waist.",
    glow: "#F8F0CF",
    look: {
      skin: "#F3CDB0", hair: "#6B4A36", hairStyle: "tuft", outfit: "#F8E9A8",
      kind: "romper", detail: "cloud", accessory: "none", prop: "none",
    },
  },
  {
    slug: "arrow-trail",
    productSlug: "arrow-trail-jabla",
    eyebrow: "New in",
    title: "Arrow",
    accent: "Trail",
    label: "White Geometric Print Camisole",
    blurb: "Little orange and plum arrows across white muslin, on a strappy top that ties at the shoulders.",
    glow: "#F6EFE7",
    look: {
      skin: "#D9A47F", hair: "#3A2A1E", hairStyle: "curls", outfit: "#FBFAF7",
      kind: "bodysuit", detail: "star", accessory: "bow", accessoryColor: "#E08A4C", prop: "none",
    },
  },
  {
    slug: "watermelon",
    productSlug: "watermelon-set",
    eyebrow: "New in",
    title: "Watermelon",
    accent: "Slice",
    label: "Watermelon Print Pink Kids' Outfit",
    blurb: "Watermelon slices on blush muslin, with a peplum top and wide-leg trousers that swish.",
    glow: "#F8E4E2",
    look: {
      skin: "#E8BE9C", hair: "#3A2A1E", hairStyle: "curls", outfit: "#F9DEDC",
      kind: "romper", detail: "heart", accessory: "bow", accessoryColor: "#F2B8B0", prop: "none",
    },
  },
  {
    slug: "tractor",
    productSlug: "tractor-set",
    eyebrow: "New in",
    title: "Tractor",
    accent: "Field",
    label: "Playful Tractor Print Toddler Outfit",
    blurb: "Little red tractors rolling between the trees, on a shirt that comes with rust shorts.",
    glow: "#F3E6DC",
    look: {
      skin: "#C68E6B", hair: "#24190F", hairStyle: "curls", outfit: "#B4552C",
      kind: "romper", detail: "star", accessory: "none", prop: "none",
    },
  },
  {
    slug: "day-pack",
    productSlug: "day-pack",
    eyebrow: "Gift ready",
    title: "Day",
    accent: "Pack",
    label: "The Day Pack",
    blurb: "Three pieces in the rainbow shades of your choice, tied with a ribbon and ready to give.",
    glow: "#F3E9DF",
    look: {
      skin: "#B97F5C", hair: "#24190F", hairStyle: "curls", outfit: "#C9D8C5",
      kind: "bodysuit", detail: "flower", accessory: "bow", accessoryColor: "#E6A99D", prop: "none",
    },
  },
  {
    slug: "week-pack",
    productSlug: "week-pack",
    eyebrow: "Best value",
    title: "Week",
    accent: "Pack",
    label: "The Week Pack",
    blurb: "All seven rainbow shades, one for every day of the week, boxed and ready to give.",
    glow: "#E8E3EF",
    look: {
      skin: "#C68E6B", hair: "#2F2420", hairStyle: "none", outfit: "#F4D9D6",
      kind: "bodysuit", detail: "dots", accessory: "bonnet", accessoryColor: "#CFDCCB", prop: "star",
    },
  },
];

export const lookFor = (slug: string) => (COLLECTIONS.find((c) => c.slug === slug) ?? COLLECTIONS[0]).look;

// The four shop-by-age cards. Kept separate from the slides above so that
// retiring a piece changes the hero without leaving every age card showing the
// same baby.
export const AGE_LOOKS: BabyLook[] = [
  {
      skin: "#F3CDB0", hair: "#6B4A36", hairStyle: "tuft", outfit: "#F1E8DA",
      kind: "bodysuit", detail: "dots", accessory: "none", prop: "teddy",
  },
  {
      skin: "#C68E6B", hair: "#2F2420", hairStyle: "none", outfit: "#F4D9D6",
      kind: "bodysuit", detail: "dots", accessory: "bonnet", accessoryColor: "#CFDCCB", prop: "star",
  },
  {
      skin: "#F6D5BE", hair: "#B98955", hairStyle: "none", outfit: "#CFDFEC",
      kind: "bodysuit", detail: "cloud", accessory: "bunny", accessoryColor: "#F7F1E8", prop: "star",
  },
  {
      skin: "#D9A47F", hair: "#2F2420", hairStyle: "curls", outfit: "#D9B994",
      kind: "romper", detail: "heart", accessory: "beanie", accessoryColor: "#B7CCBE", prop: "none",
  },
];
