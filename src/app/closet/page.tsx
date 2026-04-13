"use client";

import { FormEvent, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "@/lib/useSupabase";
import { useEnsureUserInitialized } from "@/lib/useEnsureUserInitialized";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/closet-seed";
import type { ClosetItem, ClothingCategory } from "@/types";

export default function ClosetPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const supabase = useSupabase();
  useEnsureUserInitialized();

  const [items, setItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    (async () => {
      if (!isSignedIn) {
        if (cancelled) return;
        setItems([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("closet_items")
        .select("id, category, name, owned")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else {
        setError(null);
        setItems((data ?? []) as ClosetItem[]);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, supabase]);

  async function toggleOwned(item: ClosetItem) {
    const nextOwned = !item.owned;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, owned: nextOwned } : i)),
    );
    const { error } = await supabase
      .from("closet_items")
      .update({ owned: nextOwned })
      .eq("id", item.id);
    if (error) {
      setError(error.message);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, owned: item.owned } : i)),
      );
    }
  }

  async function deleteItem(item: ClosetItem) {
    const prev = items;
    setItems((current) => current.filter((i) => i.id !== item.id));
    const { error } = await supabase
      .from("closet_items")
      .delete()
      .eq("id", item.id);
    if (error) {
      setError(error.message);
      setItems(prev);
    }
  }

  async function addItem(category: ClothingCategory, name: string) {
    if (!user) return;
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return;
    if (items.some((i) => i.category === category && i.name === trimmed)) {
      return;
    }

    const { data, error } = await supabase
      .from("closet_items")
      .insert({
        user_id: user.id,
        category,
        name: trimmed,
        owned: true,
      })
      .select("id, category, name, owned")
      .single();

    if (error) {
      setError(error.message);
      return;
    }
    if (data) {
      setItems((prev) =>
        [...prev, data as ClosetItem].sort((a, b) =>
          a.category === b.category
            ? a.name.localeCompare(b.name)
            : a.category.localeCompare(b.category),
        ),
      );
    }
  }

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center text-gray-500">
        Sign in to manage your closet.
      </div>
    );
  }

  const grouped = Object.fromEntries(
    CATEGORY_ORDER.map((c) => [c, items.filter((i) => i.category === c)]),
  ) as Record<ClothingCategory, ClosetItem[]>;

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
              items={grouped[category]}
              onToggle={toggleOwned}
              onDelete={deleteItem}
              onAdd={(name) => addItem(category, name)}
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
  onToggle,
  onDelete,
  onAdd,
}: {
  category: ClothingCategory;
  items: ClosetItem[];
  onToggle: (item: ClosetItem) => void;
  onDelete: (item: ClosetItem) => void;
  onAdd: (name: string) => void;
}) {
  const [draft, setDraft] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h2 className="font-serif text-xl font-semibold">
        {CATEGORY_LABELS[category]}
      </h2>

      <ul className="mt-3 space-y-1.5">
        {items.length === 0 && (
          <li className="text-sm text-gray-500">No items yet.</li>
        )}
        {items.map((item) => (
          <li key={item.id} className="group flex items-center gap-2">
            <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.owned}
                onChange={() => onToggle(item)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              <span
                className={
                  item.owned
                    ? ""
                    : "text-gray-400 line-through dark:text-gray-600"
                }
              >
                {item.name}
              </span>
            </label>
            <button
              onClick={() => onDelete(item)}
              className="rounded p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-600 opacity-0 group-hover:opacity-100 dark:hover:bg-gray-800"
              aria-label={`Remove ${item.name}`}
              title="Remove from closet"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add an item…"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none dark:border-gray-700 dark:bg-gray-950"
        />
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          Add
        </button>
      </form>
    </section>
  );
}
