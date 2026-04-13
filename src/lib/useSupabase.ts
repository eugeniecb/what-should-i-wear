"use client";

import { useSession } from "@clerk/nextjs";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useMemo } from "react";

/**
 * Returns a Supabase client that attaches the current Clerk session token
 * to every request. RLS policies can then match `auth.jwt() ->> 'sub'`
 * against the authenticated user's Clerk ID.
 */
export function useSupabase(): SupabaseClient {
  const { session } = useSession();

  return useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          accessToken: async () => (await session?.getToken()) ?? null,
        },
      ),
    [session],
  );
}
