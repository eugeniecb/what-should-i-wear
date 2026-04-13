import type { ClothingCategory, StylePreference } from "@/types";

/**
 * Structured clothing catalog with the metadata the outfit engine needs:
 *
 * - `warmth`: 1 (hot-weather) → 5 (deep winter)
 * - `rainOk`: acceptable as the outer layer / footwear when it's raining
 * - `snowOk`: acceptable when it's snowing
 * - `styles`: style preferences this item fits
 *
 * The closet UI and the outfit engine both key off this list. Adding an
 * item here makes it immediately available in both places — remove an
 * item and the DB cleanup migration will drop any stale rows.
 */
export interface CatalogItem {
  name: string;
  category: ClothingCategory;
  warmth: number;
  rainOk: boolean;
  snowOk: boolean;
  styles: readonly StylePreference[];
}

const ALL_STYLES: readonly StylePreference[] = [
  "casual",
  "business_casual",
  "streetwear",
  "athletic",
  "formal",
];

export const CATALOG: readonly CatalogItem[] = [
  // -------- Tops --------
  {
    name: "t-shirt",
    category: "tops",
    warmth: 1,
    rainOk: true,
    snowOk: true,
    styles: ["casual", "streetwear", "athletic"],
  },
  {
    name: "long sleeve shirt",
    category: "tops",
    warmth: 2,
    rainOk: true,
    snowOk: true,
    styles: ["casual", "business_casual", "streetwear"],
  },
  {
    name: "dress shirt",
    category: "tops",
    warmth: 2,
    rainOk: true,
    snowOk: true,
    styles: ["business_casual", "formal"],
  },
  {
    name: "blouse",
    category: "tops",
    warmth: 2,
    rainOk: true,
    snowOk: true,
    styles: ["casual", "business_casual", "formal"],
  },
  {
    name: "tank top",
    category: "tops",
    warmth: 1,
    rainOk: true,
    snowOk: false,
    styles: ["casual", "streetwear", "athletic"],
  },
  {
    name: "sweater",
    category: "tops",
    warmth: 4,
    rainOk: true,
    snowOk: true,
    styles: ["casual", "business_casual", "streetwear"],
  },
  {
    name: "hoodie",
    category: "tops",
    warmth: 3,
    rainOk: true,
    snowOk: true,
    styles: ["casual", "streetwear", "athletic"],
  },
  {
    name: "turtleneck",
    category: "tops",
    warmth: 3,
    rainOk: true,
    snowOk: true,
    styles: ["casual", "business_casual", "streetwear", "formal"],
  },

  // -------- Bottoms --------
  {
    name: "jeans",
    category: "bottoms",
    warmth: 3,
    rainOk: true,
    snowOk: true,
    styles: ["casual", "business_casual", "streetwear"],
  },
  {
    name: "chinos",
    category: "bottoms",
    warmth: 2,
    rainOk: true,
    snowOk: true,
    styles: ["casual", "business_casual"],
  },
  {
    name: "shorts",
    category: "bottoms",
    warmth: 1,
    rainOk: false,
    snowOk: false,
    styles: ["casual", "streetwear", "athletic"],
  },
  {
    name: "leggings",
    category: "bottoms",
    warmth: 2,
    rainOk: true,
    snowOk: true,
    styles: ["casual", "athletic", "streetwear"],
  },
  {
    name: "skirt",
    category: "bottoms",
    warmth: 1,
    rainOk: false,
    snowOk: false,
    styles: ["casual", "business_casual", "formal"],
  },
  {
    name: "dress pants",
    category: "bottoms",
    warmth: 2,
    rainOk: true,
    snowOk: true,
    styles: ["business_casual", "formal"],
  },
  {
    name: "sweatpants",
    category: "bottoms",
    warmth: 3,
    rainOk: false,
    snowOk: true,
    styles: ["casual", "streetwear", "athletic"],
  },

  // -------- Outerwear --------
  {
    name: "light jacket",
    category: "outerwear",
    warmth: 2,
    rainOk: false,
    snowOk: false,
    styles: ["casual", "business_casual", "streetwear"],
  },
  {
    name: "rain jacket",
    category: "outerwear",
    warmth: 2,
    rainOk: true,
    snowOk: false,
    styles: ["casual", "business_casual", "streetwear", "athletic"],
  },
  {
    name: "winter coat",
    category: "outerwear",
    warmth: 5,
    rainOk: true,
    snowOk: true,
    styles: ["casual", "business_casual", "streetwear", "formal"],
  },
  {
    name: "puffer jacket",
    category: "outerwear",
    warmth: 4,
    rainOk: true,
    snowOk: true,
    styles: ["casual", "streetwear", "athletic"],
  },
  {
    name: "blazer",
    category: "outerwear",
    warmth: 2,
    rainOk: false,
    snowOk: false,
    styles: ["business_casual", "formal"],
  },
  {
    name: "cardigan",
    category: "outerwear",
    warmth: 2,
    rainOk: false,
    snowOk: false,
    styles: ["casual", "business_casual"],
  },
  {
    name: "vest",
    category: "outerwear",
    warmth: 2,
    rainOk: false,
    snowOk: false,
    styles: ["casual", "business_casual", "streetwear"],
  },

  // -------- Footwear --------
  {
    name: "sneakers",
    category: "footwear",
    warmth: 2,
    rainOk: false,
    snowOk: false,
    styles: ["casual", "business_casual", "streetwear", "athletic"],
  },
  {
    name: "rain boots",
    category: "footwear",
    warmth: 2,
    rainOk: true,
    snowOk: false,
    styles: ["casual"],
  },
  {
    name: "ankle boots",
    category: "footwear",
    warmth: 3,
    rainOk: true,
    snowOk: false,
    styles: ["casual", "business_casual", "streetwear", "formal"],
  },
  {
    name: "dress shoes",
    category: "footwear",
    warmth: 2,
    rainOk: false,
    snowOk: false,
    styles: ["business_casual", "formal"],
  },
  {
    name: "sandals",
    category: "footwear",
    warmth: 1,
    rainOk: false,
    snowOk: false,
    styles: ["casual"],
  },
  {
    name: "loafers",
    category: "footwear",
    warmth: 2,
    rainOk: false,
    snowOk: false,
    styles: ["casual", "business_casual", "formal"],
  },
  {
    name: "winter boots",
    category: "footwear",
    warmth: 5,
    rainOk: true,
    snowOk: true,
    styles: ["casual", "streetwear"],
  },

  // -------- Accessories --------
  {
    name: "umbrella",
    category: "accessories",
    warmth: 0,
    rainOk: true,
    snowOk: false,
    styles: ALL_STYLES,
  },
  {
    name: "scarf",
    category: "accessories",
    warmth: 4,
    rainOk: true,
    snowOk: true,
    styles: ["casual", "business_casual", "streetwear", "formal"],
  },
  {
    name: "gloves",
    category: "accessories",
    warmth: 4,
    rainOk: true,
    snowOk: true,
    styles: ALL_STYLES,
  },
  {
    name: "hat/beanie",
    category: "accessories",
    warmth: 4,
    rainOk: true,
    snowOk: true,
    styles: ["casual", "streetwear", "athletic"],
  },
  {
    name: "sunglasses",
    category: "accessories",
    warmth: 0,
    rainOk: false,
    snowOk: false,
    styles: ALL_STYLES,
  },
  {
    name: "baseball cap",
    category: "accessories",
    warmth: 0,
    rainOk: false,
    snowOk: false,
    styles: ["casual", "streetwear", "athletic"],
  },
];

const CATALOG_BY_NAME: Map<string, CatalogItem> = new Map(
  CATALOG.map((item) => [item.name, item]),
);

export function getCatalogItem(name: string): CatalogItem | undefined {
  return CATALOG_BY_NAME.get(name);
}

export function catalogNames(): string[] {
  return CATALOG.map((i) => i.name);
}

/**
 * Items grouped by category, in the order they appear in CATALOG.
 * Used by the closet UI and by the first-login seed.
 */
export const CATALOG_BY_CATEGORY: Record<ClothingCategory, CatalogItem[]> =
  CATALOG.reduce(
    (acc, item) => {
      acc[item.category].push(item);
      return acc;
    },
    {
      tops: [],
      bottoms: [],
      outerwear: [],
      footwear: [],
      accessories: [],
    } as Record<ClothingCategory, CatalogItem[]>,
  );

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
