"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "@/lib/useSupabase";
import { useEnsureUserInitialized } from "@/lib/useEnsureUserInitialized";
import {
  CATALOG_BY_CATEGORY,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CatalogItem,
} from "@/lib/closet-catalog";
import type { ClothingCategory } from "@/types";

interface ClosetRow {
  id: string;
  name: string;
  owned: boolean;
}

export default function ClosetPage() {
  const { isLoaded, isSignedIn } = useUser();
  const supabase = useSupabase();
  useEnsureUserInitialized();

  const [rowsByName, setRowsByName] = useState<Record<string, ClosetRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    (async () => {
      if (!isSignedIn) {
        if (cancelled) return;
        setRowsByName({});
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("closet_items")
        .select("id, name, owned");

      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else {
        setError(null);
        const next: Record<string, ClosetRow> = {};
        for (const row of data ?? []) {
          next[row.name as string] = row as ClosetRow;
        }
        setRowsByName(next);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, supabase]);

  async function toggle(item: CatalogItem) {
    const existing = rowsByName[item.name];
    if (!existing) return; // seed should have created it
    const nextOwned = !existing.owned;
    setRowsByName((prev) => ({
      ...prev,
      [item.name]: { ...existing, owned: nextOwned },
    }));
    const { error } = await supabase
      .from("closet_items")
      .update({ owned: nextOwned })
      .eq("id", existing.id);
    if (error) {
      setError(error.message);
      setRowsByName((prev) => ({ ...prev, [item.name]: existing }));
    }
  }

  const ownedCount = useMemo(
    () => Object.values(rowsByName).filter((r) => r.owned).length,
    [rowsByName],
  );

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-gray-500">
        Sign in to manage your closet.
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8">
      <header className="mb-8">
        <h1 className="font-serif text-4xl font-semibold tracking-tight">
          Your closet
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Uncheck anything you don&apos;t own. Only checked items are used in
          outfit suggestions.
        </p>
        {!loading && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            {ownedCount} item{ownedCount === 1 ? "" : "s"} in your closet
          </p>
        )}
      </header>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-sm text-gray-500">Loading your closet…</div>
      )}

      {!loading && (
        <div className="grid gap-6 sm:grid-cols-2">
          {CATEGORY_ORDER.map((category) => (
            <CategorySection
              key={category}
              category={category}
              items={CATALOG_BY_CATEGORY[category]}
              rowsByName={rowsByName}
              onToggle={toggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategorySection({
  category,
  items,
  rowsByName,
  onToggle,
}: {
  category: ClothingCategory;
  items: CatalogItem[];
  rowsByName: Record<string, ClosetRow>;
  onToggle: (item: CatalogItem) => void;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h2 className="font-serif text-xl font-semibold">
        {CATEGORY_LABELS[category]}
      </h2>

      <ul className="mt-3 space-y-1.5">
        {items.map((item) => {
          const row = rowsByName[item.name];
          const owned = row?.owned ?? false;
          return (
            <li key={item.name}>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={owned}
                  onChange={() => onToggle(item)}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                <span
                  className={
                    owned
                      ? ""
                      : "text-gray-400 line-through dark:text-gray-600"
                  }
                >
                  {item.name}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
