"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { City, SavedCity, TemperatureUnit, UserPreferences } from "@/types";
import CitySearch from "@/components/CitySearch";
import SortableWeatherCard from "@/components/SortableWeatherCard";
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Don't trigger drag from a click — let the remove button work.
      activationConstraint: { distance: 8 },
    }),
  );

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
          .select("id, name, country, admin1, latitude, longitude, position")
          .order("position", { ascending: true }),
        supabase
          .from("closet_items")
          .select("name, owned")
          .eq("owned", true),
        supabase
          .from("user_preferences")
          .select("style_weekday, style_weekend, temp_sensitivity, temperature_unit")
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

    // Place new cities at the top: one less than the current minimum.
    const newPosition =
      cities.length > 0
        ? Math.min(...cities.map((c) => c.position)) - 1
        : 1;

    const { data, error } = await supabase
      .from("saved_cities")
      .insert({
        user_id: user.id,
        name: city.name,
        country: city.country,
        admin1: city.admin1 ?? null,
        latitude: city.latitude,
        longitude: city.longitude,
        position: newPosition,
      })
      .select("id, name, country, admin1, latitude, longitude, position")
      .single();

    if (error) {
      setError(error.message);
      return;
    }
    if (data) {
      setCities((prev) => [data, ...prev]);
    }
  }

  async function setTemperatureUnit(unit: TemperatureUnit) {
    if (!user || preferences.temperature_unit === unit) return;
    const prev = preferences;
    setPreferences({ ...preferences, temperature_unit: unit });
    const { error } = await supabase.from("user_preferences").upsert(
      {
        user_id: user.id,
        temperature_unit: unit,
      },
      { onConflict: "user_id" },
    );
    if (error) {
      setError(error.message);
      setPreferences(prev);
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

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = cities.findIndex((c) => c.id === active.id);
    const newIndex = cities.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const prev = cities;
    const reordered = arrayMove(cities, oldIndex, newIndex).map((c, i) => ({
      ...c,
      position: i + 1,
    }));
    setCities(reordered);

    // Persist: write each row's new position. Small lists so a parallel
    // batch is fine; rolls back to the previous order if any update fails.
    const results = await Promise.all(
      reordered.map((c) =>
        supabase
          .from("saved_cities")
          .update({ position: c.position })
          .eq("id", c.id),
      ),
    );
    const firstFailure = results.find((r) => r.error);
    if (firstFailure?.error) {
      setError(firstFailure.error.message);
      setCities(prev);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">
            Today
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Weather and outfit suggestions for your saved cities. Drag to
            reorder.
          </p>
        </div>
        {isSignedIn && (
          <UnitToggle
            unit={preferences.temperature_unit}
            onChange={setTemperatureUnit}
          />
        )}
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

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={cities.map((c) => c.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {cities.map((city) => (
                  <SortableWeatherCard
                    key={city.id}
                    city={city}
                    onRemove={() => removeCity(city.id)}
                    ownedItems={ownedItems}
                    preferences={preferences}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
}

function UnitToggle({
  unit,
  onChange,
}: {
  unit: TemperatureUnit;
  onChange: (next: TemperatureUnit) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Temperature unit"
      className="inline-flex overflow-hidden rounded-full border border-gray-300 bg-white text-xs font-medium shadow-sm dark:border-gray-700 dark:bg-gray-900"
    >
      {(["fahrenheit", "celsius"] as const).map((u) => {
        const active = unit === u;
        return (
          <button
            key={u}
            type="button"
            onClick={() => onChange(u)}
            aria-pressed={active}
            className={`px-3 py-1.5 transition ${
              active
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            }`}
          >
            °{u === "fahrenheit" ? "F" : "C"}
          </button>
        );
      })}
    </div>
  );
}
