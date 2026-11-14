"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseConfig } from "@/lib/supabase/config";

interface AuthState {
  /** False when Supabase isn't configured: hide sign-in and hearts. */
  enabled: boolean;
  /** True once we know whether someone is signed in. */
  ready: boolean;
  user: User | null;
  isSaved: (propertyId: string) => boolean;
  /** Hearts or un-hearts a listing; sends signed-out visitors to sign in. */
  toggleSaved: (propertyId: string) => Promise<void>;
  error: string | null;
  /** Browser Supabase client; null when sign-in is disabled. */
  supabase: SupabaseClient | null;
}

const AuthContext = createContext<AuthState>({
  enabled: false,
  ready: true,
  user: null,
  isSaved: () => false,
  toggleSaved: async () => {},
  error: null,
  supabase: null,
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ config, children }: { config: SupabaseConfig; children: ReactNode }) {
  const router = useRouter();
  // The URL and key don't change while the page is open.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(config), []);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const userId = user?.id ?? null;
  useEffect(() => {
    if (!userId) {
      setSaved(new Set());
      return;
    }
    let cancelled = false;
    supabase
      .from("favorites")
      .select("property_id")
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError("Couldn't load your saved properties.");
          return;
        }
        setSaved(new Set((data ?? []).map((row: { property_id: string }) => row.property_id)));
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  const isSaved = useCallback((id: string) => saved.has(id), [saved]);

  const toggleSaved = useCallback(
    async (id: string) => {
      if (!userId) {
        const here = window.location.pathname + window.location.search;
        router.push(`/login?next=${encodeURIComponent(here)}`);
        return;
      }
      const wasSaved = saved.has(id);
      const flip = (on: boolean) =>
        setSaved((prev) => {
          const next = new Set(prev);
          if (on) next.add(id);
          else next.delete(id);
          return next;
        });

      flip(!wasSaved); // optimistic
      setError(null);
      const { error: err } = wasSaved
        ? await supabase.from("favorites").delete().eq("property_id", id)
        : await supabase.from("favorites").upsert({ property_id: id }, { ignoreDuplicates: true });
      if (err) {
        flip(wasSaved);
        setError(wasSaved ? "Couldn't remove that property. Try again." : "Couldn't save that property. Try again.");
      }
    },
    [router, saved, supabase, userId],
  );

  const value = useMemo<AuthState>(
    () => ({ enabled: true, ready, user, isSaved, toggleSaved, error, supabase }),
    [ready, user, isSaved, toggleSaved, error, supabase],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
