/**
 * Data access layer. Everything in the app reads listings through these
 * functions, so changing the data source only means changing this file.
 *
 * Listings come from src/data/kidder-listings.json, which
 * `npm run import:kidder` refreshes from Kidder Mathews' public property search.
 */
import "server-only";
import data from "@/data/kidder-listings.json";
import { formatListingPrice, formatPinPrice, formatSize } from "./format";
import type { MapPin, Property, PropertyFilters } from "./types";

const LISTINGS = data.listings as Property[];
const BY_ID = new Map(LISTINGS.map((p) => [p.id, p]));

export const DATA_SOURCE = { name: data.source, fetchedAt: data.fetchedAt };
export const PAGE_SIZE = 40;

/** Price used for filtering and sorting: sale price, or lease rate in $/SF/month. */
export function effectivePrice(p: Property): number | null {
  return p.listingType === "lease" ? p.leaseRate : p.price;
}

function matchesQuery(p: Property, q: string): boolean {
  if (!q) return true;
  const haystack = [p.title, p.address, p.city, p.state, p.zip, p.type, p.subtype ?? "", ...p.brokers]
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export function searchProperties(filters: PropertyFilters): Property[] {
  const results = LISTINGS.filter((p) => {
    if (p.listingType !== filters.listingType) return false;
    if (filters.types.length && !filters.types.includes(p.type)) return false;
    if (!matchesQuery(p, filters.q)) return false;

    const price = effectivePrice(p);
    if (filters.minPrice !== null && (price === null || price < filters.minPrice)) return false;
    if (filters.maxPrice !== null && (price === null || price > filters.maxPrice)) return false;
    if (filters.minSize !== null && (p.size === null || p.size < filters.minSize)) return false;
    if (filters.maxSize !== null && (p.size === null || p.size > filters.maxSize)) return false;
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
        return nullsLast(a.size, b.size, -1);
      case "newest":
      default:
        return b.recency - a.recency;
    }
  });
}

export function toMapPin(p: Property): MapPin {
  return {
    id: p.id,
    lat: p.lat,
    lng: p.lng,
    listingType: p.listingType,
    pinLabel: formatPinPrice(p),
    priceLabel: formatListingPrice(p),
    summary: `${p.type} · ${formatSize(p)}`,
    title: p.title,
    address: `${p.address}, ${p.city}, ${p.state}`,
  };
}

export function getPropertyById(id: string): Property | undefined {
  return BY_ID.get(id);
}

/** Other listings of the same kind in the same city, closest first. */
export function getNearbyProperties(property: Property, limit = 4): Property[] {
  const distance = (p: Property) => (p.lat - property.lat) ** 2 + (p.lng - property.lng) ** 2;
  return LISTINGS.filter(
    (p) =>
      p.id !== property.id &&
      p.city === property.city &&
      p.listingType === property.listingType &&
      p.title !== property.title,
  )
    .sort((a, b) => distance(a) - distance(b))
    .slice(0, limit);
}
