import type { StylePreference, TempSensitivity } from "@/types";

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
  style: "casual" as StylePreference,
  temp_sensitivity: "normal" as TempSensitivity,
};

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
