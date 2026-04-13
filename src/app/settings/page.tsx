"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "@/lib/useSupabase";
import { useEnsureUserInitialized } from "@/lib/useEnsureUserInitialized";
import {
  DEFAULT_PREFERENCES,
  SENSITIVITY_OPTIONS,
  STYLE_OPTIONS,
} from "@/lib/preferences";
import type { StylePreference, TempSensitivity, UserPreferences } from "@/types";

export default function SettingsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const supabase = useSupabase();
  useEnsureUserInitialized();

  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentlySaved, setRecentlySaved] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    (async () => {
      if (!isSignedIn) {
        if (cancelled) return;
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_preferences")
        .select("style_weekday, style_weekend, temp_sensitivity, temperature_unit")
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else if (data) {
        setPrefs(data as UserPreferences);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, supabase]);

  async function save(next: UserPreferences) {
    if (!user) return;
    const prev = prefs;
    setPrefs(next);
    const { error } = await supabase.from("user_preferences").upsert(
      {
        user_id: user.id,
        style_weekday: next.style_weekday,
        style_weekend: next.style_weekend,
        temp_sensitivity: next.temp_sensitivity,
      },
      { onConflict: "user_id" },
    );
    if (error) {
      setError(error.message);
      setPrefs(prev);
    } else {
      setError(null);
      setRecentlySaved(true);
      setTimeout(() => setRecentlySaved(false), 2000);
    }
  }

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-gray-500">
        Sign in to update your preferences.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
      <header className="mb-8">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">
          Style preferences
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Tune how outfit suggestions are generated. Changes save automatically.
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading preferences…</p>
      ) : (
        <div className="space-y-8">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="font-serif text-xl font-semibold">
              Preferred style
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Pick a different vibe for weekdays vs. weekends. Suggestions use
              today&apos;s setting.
            </p>

            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                Weekdays · Mon–Fri
              </h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {STYLE_OPTIONS.map((opt) => (
                  <RadioTile
                    key={opt.value}
                    name="style_weekday"
                    value={opt.value}
                    label={opt.label}
                    checked={prefs.style_weekday === opt.value}
                    onChange={() =>
                      save({
                        ...prefs,
                        style_weekday: opt.value as StylePreference,
                      })
                    }
                  />
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                Weekends · Sat–Sun
              </h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {STYLE_OPTIONS.map((opt) => (
                  <RadioTile
                    key={opt.value}
                    name="style_weekend"
                    value={opt.value}
                    label={opt.label}
                    checked={prefs.style_weekend === opt.value}
                    onChange={() =>
                      save({
                        ...prefs,
                        style_weekend: opt.value as StylePreference,
                      })
                    }
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="font-serif text-xl font-semibold">
              Temperature sensitivity
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Adjusts suggestions for how you experience the weather.
            </p>
            <div className="mt-4 space-y-2">
              {SENSITIVITY_OPTIONS.map((opt) => (
                <RadioTile
                  key={opt.value}
                  name="sensitivity"
                  value={opt.value}
                  label={opt.label}
                  hint={opt.hint}
                  checked={prefs.temp_sensitivity === opt.value}
                  onChange={() =>
                    save({
                      ...prefs,
                      temp_sensitivity: opt.value as TempSensitivity,
                    })
                  }
                />
              ))}
            </div>
          </section>

          <div className="h-5 text-xs text-gray-500">
            {recentlySaved && "Saved ✓"}
          </div>
        </div>
      )}
    </div>
  );
}

function RadioTile({
  name,
  value,
  label,
  hint,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
        checked
          ? "border-gray-900 bg-gray-50 dark:border-gray-100 dark:bg-gray-800"
          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 text-gray-900 focus:ring-gray-500"
      />
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && (
          <div className="text-xs text-gray-500 dark:text-gray-400">{hint}</div>
        )}
      </div>
    </label>
  );
}
