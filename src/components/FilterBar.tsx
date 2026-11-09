"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useOptimistic, useRef, useState, useTransition, type ReactNode } from "react";
import {
  DEFAULT_FILTERS,
  countActiveFilters,
  filtersToSearchParams,
  parseFilters,
} from "@/lib/filters";
import { formatCompactCurrency, formatNumber } from "@/lib/format";
import { PROPERTY_TYPES, type PropertyFilters, type PropertyType } from "@/lib/types";

const SALE_PRICES = [250_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000];
const LEASE_RATES = [10, 15, 20, 25, 30, 40, 50];
const SIZES = [2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000];
const CAP_RATES = [4, 5, 6, 7, 8];

function Dropdown({
  label,
  active,
  children,
  align = "left",
}: {
  label: string;
  active: boolean;
  children: ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          active
            ? "border-brand-600 bg-brand-50 text-brand-800"
            : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
        }`}
      >
        {label}
        <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
          <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          className={`absolute top-full z-[1200] mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function RangeSelect({
  label,
  value,
  options,
  format,
  placeholder,
  onChange,
}: {
  label: string;
  value: number | null;
  options: number[];
  format: (n: number) => string;
  placeholder: string;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="flex-1 text-xs font-medium text-slate-600">
      {label}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-ink"
      >
        <option value="">{placeholder}</option>
        {value !== null && !options.includes(value) && <option value={value}>{format(value)}</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {format(o)}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function FilterBar({ resultCount }: { resultCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlFilters = parseFilters(searchParams);
  // Show the new selection immediately while the server re-renders the results.
  const [filters, setOptimisticFilters] = useOptimistic(urlFilters);
  const [query, setQuery] = useState(urlFilters.q);
  const [isPending, startTransition] = useTransition();

  // Keep the search box in sync with back/forward navigation.
  useEffect(() => setQuery(urlFilters.q), [urlFilters.q]);

  const apply = (next: Partial<PropertyFilters>) => {
    const merged = { ...filters, ...next };
    const qs = filtersToSearchParams(merged).toString();
    startTransition(() => {
      setOptimisticFilters(merged);
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const isLease = filters.listingType === "lease";
  const priceFormat = isLease ? (n: number) => `$${n}/SF/yr` : formatCompactCurrency;
  const priceActive = filters.minPrice !== null || filters.maxPrice !== null;
  const sizeActive = filters.minSize !== null || filters.maxSize !== null;
  const activeCount = countActiveFilters(filters);

  const toggleType = (type: PropertyType) => {
    const types = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    apply({ types });
  };

  const typeLabel =
    filters.types.length === 0
      ? "Property type"
      : filters.types.length === 1
        ? filters.types[0]
        : `${filters.types.length} types`;

  const rangeLabel = (min: number | null, max: number | null, fmt: (n: number) => string, fallback: string) => {
    if (min !== null && max !== null) return `${fmt(min)} – ${fmt(max)}`;
    if (min !== null) return `${fmt(min)}+`;
    if (max !== null) return `Up to ${fmt(max)}`;
    return fallback;
  };

  return (
    <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <form
          role="search"
          className="relative w-full sm:w-72"
          onSubmit={(e) => {
            e.preventDefault();
            apply({ q: query.trim() });
          }}
        >
          <label htmlFor="search" className="sr-only">
            City, address, or ZIP
          </label>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="City, address, or ZIP"
            className="w-full rounded-lg border border-slate-300 py-2 pl-3 pr-10 text-sm placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            aria-label="Search"
            className="absolute right-1 top-1 rounded-md bg-brand-700 p-1.5 text-white hover:bg-brand-800"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M13 13l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </form>

        <div role="radiogroup" aria-label="Listing type" className="flex rounded-lg border border-slate-300 p-0.5">
          {(["sale", "lease"] as const).map((lt) => (
            <button
              key={lt}
              type="button"
              role="radio"
              aria-checked={filters.listingType === lt}
              onClick={() =>
                // Price and cap-rate ranges mean different things for sale vs lease, so reset them.
                apply({
                  listingType: lt,
                  minPrice: null,
                  maxPrice: null,
                  minCapRate: null,
                  sort: filters.sort === "cap-desc" ? "newest" : filters.sort,
                })
              }
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                filters.listingType === lt ? "bg-ink text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {lt === "sale" ? "For sale" : "For lease"}
            </button>
          ))}
        </div>

        <Dropdown label={typeLabel} active={filters.types.length > 0}>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink">Property type</legend>
            <div className="grid grid-cols-2 gap-2">
              {PROPERTY_TYPES.map((type) => (
                <label key={type} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={filters.types.includes(type)}
                    onChange={() => toggleType(type)}
                    className="h-4 w-4 accent-brand-700"
                  />
                  {type}
                </label>
              ))}
            </div>
          </fieldset>
        </Dropdown>

        <Dropdown
          label={rangeLabel(filters.minPrice, filters.maxPrice, priceFormat, isLease ? "Rate" : "Price")}
          active={priceActive}
        >
          <p className="mb-2 text-sm font-semibold text-ink">{isLease ? "Lease rate ($/SF/yr)" : "Asking price"}</p>
          <div className="flex gap-2">
            <RangeSelect
              label="Min"
              value={filters.minPrice}
              options={isLease ? LEASE_RATES : SALE_PRICES}
              format={priceFormat}
              placeholder="No min"
              onChange={(v) => apply({ minPrice: v })}
            />
            <RangeSelect
              label="Max"
              value={filters.maxPrice}
              options={isLease ? LEASE_RATES : SALE_PRICES}
              format={priceFormat}
              placeholder="No max"
              onChange={(v) => apply({ maxPrice: v })}
            />
          </div>
        </Dropdown>

        <Dropdown
          label={rangeLabel(filters.minSize, filters.maxSize, (n) => `${formatNumber(n)} SF`, "Size")}
          active={sizeActive}
        >
          <p className="mb-2 text-sm font-semibold text-ink">
            {isLease ? "Space available (SF)" : "Building size (SF)"}
          </p>
          <div className="flex gap-2">
            <RangeSelect
              label="Min"
              value={filters.minSize}
              options={SIZES}
              format={(n) => formatNumber(n)}
              placeholder="No min"
              onChange={(v) => apply({ minSize: v })}
            />
            <RangeSelect
              label="Max"
              value={filters.maxSize}
              options={SIZES}
              format={(n) => formatNumber(n)}
              placeholder="No max"
              onChange={(v) => apply({ maxSize: v })}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">Land listings are excluded when a size is set.</p>
        </Dropdown>

        {!isLease && (
          <Dropdown
            label={filters.minCapRate !== null ? `${filters.minCapRate}%+ cap` : "Cap rate"}
            active={filters.minCapRate !== null}
          >
            <p className="mb-2 text-sm font-semibold text-ink">Minimum cap rate</p>
            <div className="flex flex-wrap gap-2">
              {[null, ...CAP_RATES].map((rate) => (
                <button
                  key={rate ?? "any"}
                  type="button"
                  onClick={() => apply({ minCapRate: rate })}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    filters.minCapRate === rate
                      ? "border-brand-600 bg-brand-50 font-semibold text-brand-800"
                      : "border-slate-300 text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {rate === null ? "Any" : `${rate}%+`}
                </button>
              ))}
            </div>
          </Dropdown>
        )}

        {(activeCount > 0 || filters.q) && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              apply({ ...DEFAULT_FILTERS, listingType: filters.listingType, sort: filters.sort });
            }}
            className="px-2 py-2 text-sm font-medium text-brand-700 hover:underline"
          >
            Clear all
          </button>
        )}

        <span className="ml-auto text-sm text-slate-500" aria-live="polite">
          {isPending ? "Updating…" : `${resultCount} ${resultCount === 1 ? "listing" : "listings"}`}
        </span>
      </div>
    </div>
  );
}
