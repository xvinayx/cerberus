/**
 * Supabase settings, read on the server (and in middleware) at runtime.
 *
 * Accepts SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY (or SUPABASE_ANON_KEY), and
 * the NEXT_PUBLIC_-prefixed versions. The browser gets these values from the
 * server through AuthProvider, so no NEXT_PUBLIC_ variable is required.
 * The publishable (anon) key is meant to be public: it can only do what the
 * database's row-level security policies allow. Never use the secret key here.
 */
export interface SupabaseConfig {
  url: string;
  key: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  const env = process.env;
  return {
    url: env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "",
    key:
      env.SUPABASE_PUBLISHABLE_KEY ||
      env.SUPABASE_ANON_KEY ||
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "",
  };
}

/** Sign-in and hearts are hidden until Supabase is configured. */
export function isAuthEnabled(): boolean {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
}

/** Only allow redirects to paths on this site (no open redirects). */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
