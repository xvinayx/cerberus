/**
 * Data access layer. Everything in the app reads listings through these
 * functions, so swapping the sample data for a real listings feed or a
 * database only means changing this file.
 */
import { SAMPLE_PROPERTIES } from "./sample-data";
import type { Property, PropertyFilters } from "./types";

/** Size used for filtering and sorting: available SF for leases, building SF for sales. */
export function effectiveSize(p: Property): number | null {
  return p.listingType === "lease" ? p.availableSize : p.buildingSize;
}

/** Price used for filtering and sorting: sale price, or lease rate in $/SF/yr. */
export function effectivePrice(p: Property): number | null {
  return p.listingType === "lease" ? p.leaseRate : p.price;
}

function matchesQuery(p: Property, q: string): boolean {
  if (!q) return true;
  const haystack = [p.title, p.address, p.city, p.state, p.zip, `${p.city}, ${p.state}`, p.type]
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export function searchProperties(filters: PropertyFilters): Property[] {
  const results = SAMPLE_PROPERTIES.filter((p) => {
    if (p.listingType !== filters.listingType) return false;
    if (filters.types.length && !filters.types.includes(p.type)) return false;
    if (!matchesQuery(p, filters.q)) return false;

    const price = effectivePrice(p);
    if (filters.minPrice !== null && (price === null || price < filters.minPrice)) return false;
    if (filters.maxPrice !== null && (price === null || price > filters.maxPrice)) return false;

    const size = effectiveSize(p);
    if (filters.minSize !== null && (size === null || size < filters.minSize)) return false;
    if (filters.maxSize !== null && (size === null || size > filters.maxSize)) return false;

    if (
      filters.listingType === "sale" &&
      filters.minCapRate !== null &&
      (p.capRate === null || p.capRate < filters.minCapRate)
    ) {
      return false;
    }
    return true;
  });

  const nullsLast = (a: number | null, b: number | null, dir: 1 | -1) => {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return (a - b) * dir;
  };

  return results.sort((a, b) => {
    switch (filters.sort) {
      case "price-asc":
        return nullsLast(effectivePrice(a), effectivePrice(b), 1);
      case "price-desc":
        return nullsLast(effectivePrice(a), effectivePrice(b), -1);
      case "size-desc":
        return nullsLast(effectiveSize(a), effectiveSize(b), -1);
      case "cap-desc":
        return nullsLast(a.capRate, b.capRate, -1);
      case "newest":
      default:
        return b.listedAt.localeCompare(a.listedAt);
    }
  });
}

export function getPropertyById(id: string): Property | undefined {
  return SAMPLE_PROPERTIES.find((p) => p.id === id);
}

export function getAllPropertyIds(): string[] {
  return SAMPLE_PROPERTIES.map((p) => p.id);
}

/** Other listings in the same city, closest first. */
export function getNearbyProperties(property: Property, limit = 4): Property[] {
  const distance = (p: Property) =>
    (p.lat - property.lat) ** 2 + (p.lng - property.lng) ** 2;
  return SAMPLE_PROPERTIES.filter((p) => p.id !== property.id && p.city === property.city)
    .sort((a, b) => distance(a) - distance(b))
    .slice(0, limit);
}

export function getMarkets(): string[] {
  return [...new Set(SAMPLE_PROPERTIES.map((p) => `${p.city}, ${p.state}`))].sort();
}
