"use client";

import { useEffect, useState } from "react";
import { City, WeatherData } from "@/types";
import { getWeatherDescription, getClothingAdvice } from "@/lib/weather-utils";

interface WeatherCardProps {
  city: City;
  onRemove: () => void;
}

export default function WeatherCard({ city, onRemove }: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    fetch(`/api/weather?lat=${city.latitude}&lon=${city.longitude}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setWeather({ city, ...data });
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [city]);

  const { label, icon } = weather
    ? getWeatherDescription(weather.weatherCode)
    : { label: "", icon: "" };

  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <button
        onClick={onRemove}
        className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
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

      <h2 className="text-lg font-semibold">
        {city.name}
        <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">
          {city.admin1 ? `${city.admin1}, ` : ""}
          {city.country}
        </span>
      </h2>

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          Loading weather...
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-500">
          Failed to load weather data.
        </p>
      )}

      {weather && !loading && !error && (
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

          <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
            👕 {getClothingAdvice(weather.temperature, weather.weatherCode)}
          </div>
        </div>
      )}
    </div>
  );
}
