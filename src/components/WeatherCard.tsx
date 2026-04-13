"use client";

import { useEffect, useState } from "react";
import { City, UserPreferences, WeatherData } from "@/types";
import { getWeatherDescription } from "@/lib/weather-utils";
import { styleLabel } from "@/lib/preferences";

interface WeatherCardProps {
  city: City;
  onRemove: () => void;
  ownedItems: string[];
  preferences: UserPreferences;
}

type Tone =
  | "sunny"
  | "cloudy"
  | "rainy"
  | "snowy"
  | "stormy"
  | "foggy"
  | "neutral";

function toneFromCode(code: number): Tone {
  if ([0, 1].includes(code)) return "sunny";
  if ([2, 3].includes(code)) return "cloudy";
  if ([45, 48].includes(code)) return "foggy";
  if ([95, 96, 99].includes(code)) return "stormy";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snowy";
  if ([51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return "rainy";
  return "neutral";
}

const TONE_CLASSES: Record<Tone, string> = {
  sunny:
    "bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/15 dark:to-yellow-800/10",
  cloudy:
    "bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/60 dark:to-gray-800/40",
  rainy:
    "bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-950/40 dark:to-blue-900/30",
  snowy:
    "bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30",
  stormy:
    "bg-gradient-to-br from-indigo-100 to-slate-200 dark:from-indigo-950/50 dark:to-slate-900/40",
  foggy:
    "bg-gradient-to-br from-neutral-100 to-slate-200 dark:from-neutral-900/50 dark:to-slate-900/40",
  neutral: "bg-white dark:bg-gray-800",
};

export default function WeatherCard({
  city,
  onRemove,
  ownedItems,
  preferences,
}: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);

  const [outfit, setOutfit] = useState<string | null>(null);
  const [outfitLoading, setOutfitLoading] = useState(false);
  const [outfitError, setOutfitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/weather?lat=${city.latitude}&lon=${city.longitude}`,
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (cancelled) return;
        setWeather({ city, ...data });
        setWeatherLoading(false);
      } catch {
        if (cancelled) return;
        setWeatherError(true);
        setWeatherLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [city]);

  useEffect(() => {
    if (!weather || ownedItems.length === 0) return;
    let cancelled = false;

    (async () => {
      setOutfitLoading(true);
      setOutfitError(null);
      try {
        const res = await fetch("/api/outfit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            city: city.name,
            temperature: weather.temperature,
            conditions: getWeatherDescription(weather.weatherCode).label,
            style: preferences.style,
            tempSensitivity: preferences.temp_sensitivity,
            ownedItems,
          }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setOutfitError(json.error ?? "Failed to get outfit suggestion");
        } else {
          setOutfit(json.suggestion);
        }
      } catch {
        if (cancelled) return;
        setOutfitError("Failed to get outfit suggestion");
      } finally {
        if (!cancelled) setOutfitLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    weather,
    city.name,
    ownedItems,
    preferences.style,
    preferences.temp_sensitivity,
  ]);

  const { label, icon } = weather
    ? getWeatherDescription(weather.weatherCode)
    : { label: "", icon: "" };
  const tone = weather ? toneFromCode(weather.weatherCode) : "neutral";

  return (
    <div
      className={`relative rounded-2xl border border-gray-200/60 p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700/60 ${TONE_CLASSES[tone]}`}
    >
      <button
        onClick={onRemove}
        className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 hover:bg-black/5 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-300"
        aria-label={`Remove ${city.name}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <h2 className="font-serif text-xl font-semibold">
        {city.name}
        <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">
          {city.admin1 ? `${city.admin1}, ` : ""}
          {city.country}
        </span>
      </h2>

      {weatherLoading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          Loading weather...
        </div>
      )}

      {weatherError && (
        <p className="mt-4 text-sm text-red-500">
          Failed to load weather data.
        </p>
      )}

      {weather && !weatherLoading && !weatherError && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{icon}</span>
            <div>
              <p className="text-3xl font-bold">
                {Math.round(weather.temperature)}°F
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {label}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div>
              Feels like{" "}
              <span className="font-medium text-gray-900 dark:text-gray-200">
                {Math.round(weather.apparentTemperature)}°F
              </span>
            </div>
            <div>
              Wind{" "}
              <span className="font-medium text-gray-900 dark:text-gray-200">
                {Math.round(weather.windSpeed)} mph
              </span>
            </div>
            <div>
              Humidity{" "}
              <span className="font-medium text-gray-900 dark:text-gray-200">
                {weather.humidity}%
              </span>
            </div>
            <div>
              H: {Math.round(weather.daily.tempMax)}° L:{" "}
              {Math.round(weather.daily.tempMin)}°
            </div>
          </div>

          <OutfitBlock
            loading={outfitLoading}
            error={outfitError}
            outfit={outfit}
            style={styleLabel(preferences.style)}
            emptyCloset={ownedItems.length === 0}
          />
        </div>
      )}
    </div>
  );
}

function OutfitBlock({
  loading,
  error,
  outfit,
  style,
  emptyCloset,
}: {
  loading: boolean;
  error: string | null;
  outfit: string | null;
  style: string;
  emptyCloset: boolean;
}) {
  if (emptyCloset) {
    return (
      <div className="rounded-lg bg-white/70 px-3 py-2 text-sm text-gray-700 dark:bg-black/30 dark:text-gray-200">
        👕 Add items to your{" "}
        <a href="/closet" className="underline underline-offset-2">
          closet
        </a>{" "}
        to get an outfit suggestion.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-gray-600 dark:bg-black/30 dark:text-gray-300">
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        Styling your outfit…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-200">
        {error}
      </div>
    );
  }

  if (!outfit) return null;

  return (
    <div className="rounded-lg bg-white/70 px-3 py-3 text-sm text-gray-800 shadow-inner dark:bg-black/30 dark:text-gray-100">
      <div className="mb-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        <span>👕</span>
        <span>{style} outfit</span>
      </div>
      <p className="whitespace-pre-wrap leading-relaxed">{outfit}</p>
    </div>
  );
}
