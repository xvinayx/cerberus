import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseConfig } from "./config";

/** Supabase client for the browser. The session lives in cookies the server can read. */
export function createClient({ url, key }: SupabaseConfig) {
  return createBrowserClient(url, key);
}
