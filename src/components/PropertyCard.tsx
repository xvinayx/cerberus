import Link from "next/link";
import type { Property } from "@/lib/types";
import {
  daysOnMarket,
  formatListingPrice,
  formatNumber,
  formatSize,
  pricePerSquareFoot,
} from "@/lib/format";
import PropertyImage from "./PropertyImage";

export default function PropertyCard({
  property: p,
  active = false,
  onHover,
}: {
  property: Property;
  active?: boolean;
  onHover?: (id: string | null) => void;
}) {
  const ppsf = pricePerSquareFoot(p);
  const dom = daysOnMarket(p.listedAt);

  return (
    <Link
      href={`/properties/${p.id}`}
      // Hover sync with the map only exists in the (client-side) search view;
      // without onHover this component also renders as a server component.
      {...(onHover && {
        onMouseEnter: () => onHover(p.id),
        onMouseLeave: () => onHover(null),
        onFocus: () => onHover(p.id),
        onBlur: () => onHover(null),
      })}
      className={`group block overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-brand-600 ${
        active ? "border-brand-600 shadow-lg" : "border-slate-200"
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <PropertyImage
          id={p.id}
          type={p.type}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex gap-1.5">
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold text-white ${
              p.listingType === "lease" ? "bg-slate-700" : "bg-brand-700"
            }`}
          >
            {p.listingType === "lease" ? "For Lease" : "For Sale"}
          </span>
          {dom <= 7 && (
            <span className="rounded bg-white/95 px-2 py-0.5 text-xs font-semibold text-ink">
              New
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-lg font-bold text-ink">{formatListingPrice(p)}</p>
          {p.capRate !== null && (
            <p className="text-sm font-semibold text-brand-700">{p.capRate.toFixed(2)}% cap</p>
          )}
        </div>
        <p className="flex flex-wrap gap-x-2 text-sm text-slate-700">
          <span className="font-medium">{p.type}</span>
          <span aria-hidden="true">·</span>
          <span>
            {formatSize(p)}
            {p.listingType === "lease" && p.type !== "Land" ? " avail." : ""}
          </span>
          {ppsf !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span>${formatNumber(Math.round(ppsf))}/SF</span>
            </>
          )}
          {p.units !== null && (
            <>
              <span aria-hidden="true">·</span>
              <span>{p.units} units</span>
            </>
          )}
        </p>
        <p className="truncate text-sm font-medium text-ink">{p.title}</p>
        <p className="truncate text-sm text-slate-500">
          {p.address}, {p.city}, {p.state} {p.zip}
        </p>
      </div>
    </Link>
  );
}
