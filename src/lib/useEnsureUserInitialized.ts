"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "@/lib/useSupabase";
import { CATALOG } from "@/lib/closet-catalog";
import { DEFAULT_PREFERENCES } from "@/lib/preferences";

/**
 * On a signed-in user's first mount of the session, ensure that their
 * closet is seeded with the default catalog and that a user_preferences
 * row exists. Safe to call from multiple pages — guarded by a per-user ref
 * and idempotent inserts (unique constraint on closet_items, upsert on prefs).
 */
export function useEnsureUserInitialized() {
  const { user, isLoaded, isSignedIn } = useUser();
  const supabase = useSupabase();
  const seededFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (seededFor.current === user.id) return;
    seededFor.current = user.id;

    (async () => {
      // 1. Seed closet if empty.
      const { count, error: countErr } = await supabase
        .from("closet_items")
        .select("id", { count: "exact", head: true });

      if (countErr) {
        seededFor.current = null; // allow retry
        return;
      }

      if ((count ?? 0) === 0) {
        const rows = CATALOG.map((item) => ({
          user_id: user.id,
          category: item.category,
          name: item.name,
          owned: true,
        }));
        await supabase.from("closet_items").insert(rows);
      }

      // 2. Upsert default preferences if missing.
      await supabase.from("user_preferences").upsert(
        {
          user_id: user.id,
          ...DEFAULT_PREFERENCES,
        },
        { onConflict: "user_id", ignoreDuplicates: true },
      );
    })();
  }, [isLoaded, isSignedIn, user, supabase]);
}
