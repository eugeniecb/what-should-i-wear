import type {
  StylePreference,
  TempSensitivity,
  TemperatureUnit,
} from "@/types";

export const STYLE_OPTIONS: { value: StylePreference; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "business_casual", label: "Business Casual" },
  { value: "streetwear", label: "Streetwear" },
  { value: "athletic", label: "Athletic" },
  { value: "formal", label: "Formal" },
];

export const SENSITIVITY_OPTIONS: {
  value: TempSensitivity;
  label: string;
  hint: string;
}[] = [
  {
    value: "runs_cold",
    label: "Runs cold",
    hint: "You feel colder than most people",
  },
  { value: "normal", label: "Normal", hint: "Average temperature tolerance" },
  {
    value: "runs_warm",
    label: "Runs warm",
    hint: "You feel warmer than most people",
  },
];

export const DEFAULT_PREFERENCES = {
  style_weekday: "casual" as StylePreference,
  style_weekend: "casual" as StylePreference,
  temp_sensitivity: "normal" as TempSensitivity,
  temperature_unit: "fahrenheit" as TemperatureUnit,
};

/** Returns the style preference that applies on a given local date. */
export function styleForDate(
  prefs: { style_weekday: StylePreference; style_weekend: StylePreference },
  date: Date = new Date(),
): StylePreference {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  return isWeekend ? prefs.style_weekend : prefs.style_weekday;
}

export function styleLabel(style: StylePreference): string {
  return STYLE_OPTIONS.find((o) => o.value === style)?.label ?? style;
}

export function sensitivityPhrase(sensitivity: TempSensitivity): string {
  switch (sensitivity) {
    case "runs_cold":
      return "cold";
    case "runs_warm":
      return "warm";
    default:
      return "at a normal temperature";
  }
}
