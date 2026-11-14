/**
 * Supabase settings. NEXT_PUBLIC_* values are safe to expose: the publishable
 * (anon) key only allows what the database's row-level security policies allow.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Sign-in and hearts are hidden until Supabase is configured. */
export const authEnabled = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Only allow redirects to paths on this site (no open redirects). */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}
