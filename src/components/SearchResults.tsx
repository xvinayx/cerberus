"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SORT_OPTIONS, filtersToSearchParams, parseFilters } from "@/lib/filters";
import type { MapPin, Property, SortOption } from "@/lib/types";
import MapLoader from "./MapLoader";
import PropertyCard from "./PropertyCard";

export default function SearchResults({
  properties,
  pins,
  total,
  page,
  pageCount,
  pageSize,
  source,
}: {
  /** The current page of results. */
  properties: Property[];
  /** Every matching listing, for the map. */
  pins: MapPin[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  source: { name: string; fetchedAt: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parseFilters(searchParams);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const listRef = useRef<HTMLElement>(null);

  // Scroll the list back to the top when the page or filters change.
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [searchParams]);

  const hrefFor = (overrides: Partial<ReturnType<typeof parseFilters>>) => {
    const qs = filtersToSearchParams({ ...filters, ...overrides }).toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const setSort = (sort: SortOption) => router.push(hrefFor({ sort, page: 1 }), { scroll: false });

  const kind = filters.listingType === "lease" ? "for lease" : "for sale";
  const heading = filters.q
    ? `Commercial real estate ${kind} matching “${filters.q}”`
    : `Commercial real estate ${kind}`;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const updated = new Date(source.fetchedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="relative flex min-h-0 flex-1">
      {/* Map: left on desktop, full screen toggle on mobile */}
      <div
        className={`${
          mobileView === "map" ? "block" : "hidden"
        } absolute inset-0 lg:static lg:block lg:flex-1`}
      >
        <MapLoader pins={pins} activeId={activeId} onHover={setActiveId} />
      </div>

      {/* List */}
      <section
        ref={listRef}
        aria-label="Search results"
        className={`${
          mobileView === "list" ? "block" : "hidden"
        } w-full overflow-y-auto lg:block lg:w-[min(52rem,55%)] lg:border-l lg:border-slate-200`}
      >
        <div className="px-4 py-4 sm:px-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-ink">{heading}</h1>
              <p className="text-sm text-slate-500">
                {total === 0
                  ? "No listings"
                  : `Showing ${from.toLocaleString()}–${to.toLocaleString()} of ${total.toLocaleString()} listings`}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Sort
              <select
                value={filters.sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-ink"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {properties.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <p className="font-semibold text-ink">No listings match your search</p>
              <p className="mt-1 text-sm text-slate-500">Try a different location, or remove some filters.</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {properties.map((p) => (
                <li key={p.id}>
                  <PropertyCard property={p} active={p.id === activeId} onHover={setActiveId} />
                </li>
              ))}
            </ul>
          )}

          {pageCount > 1 && (
            <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-2">
              {page > 1 ? (
                <Link
                  href={hrefFor({ page: page - 1 })}
                  scroll={false}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-300">← Previous</span>
              )}
              <span className="px-2 text-sm text-slate-600">
                Page {page} of {pageCount}
              </span>
              {page < pageCount ? (
                <Link
                  href={hrefFor({ page: page + 1 })}
                  scroll={false}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
                >
                  Next →
                </Link>
              ) : (
                <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-300">Next →</span>
              )}
            </nav>
          )}

          <p className="mt-6 pb-20 text-center text-xs text-slate-400 lg:pb-2">
            Listings courtesy of {source.name}. Updated {updated}.
          </p>
        </div>
      </section>

      {/* Mobile map/list toggle */}
      <button
        type="button"
        onClick={() => setMobileView((v) => (v === "list" ? "map" : "list"))}
        className="fixed bottom-5 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-lg lg:hidden"
      >
        {mobileView === "list" ? "Map" : "List"}
      </button>
    </div>
  );
}
