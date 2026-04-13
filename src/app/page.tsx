"use client";

import { useState, useEffect } from "react";
import { City } from "@/types";
import CitySearch from "@/components/CitySearch";
import WeatherCard from "@/components/WeatherCard";

const STORAGE_KEY = "weather-app-cities";

function loadCities(): City[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCities(cities: City[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
}

export default function Home() {
  const [cities, setCities] = useState<City[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCities(loadCities());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      saveCities(cities);
    }
  }, [cities, mounted]);

  function addCity(city: City) {
    const exists = cities.some(
      (c) => c.latitude === city.latitude && c.longitude === city.longitude
    );
    if (!exists) {
      setCities((prev) => [city, ...prev]);
    }
  }

  function removeCity(index: number) {
    setCities((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          What Should I Wear?
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Check the weather for your saved cities and get outfit suggestions
        </p>
      </header>

      <div className="mb-8 flex justify-center">
        <CitySearch onAdd={addCity} />
      </div>

      {mounted && cities.length === 0 && (
        <div className="mt-12 text-center text-gray-500 dark:text-gray-400">
          <p className="text-5xl">🌤️</p>
          <p className="mt-4 text-lg">No cities saved yet</p>
          <p className="mt-1 text-sm">
            Search for a city above to get started
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {cities.map((city, i) => (
          <WeatherCard
            key={`${city.latitude}-${city.longitude}`}
            city={city}
            onRemove={() => removeCity(i)}
          />
        ))}
      </div>
    </div>
  );
}
