import {
  PROPERTY_TYPES,
  type PropertyFilters,
  type PropertyType,
  type SortOption,
} from "./types";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price (low to high)" },
  { value: "price-desc", label: "Price (high to low)" },
  { value: "size-desc", label: "Size (largest)" },
];

export const DEFAULT_FILTERS: PropertyFilters = {
  listingType: "sale",
  types: [],
  q: "",
  minPrice: null,
  maxPrice: null,
  minSize: null,
  maxSize: null,
  sort: "newest",
  page: 1,
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function num(value: string | string[] | undefined): number | null {
  const raw = first(value);
  if (raw === undefined || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Parse URL search params into a validated filter object. */
export function parseFilters(params: RawParams | URLSearchParams): PropertyFilters {
  const get = (key: string) =>
    params instanceof URLSearchParams ? params.get(key) ?? undefined : params[key];

  const types = (first(get("types")) ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter((t): t is PropertyType => (PROPERTY_TYPES as readonly string[]).includes(t));

  const sortRaw = first(get("sort"));
  const sort = SORT_OPTIONS.some((o) => o.value === sortRaw)
    ? (sortRaw as SortOption)
    : DEFAULT_FILTERS.sort;

  const page = Math.floor(num(get("page")) ?? 1);

  return {
    listingType: first(get("listing")) === "lease" ? "lease" : "sale",
    types,
    q: (first(get("q")) ?? "").trim().slice(0, 100),
    minPrice: num(get("minPrice")),
    maxPrice: num(get("maxPrice")),
    minSize: num(get("minSize")),
    maxSize: num(get("maxSize")),
    sort,
    page: page >= 1 ? page : 1,
  };
}

/** Serialize filters back into URL search params, omitting defaults. */
export function filtersToSearchParams(filters: PropertyFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.listingType !== "sale") params.set("listing", filters.listingType);
  if (filters.types.length) params.set("types", filters.types.join(","));
  if (filters.q) params.set("q", filters.q);
  if (filters.minPrice !== null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== null) params.set("maxPrice", String(filters.maxPrice));
  if (filters.minSize !== null) params.set("minSize", String(filters.minSize));
  if (filters.maxSize !== null) params.set("maxSize", String(filters.maxSize));
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}

export function countActiveFilters(filters: PropertyFilters): number {
  return [
    filters.types.length > 0,
    filters.minPrice !== null || filters.maxPrice !== null,
    filters.minSize !== null || filters.maxSize !== null,
  ].filter(Boolean).length;
}
