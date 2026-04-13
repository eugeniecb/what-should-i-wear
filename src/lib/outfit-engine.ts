import {
  CATALOG,
  CatalogItem,
  getCatalogItem,
} from "@/lib/closet-catalog";
import type {
  ClothingCategory,
  StylePreference,
  TempSensitivity,
} from "@/types";

export interface OutfitInput {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  style: StylePreference;
  tempSensitivity: TempSensitivity;
  ownedItemNames: string[];
}

export type OutfitLineSlot =
  | "base"
  | "outerwear"
  | "footwear"
  | "accessories";

export interface OutfitLine {
  slot: OutfitLineSlot;
  text: string;
}

export interface OutfitResult {
  lines: OutfitLine[];
  note: string;
  missing: ClothingCategory[];
}

// ---------- Weather helpers ----------

const RAINY_CODES = new Set([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82]);
const SNOWY_CODES = new Set([71, 73, 75, 77, 85, 86]);
const STORMY_CODES = new Set([95, 96, 99]);
const SUNNY_CODES = new Set([0, 1]);
const PARTLY_CLOUDY_CODES = new Set([2]);
const OVERCAST_CODES = new Set([3]);
const FOGGY_CODES = new Set([45, 48]);

interface WeatherFlags {
  rainy: boolean;
  snowy: boolean;
  stormy: boolean;
  sunny: boolean;
  partlyCloudy: boolean;
  overcast: boolean;
  foggy: boolean;
  windy: boolean;
}

function weatherFlags(code: number, windSpeed: number): WeatherFlags {
  return {
    rainy: RAINY_CODES.has(code) || STORMY_CODES.has(code),
    snowy: SNOWY_CODES.has(code),
    stormy: STORMY_CODES.has(code),
    sunny: SUNNY_CODES.has(code),
    partlyCloudy: PARTLY_CLOUDY_CODES.has(code),
    overcast: OVERCAST_CODES.has(code),
    foggy: FOGGY_CODES.has(code),
    windy: windSpeed >= 12,
  };
}

// ---------- Temperature math ----------

function sensitivityOffset(s: TempSensitivity): number {
  if (s === "runs_cold") return -7;
  if (s === "runs_warm") return 7;
  return 0;
}

interface Targets {
  base: number; // target warmth for top / bottom / footwear
  outerwear: number; // target warmth when outerwear is worn
  needOuterwear: boolean;
}

function targetsFor(perceived: number, flags: WeatherFlags): Targets {
  const needOuterwear = perceived < 55 || flags.rainy || flags.snowy;

  let base: number;
  if (perceived >= 80) base = 1;
  else if (perceived >= 65) base = 2;
  else if (perceived >= 50) base = 3;
  else if (perceived >= 35) base = 3;
  else base = 4;

  let outerwear: number;
  if (perceived < 35) outerwear = 5;
  else if (perceived < 45) outerwear = 4;
  else if (perceived < 55) outerwear = 3;
  else outerwear = 2; // just for rain in mild weather

  return { base, outerwear, needOuterwear };
}

// ---------- Item picking ----------

function pick(
  category: ClothingCategory,
  targetWarmth: number,
  input: OutfitInput,
  flags: WeatherFlags,
  owned: Set<string>,
): CatalogItem | null {
  const candidates = CATALOG.filter((item) => {
    if (item.category !== category) return false;
    if (!owned.has(item.name)) return false;
    if (!item.styles.includes(input.style)) return false;
    // Outer/footwear must be rain/snow-appropriate when it's wet.
    if (category === "outerwear" || category === "footwear") {
      if (flags.rainy && !item.rainOk) return false;
      if (flags.snowy && !item.snowOk) return false;
    }
    return true;
  });

  if (candidates.length === 0) return null;

  // Score: prefer closest warmth to target; break ties by catalog order.
  const best = candidates
    .map((item, idx) => ({
      item,
      idx,
      score: -Math.abs(item.warmth - targetWarmth),
    }))
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.idx - b.idx))[0];

  return best.item;
}

function pickAccessory(
  name: string,
  input: OutfitInput,
  owned: Set<string>,
): CatalogItem | null {
  if (!owned.has(name)) return null;
  const item = getCatalogItem(name);
  if (!item) return null;
  if (!item.styles.includes(input.style)) return null;
  return item;
}

