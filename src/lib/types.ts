export const PROPERTY_TYPES = [
  "Office",
  "Industrial",
  "Retail",
  "Land",
  "Multifamily",
  "Healthcare",
  "Life Science",
  "Hospitality",
  "Educational",
  "Religious",
  "Other",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export type ListingType = "sale" | "lease";

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  /** Finer-grained use, e.g. "Warehouse Office" or "Neighborhood Center". */
  subtype: string | null;
  listingType: ListingType;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;

  /** Sale listings: asking price in USD (null = contact broker). */
  price: number | null;
  /** Lease listings: asking rent in USD per square foot per month (null = contact broker). */
  leaseRate: number | null;
  /** Square feet: building size for sales, space available for leases. Null for land. */
  size: number | null;
  /** Land listings: lot size in acres. */
  lotSizeAcres: number | null;
  buildingClass: string | null;
  sublease: boolean;
  netLease: boolean;

  photoUrl: string | null;
  brokers: string[];
  /** The listing on the source website. */
  sourceUrl: string;
  /** Higher = listed more recently. */
  recency: number;
}

export type SortOption = "newest" | "price-asc" | "price-desc" | "size-desc";

export interface PropertyFilters {
  listingType: ListingType;
  types: PropertyType[];
  q: string;
  /** Sale: price in USD. Lease: rent in $/SF/month. */
  minPrice: number | null;
  maxPrice: number | null;
  minSize: number | null;
  maxSize: number | null;
  sort: SortOption;
  page: number;
}

/** Slim data sent to the map, so the browser doesn't download every listing field. */
export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  listingType: ListingType;
  pinLabel: string;
  priceLabel: string;
  summary: string;
  title: string;
  address: string;
}
