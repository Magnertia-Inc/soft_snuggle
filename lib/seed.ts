import { ageGroupsFor } from "./store";
import type { Category } from "./types";

interface SeedProduct {
  slug: string;
  name: string;
  category: Category;
  fabric: string;
  colour: string;
  price: number;
  compareAt?: number;
  badge?: string;
  organic: boolean;
  sizes: string[];
  ageGroups: string[];
  description: string;
  care: string;
  tint: string;
  garment: string;
}

// Matches the Frock / Jabla size charts (components/shop/SizeChart.tsx)
const BODYSUIT_SIZES = ["0–3M", "3–6M", "6–9M", "9–12M", "12–18M", "18–24M", "2–3Y"];
const ROMPER_SIZES = ["3–6M", "6–9M", "9–12M", "12–18M", "18–24M", "2–3Y"];
const CHART_SIZES = ["0–3M", "3–6M", "6–9M", "9–12M", "12–18M", "18–24M", "2–3Y"];
const SET_SIZES = ["0–3M", "3–6M"];
const CARE = "Machine wash cold, inside out, with similar colours. Tumble dry low. No bleach, no fuss.";

// Placeholder catalogue taken from the Soft Snuggle PDF. Sizes and copy are
// stand-ins until the client sends the real product sheet.
//
// This is only the starting point. Once the owner saves a product in the admin
// panel (Products → Edit), the panel owns it and changes made here no longer
// reach it — see syncCatalogue in lib/db.ts. New products added here still
// appear in the shop on the next deploy.
const RAW: Omit<SeedProduct, "ageGroups">[] = [
  // Real Soft Snuggle pieces (photos in public/products/<slug>). Prices are placeholders.
  {
    slug: "lemon-frock",
    name: "Lemon Grove Frock",
    category: "frock",
    fabric: "100% cotton",
    colour: "Ivory, lemon print",
    // Test price, like the cherry frock. Back to 349 before real orders.
    price: 349,
    badge: "New",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "A sleeveless frock in airy crinkled muslin, printed all over with watercolour lemons. Snaps run the whole way down the front, and a gathered waist gives the skirt its swing.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#F7F3E0",
    garment: "#F6F1E2",
  },
  {
    slug: "zebra-jabla",
    name: "Zebra Doodle Jabla",
    category: "jabla",
    fabric: "100% cotton",
    colour: "Ivory, zebra doodle",
    price: 199,
    badge: "New",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "A sleeveless jabla in soft crinkled muslin, ivory all over with one hand-drawn zebra on the front. It ties at the back of the neck, so it goes on and comes off without pulling anything over a small head.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#F1EDE5",
    garment: "#F6F3EC",
  },
  {
    slug: "butterfly-nappy",
    name: "Butterfly Print Muslin Baby Nappy Cover",
    category: "nappy",
    fabric: "100% cotton",
    colour: "Ivory, butterfly print",
    price: 149,
    badge: "New",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "A tie-up muslin nappy, printed with little butterflies and hearts. Long side ties let you set the fit exactly where it is comfortable, and the open shape dries quickly after a wash.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#F6EFE6",
    garment: "#F7F3EA",
  },
  {
    slug: "zebra-wrap-jabla",
    name: "Muslin Zebra Wrap Vest",
    category: "jabla",
    fabric: "100% cotton",
    colour: "White, zebra motif",
    price: 199,
    badge: "New",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "A crossover wrap jabla in soft white muslin, with one hand-drawn zebra on the front and braided cord ties at the side. Nothing goes over the head, which makes it the easiest thing to put on a newborn.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#F3F0EA",
    garment: "#FBFAF7",
  },
  {
    slug: "peaks-frock",
    name: "Triangle-Print Baby Dress",
    category: "frock",
    fabric: "100% cotton",
    colour: "White, brown and tan triangles",
    price: 399,
    badge: "New",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "A white muslin frock scattered with little brown and tan triangles, stacked like tiny hills. Flutter sleeves over the shoulders, buttons the whole way down the front and a gathered waist that gives the skirt its swing.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#F4EFE6",
    garment: "#FBF9F4",
  },
  {
    slug: "reef-jabla",
    name: "Colourful Sea Creature Muslin Vest",
    category: "jabla",
    fabric: "100% cotton",
    colour: "White, sea creature print",
    price: 199,
    badge: "New",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "A strappy muslin top printed with turtles, starfish, stripy fish and a smiling stingray. The shoulder straps tie, so the length grows with the baby and nothing has to go over the head on a hot day.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#EFEBF4",
    garment: "#FBFAF8",
  },
  {
    slug: "moonbeam-jabla",
    name: "Moonbeam Wrap Jabla",
    category: "jabla",
    fabric: "100% cotton",
    colour: "White, blue moon print",
    price: 199,
    badge: "New",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "The same little blue moons as the Moonbeam Night Set, on a sleeveless crossover jabla. It ties twice down the side and opens flat, so a newborn can be dressed without anything going over the head.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#EAF0F7",
    garment: "#FBFCFE",
  },
  {
    slug: "panda-jabla",
    name: "Panda and Bear Muslin Baby Vest",
    category: "jabla",
    fabric: "100% cotton",
    colour: "White, panda and bear print",
    price: 199,
    badge: "New",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "A sleeveless V-neck jabla in layered cotton muslin, printed with pandas and little brown bears at play. Four buttons down the front and a soft bound edge all the way round.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#EFF3EA",
    garment: "#FBFBF8",
  },
  {
    slug: "moonbeam-summer-set",
    name: "Crescent Moon Baby Outfit",
    category: "set",
    fabric: "100% cotton",
    colour: "White, blue moon print",
    price: 499,
    badge: "New",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "The Moonbeam print on a two-piece set for warm days. A short-sleeved top that buttons down the front, and shorts with a soft covered waist that will not dig in.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#E9EFF7",
    garment: "#FBFCFE",
  },
  {
    slug: "moonbeam-wrap-set",
    name: "Moonlit Muslin Babywear Set",
    category: "set",
    fabric: "100% cotton",
    colour: "White, blue moon print",
    price: 399,
    badge: "New",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "A sleeveless crossover top that ties twice at the side, with matching shorts. Nothing goes over the head, which makes it the easiest set to get on and off on a hot afternoon.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#EAF1F8",
    garment: "#FBFCFE",
  },
  {
    slug: "olive-sprig-frock",
    name: "Ivory Gauze Baby Dress",
    category: "frock",
    fabric: "100% cotton",
    colour: "Butter yellow, olive embroidery",
    price: 349,
    badge: "New",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "A plain butter-yellow frock in crinkled muslin with a little olive sprig embroidered at the chest. Frilled flutter sleeves, metal snaps the whole way down the front and a gathered waist.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#F7F0D8",
    garment: "#FBF3D9",
  },
  {
    slug: "rainbow-check-set",
    name: "Pastel Plaid Children's Outfit",
    category: "set",
    fabric: "100% cotton",
    colour: "Pastel rainbow check",
    price: 549,
    badge: "New",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "A short-sleeved mandarin-collar shirt in a soft pastel check, with matching shorts on a covered elastic waist. Coconut buttons down the front.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#F6F0E6",
    garment: "#FAF6EE",
  },
  {
    slug: "sunbeam-set",
    name: "Pastel Yellow Linen Shirt and Shorts Set",
    category: "set",
    fabric: "100% cotton",
    colour: "Butter yellow",
    price: 599,
    badge: "New",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "A plain butter-yellow shirt and shorts, cut from soft slubby cotton. Mandarin collar, short sleeves and a covered elastic waist, so it is as easy on as it looks.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#F8F0CF",
    garment: "#F8E9A8",
  },
  {
    slug: "arrow-trail-jabla",
    name: "White Geometric Print Camisole",
    category: "jabla",
    fabric: "100% cotton",
    colour: "White, orange and plum arrows",
    price: 199,
    badge: "New",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "A strappy muslin top printed with little orange and plum arrows marching up and down. The shoulder straps tie, so the length grows with the baby and nothing has to go over the head.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#F6EFE7",
    garment: "#FBFAF7",
  },
  {
    slug: "watermelon-set",
    name: "Watermelon Print Pink Kids' Outfit",
    category: "set",
    fabric: "100% cotton",
    colour: "Blush pink, watermelon print",
    price: 699,
    badge: "New",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "Little watermelon slices scattered over blush crinkled muslin. The top has frilled flutter sleeves and a peplum hem with buttons down the back, and the wide-leg trousers sit on a soft covered waist.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#F8E4E2",
    garment: "#F9DEDC",
  },
  {
    slug: "tractor-set",
    name: "Playful Tractor Print Toddler Outfit",
    category: "set",
    fabric: "100% cotton",
    colour: "White with tractors, rust shorts",
    price: 549,
    badge: "New",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "Little red tractors rolling between orange and green trees, on a short-sleeved mandarin-collar shirt with coconut buttons. The rust shorts have a covered elastic waist and side pockets.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#F3E6DC",
    garment: "#B4552C",
  },
  {
    slug: "day-pack",
    name: "3-Piece Panda Gift Set",
    category: "gift-set",
    fabric: "100% cotton",
    colour: "Pink, mint and sky blue, panda print",
    price: 599,
    badge: "Gift ready",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "Three soft button-front jablas in blush pink, mint and sky blue, scattered with pandas, little brown bears and clover. Boxed with a satin ribbon and ready to give: a little gift of comfort for a brand-new arrival.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#F3E9DF",
    garment: "#F2D6CC",
  },
  {
    slug: "week-pack",
    name: "7-Day Gift Set",
    category: "gift-set",
    fabric: "100% cotton",
    colour: "7 rainbow shades, little arrow print",
    price: 1299,
    badge: "Best value",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "A little colour for every day: seven tie-shoulder cotton muslin vests, Monday to Sunday, in seven soft rainbow shades with a tiny arrow print. Boxed and ready to give, and the easiest week of dressing you will have.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#E8E3EF",
    garment: "#C4A5D1",
  },
  {
    slug: "rainbow-zebra-pack",
    name: "7-Piece Rainbow Gift Set",
    category: "gift-set",
    fabric: "100% cotton",
    colour: "7 rainbow shades, zebra motif",
    price: 1299,
    badge: "Gift ready",
    organic: false,
    sizes: CHART_SIZES,
    description:
      "A rainbow of comfort: seven side-tie wrap vests in soft cotton muslin, one in every shade of the rainbow, each with a little sleepy zebra. Wraps on without pulling over the head, and comes boxed with a satin bow.",
    care: "Hand wash or gentle machine wash cold. Dry in shade. Do not bleach.",
    tint: "#F3E9DF",
    garment: "#F2D6CC",
  },
];

export const SEED_PRODUCTS: SeedProduct[] = RAW.map((p) => ({ ...p, ageGroups: ageGroupsFor(p.sizes) }));
