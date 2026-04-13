"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { City, SavedCity } from "@/types";
import CitySearch from "@/components/CitySearch";
import WeatherCard from "@/components/WeatherCard";
import { useSupabase } from "@/lib/useSupabase";

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser();
  const supabase = useSupabase();

  const [cities, setCities] = useState<SavedCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    if (!isSignedIn) {
      setCities([]);
      setLoading(false);
      return;
    }

    (async () => {
      const { data, error } = await supabase
        .from("saved_cities")
        .select("id, name, country, admin1, latitude, longitude")
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        setError(error.message);
        setCities([]);
      } else {
        setError(null);
        setCities(data ?? []);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, supabase]);

  async function addCity(city: City) {
    if (!user) return;
    if (
      cities.some(
        (c) => c.latitude === city.latitude && c.longitude === city.longitude,
      )
    ) {
      return;
    }

    const { data, error } = await supabase
      .from("saved_cities")
      .insert({
        user_id: user.id,
        name: city.name,
        country: city.country,
        admin1: city.admin1 ?? null,
        latitude: city.latitude,
        longitude: city.longitude,
      })
      .select("id, name, country, admin1, latitude, longitude")
      .single();

    if (error) {
      setError(error.message);
      return;
    }
    if (data) {
      setCities((prev) => [data, ...prev]);
    }
  }

  async function removeCity(id: string) {
    const prev = cities;
    setCities((current) => current.filter((c) => c.id !== id));
    const { error } = await supabase.from("saved_cities").delete().eq("id", id);
    if (error) {
      setError(error.message);
      setCities(prev);
    }
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

      {isLoaded && !isSignedIn && (
        <div className="mt-12 text-center text-gray-500 dark:text-gray-400">
          <p className="text-5xl">🔒</p>
          <p className="mt-4 text-lg">Sign in to save cities</p>
          <p className="mt-1 text-sm">
            Your saved cities sync across your devices once you&apos;re signed
            in.
          </p>
        </div>
      )}

      {isSignedIn && (
        <>
          <div className="mb-8 flex justify-center">
            <CitySearch onAdd={addCity} />
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </div>
          )}

          {!loading && cities.length === 0 && !error && (
            <div className="mt-12 text-center text-gray-500 dark:text-gray-400">
              <p className="text-5xl">🌤️</p>
              <p className="mt-4 text-lg">No cities saved yet</p>
              <p className="mt-1 text-sm">
                Search for a city above to get started
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {cities.map((city) => (
              <WeatherCard
                key={city.id}
                city={city}
                onRemove={() => removeCity(city.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
