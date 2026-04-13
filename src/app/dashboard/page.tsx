"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { City, SavedCity, UserPreferences } from "@/types";
import CitySearch from "@/components/CitySearch";
import WeatherCard from "@/components/WeatherCard";
import { useSupabase } from "@/lib/useSupabase";
import { useEnsureUserInitialized } from "@/lib/useEnsureUserInitialized";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";

export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const supabase = useSupabase();
  useEnsureUserInitialized();

  const [cities, setCities] = useState<SavedCity[]>([]);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    (async () => {
      if (!isSignedIn) {
        if (cancelled) return;
        setCities([]);
        setLoading(false);
        return;
      }
      const [citiesRes, closetRes, prefsRes] = await Promise.all([
        supabase
          .from("saved_cities")
          .select("id, name, country, admin1, latitude, longitude")
          .order("created_at", { ascending: false }),
        supabase
          .from("closet_items")
          .select("name, owned")
          .eq("owned", true),
        supabase
          .from("user_preferences")
          .select("style, temp_sensitivity")
          .maybeSingle(),
      ]);

      if (cancelled) return;

      if (citiesRes.error) {
        setError(citiesRes.error.message);
      } else {
        setError(null);
        setCities(citiesRes.data ?? []);
      }

      if (!closetRes.error) {
        setOwnedItems((closetRes.data ?? []).map((r) => r.name as string));
      }

      if (!prefsRes.error && prefsRes.data) {
        setPreferences(prefsRes.data as UserPreferences);
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
      <header className="mb-8">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Weather and outfit suggestions for your saved cities.
        </p>
      </header>

      {isLoaded && !isSignedIn && (
        <div className="mt-12 text-center text-gray-500 dark:text-gray-400">
          <p className="text-5xl">🔒</p>
          <p className="mt-4 text-lg">Sign in to save cities</p>
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
                ownedItems={ownedItems}
                preferences={preferences}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
