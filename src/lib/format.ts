import type { Property } from "./types";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value: number) => usd.format(value);
export const formatNumber = (value: number) => value.toLocaleString("en-US");

/** $1.25M, $850K, etc. */
export function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${trim(value / 1_000_000_000, 2)}B`;
  if (value >= 1_000_000) return `$${trim(value / 1_000_000, value >= 10_000_000 ? 1 : 2)}M`;
  if (value >= 1_000) return `$${trim(value / 1_000, 0)}K`;
  return usd.format(value);
}

function trim(value: number, digits: number): string {
  return value.toFixed(digits).replace(/\.?0+$/, "");
}

export function formatLeaseRate(rate: number): string {
  return `${usdCents.format(rate)}/SF/yr`;
}

/** Headline price for a card or detail page. */
export function formatListingPrice(p: Property): string {
  if (p.listingType === "lease") {
    return p.leaseRate !== null ? formatLeaseRate(p.leaseRate) : "Contact for rate";
  }
  return p.price !== null ? formatCurrency(p.price) : "Contact for price";
}

/** Short label used on map pins. */
export function formatPinPrice(p: Property): string {
  if (p.listingType === "lease") {
    return p.leaseRate !== null ? `$${trim(p.leaseRate, 2)}/SF` : "Lease";
  }
  return p.price !== null ? formatCompactCurrency(p.price) : "Sale";
}

export function formatSize(p: Property): string {
  if (p.type === "Land") return `${p.lotSizeAcres.toFixed(2)} AC`;
  const size = p.listingType === "lease" ? p.availableSize : p.buildingSize;
  return size !== null ? `${formatNumber(size)} SF` : "—";
}

export function pricePerSquareFoot(p: Property): number | null {
  if (p.listingType !== "sale" || p.price === null || !p.buildingSize) return null;
  return p.price / p.buildingSize;
}

export function daysOnMarket(listedAt: string, now = new Date()): number {
  const listed = new Date(`${listedAt}T00:00:00Z`).getTime();
  return Math.max(0, Math.floor((now.getTime() - listed) / 86_400_000));
}

export function fullAddress(p: Property): string {
  return `${p.address}, ${p.city}, ${p.state} ${p.zip}`;
}
