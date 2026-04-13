export interface City {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string; // state/region
}

export interface SavedCity extends City {
  id: string;
  position: number;
}

export type ClothingCategory =
  | "tops"
  | "bottoms"
  | "outerwear"
  | "footwear"
  | "accessories";

export interface ClosetItem {
  id: string;
  category: ClothingCategory;
  name: string;
  owned: boolean;
}

export type StylePreference =
  | "casual"
  | "business_casual"
  | "streetwear"
  | "athletic"
  | "formal";

export type TempSensitivity = "runs_cold" | "normal" | "runs_warm";

export interface UserPreferences {
  style: StylePreference;
  temp_sensitivity: TempSensitivity;
}

export interface WeatherData {
  city: City;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  daily: {
    tempMax: number;
    tempMin: number;
  };
}
