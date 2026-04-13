import type { ClothingCategory } from "@/types";

/**
 * Default closet catalog. On a new user's first sign-in these items are
 * seeded into `public.closet_items` with `owned = true`. Users can later
 * uncheck items they don't own, or add custom ones.
 */
export const CLOSET_SEED: Record<ClothingCategory, readonly string[]> = {
  tops: [
    "t-shirt",
    "long sleeve shirt",
    "dress shirt",
    "blouse",
    "tank top",
    "sweater",
    "hoodie",
    "turtleneck",
  ],
  bottoms: [
    "jeans",
    "chinos",
    "shorts",
    "leggings",
    "skirt",
    "dress pants",
    "sweatpants",
  ],
  outerwear: [
    "light jacket",
    "rain jacket",
    "winter coat",
    "puffer jacket",
    "blazer",
    "cardigan",
    "vest",
  ],
  footwear: [
    "sneakers",
    "rain boots",
    "ankle boots",
    "dress shoes",
    "sandals",
    "loafers",
    "winter boots",
  ],
  accessories: [
    "umbrella",
    "scarf",
    "gloves",
    "hat/beanie",
    "sunglasses",
    "baseball cap",
  ],
} as const;

export const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  outerwear: "Outerwear",
  footwear: "Footwear",
  accessories: "Accessories",
};

export const CATEGORY_ORDER: readonly ClothingCategory[] = [
  "tops",
  "bottoms",
  "outerwear",
  "footwear",
  "accessories",
] as const;
