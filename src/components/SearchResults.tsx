"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SORT_OPTIONS, filtersToSearchParams, parseFilters } from "@/lib/filters";
import type { Property, SortOption } from "@/lib/types";
import MapLoader from "./MapLoader";
import PropertyCard from "./PropertyCard";

export default function SearchResults({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parseFilters(searchParams);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

  const setSort = (sort: SortOption) => {
    const qs = filtersToSearchParams({ ...filters, sort }).toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const heading = filters.q
    ? `Commercial real estate ${filters.listingType === "lease" ? "for lease" : "for sale"} matching “${filters.q}”`
    : `Commercial real estate ${filters.listingType === "lease" ? "for lease" : "for sale"}`;

  return (
    <div className="relative flex min-h-0 flex-1">
      {/* Map: left on desktop, full screen toggle on mobile */}
      <div
        className={`${
          mobileView === "map" ? "block" : "hidden"
        } absolute inset-0 lg:static lg:block lg:flex-1`}
      >
        <MapLoader properties={properties} activeId={activeId} onHover={setActiveId} />
      </div>

      {/* List */}
      <section
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
                {properties.length} {properties.length === 1 ? "listing" : "listings"}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Sort
              <select
                value={filters.sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-ink"
              >
                {SORT_OPTIONS.filter((o) => !o.saleOnly || filters.listingType === "sale").map((o) => (
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
              <p className="mt-1 text-sm text-slate-500">
                Try a different location, or remove some filters.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 pb-20 sm:grid-cols-2 lg:pb-4">
              {properties.map((p) => (
                <li key={p.id}>
                  <PropertyCard property={p} active={p.id === activeId} onHover={setActiveId} />
                </li>
              ))}
            </ul>
          )}
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
