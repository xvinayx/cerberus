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

function trim(value: number, digits: number): string {
  return value.toFixed(digits).replace(/\.?0+$/, "");
}

/** $1.25M, $850K, etc. */
export function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000_000) return `$${trim(value / 1_000_000_000, 2)}B`;
  if (value >= 1_000_000) return `$${trim(value / 1_000_000, value >= 10_000_000 ? 1 : 2)}M`;
  if (value >= 1_000) return `$${trim(value / 1_000, 0)}K`;
  return usd.format(value);
}

/** Lease rates are $/SF per month. */
export function formatLeaseRate(rate: number): string {
  return `${usdCents.format(rate)}/SF/mo`;
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
    return p.leaseRate !== null ? `$${p.leaseRate.toFixed(2)}/SF` : "Lease";
  }
  return p.price !== null ? formatCompactCurrency(p.price) : "Sale";
}

export function formatSize(p: Property): string {
  if (p.lotSizeAcres !== null && p.size === null) return `${formatNumber(p.lotSizeAcres)} AC`;
  return p.size !== null ? `${formatNumber(p.size)} SF` : "Size n/a";
}

export function pricePerSquareFoot(p: Property): number | null {
  if (p.listingType !== "sale" || p.price === null || !p.size) return null;
  return p.price / p.size;
}

export function fullAddress(p: Property): string {
  return `${p.address}, ${p.city}, ${p.state} ${p.zip}`;
}
