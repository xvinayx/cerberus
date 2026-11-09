export const PROPERTY_TYPES = [
  "Office",
  "Retail",
  "Industrial",
  "Multifamily",
  "Hospitality",
  "Mixed Use",
  "Land",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export type ListingType = "sale" | "lease";

export type BuildingClass = "A" | "B" | "C";

export interface Broker {
  name: string;
  company: string;
  phone: string;
  email: string;
}

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  listingType: ListingType;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;

  /** Sale listings: asking price in USD. */
  price: number | null;
  /** Lease listings: asking rent in USD per square foot per year. */
  leaseRate: number | null;
  /** Sale listings: net operating income in USD per year (null for land / vacant). */
  noi: number | null;
  /** Sale listings: cap rate as a percentage, e.g. 6.25. */
  capRate: number | null;

  /** Building size in square feet (null for land). */
  buildingSize: number | null;
  /** Lease listings: square feet available. */
  availableSize: number | null;
  lotSizeAcres: number;
  yearBuilt: number | null;
  buildingClass: BuildingClass | null;
  occupancy: number | null;
  floors: number | null;
  units: number | null;
  rooms: number | null;
  parkingSpaces: number | null;
  zoning: string;

  listedAt: string; // ISO date
  description: string;
  highlights: string[];
  broker: Broker;
}

export type SortOption =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "size-desc"
  | "cap-desc";

export interface PropertyFilters {
  listingType: ListingType;
  types: PropertyType[];
  q: string;
  /** Sale: price in USD. Lease: rate in $/SF/yr. */
  minPrice: number | null;
  maxPrice: number | null;
  minSize: number | null;
  maxSize: number | null;
  minCapRate: number | null;
  sort: SortOption;
}
