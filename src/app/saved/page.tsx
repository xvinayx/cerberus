import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PropertyCard from "@/components/PropertyCard";
import { getPropertyById } from "@/lib/properties";
import { isAuthEnabled } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// Depends on who is signed in and on runtime settings: never pre-build it.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Saved properties" };

export default async function SavedPage() {
  if (!isAuthEnabled()) notFound();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/saved");

  const { data: rows, error } = await supabase
    .from("favorites")
    .select("property_id, created_at")
    .order("created_at", { ascending: false });

  const ids: string[] = (rows ?? []).map((r: { property_id: string }) => r.property_id);
  const properties = ids.map(getPropertyById).filter((p) => p !== undefined);
  const unavailable = ids.length - properties.length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">Saved properties</h1>
      <p className="mt-1 text-sm text-slate-500">
        {properties.length} {properties.length === 1 ? "property" : "properties"}
        {unavailable > 0 && ` · ${unavailable} no longer listed`}
      </p>

      {error ? (
        <p role="alert" className="mt-8 text-sm text-red-700">
          Couldn&apos;t load your saved properties. Refresh the page to try again.
        </p>
      ) : properties.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <p className="font-semibold text-ink">No saved properties yet</p>
          <p className="mt-1 text-sm text-slate-500">Tap the heart on any listing to save it here.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Browse listings
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <li key={p.id}>
              <PropertyCard property={p} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