// ---------- Sentence composition ----------

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function joinItems(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function styleNote(style: StylePreference): string {
  switch (style) {
    case "casual":
      return "Easy, comfortable, and ready for anything.";
    case "business_casual":
      return "Polished without being stiff.";
    case "streetwear":
      return "Relaxed silhouette with a little attitude.";
    case "athletic":
      return "Built for movement.";
    case "formal":
      return "Sharp and clean.";
  }
}

function weatherNote(
  perceived: number,
  flags: WeatherFlags,
): string | null {
  // Severe / wet conditions take priority.
  if (flags.stormy) return "Watch for lightning — indoors is safer.";
  if (flags.snowy)
    return flags.windy
      ? "Snow plus wind — cover up and mind your footing."
      : "Insulate well and mind your footing.";
  if (flags.rainy)
    return flags.windy
      ? "Wind-driven rain — a hood beats an umbrella."
      : "Keep a waterproof layer on top. Stay dry.";
  if (flags.foggy)
    return "Visibility is low — give yourself extra time getting around.";

  // Temperature extremes.
  if (perceived < 32)
    return flags.windy
      ? "Bitter cold with wind — cover exposed skin."
      : "Freezing out — bundle up before stepping out.";
  if (perceived >= 85)
    return flags.windy
      ? "Hot and breezy — loose, breathable fabrics win."
      : "Heat is on — loose, breathable fabrics win today.";

  // Mild range: lean on wind, then cloud cover, then temperature.
  if (flags.windy) {
    if (perceived < 50)
      return "Cool and gusty — pick a layer that won't flap around.";
    if (perceived < 70)
      return "Breezy out — a wind-resistant top makes a difference.";
    return "Warm but breezy — light layers you can shed if it dies down.";
  }

  if (flags.overcast) {
    if (perceived < 45)
      return "Gray and chilly — easy to underdress for this kind of day.";
    if (perceived < 65)
      return "Overcast and mild — flat light, no surprises.";
    return "Warm and overcast — UV still gets through the clouds.";
  }

  if (flags.partlyCloudy) {
    if (perceived < 50)
      return "Sun in and out — it's noticeably cooler in the shade.";
    if (perceived < 70)
      return "Sun and clouds trading off — easy weather to dress for.";
    return "Bright with passing clouds — pleasant if you're outside.";
  }

  if (flags.sunny) {
    if (perceived < 50)
      return "Crisp and clear — good walking weather, sunglasses help.";
    if (perceived < 70)
      return "Clear skies and pleasant — make time to be outside.";
    return "Bright and warm — sunscreen and water in the bag.";
  }

  return null;
}

// ---------- Engine ----------

export function suggestOutfit(input: OutfitInput): OutfitResult {
  const owned = new Set(input.ownedItemNames);
  const flags = weatherFlags(input.weatherCode, input.windSpeed);
  const perceived = input.temperature + sensitivityOffset(input.tempSensitivity);
  const targets = targetsFor(perceived, flags);

  const top = pick("tops", targets.base, input, flags, owned);
  const bottom = pick("bottoms", targets.base, input, flags, owned);
  const footwear = pick("footwear", targets.base, input, flags, owned);
  const outerwear = targets.needOuterwear
    ? pick("outerwear", targets.outerwear, input, flags, owned)
    : null;

  // Accessories — keep it to the ones that matter for today's weather.
  const accessories: CatalogItem[] = [];
  if (flags.rainy) {
    const umbrella = pickAccessory("umbrella", input, owned);
    if (umbrella) accessories.push(umbrella);
  }
  if (perceived < 35 || flags.snowy) {
    const gloves = pickAccessory("gloves", input, owned);
    if (gloves) accessories.push(gloves);
    const scarf = pickAccessory("scarf", input, owned);
    if (scarf) accessories.push(scarf);
    if (flags.windy) {
      const hat = pickAccessory("hat/beanie", input, owned);
      if (hat) accessories.push(hat);
    }
  }
  if (flags.sunny && input.temperature >= 65) {
    // Sunglasses are the default. Cap only for casual-family styles.
    const cap = pickAccessory("baseball cap", input, owned);
    const sunglasses = pickAccessory("sunglasses", input, owned);
    if (cap) accessories.push(cap);
    else if (sunglasses) accessories.push(sunglasses);
  }

  // Compose lines.
  const lines: OutfitLine[] = [];
  const missing: ClothingCategory[] = [];

  if (top && bottom) {
    lines.push({
      slot: "base",
      text: `${capitalize(top.name)} with ${bottom.name}.`,
    });
  } else {
    if (!top) missing.push("tops");
    if (!bottom) missing.push("bottoms");
    if (top) lines.push({ slot: "base", text: `${capitalize(top.name)}.` });
    if (bottom)
      lines.push({ slot: "base", text: `${capitalize(bottom.name)}.` });
  }

  if (targets.needOuterwear) {
    if (outerwear) {
      lines.push({
        slot: "outerwear",
        text: `Layer a ${outerwear.name} on top.`,
      });
    } else {
      missing.push("outerwear");
    }
  }

  if (footwear) {
    lines.push({ slot: "footwear", text: `${capitalize(footwear.name)}.` });
  } else {
    missing.push("footwear");
  }

  if (accessories.length > 0) {
    lines.push({
      slot: "accessories",
      text: `Grab ${joinItems(accessories.map((a) => a.name))}.`,
    });
  }

  // Note: flag missing slots first, then weather, then style.
  let note: string;
  if (missing.length > 0) {
    note = `Tip: your closet is missing ${joinItems(
      missing.map((c) => c),
    )} that fit today's weather and style.`;
  } else {
    note = weatherNote(perceived, flags) ?? styleNote(input.style);
  }

  return { lines, note, missing };
}
