import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ListingPhoto from "@/components/ListingPhoto";
import MapLoader from "@/components/MapLoader";
import PropertyCard from "@/components/PropertyCard";
import {
  formatCurrency,
  formatListingPrice,
  formatNumber,
  formatSize,
  fullAddress,
  pricePerSquareFoot,
} from "@/lib/format";
import { DATA_SOURCE, getNearbyProperties, getPropertyById, toMapPin } from "@/lib/properties";
import type { Property } from "@/lib/types";

type Params = Promise<{ id: string }>;

// Kidder Mathews' main line, as published on kidder.com.
const SOURCE_PHONE = { display: "877.454.3337", tel: "8774543337" };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const property = getPropertyById((await params).id);
  if (!property) return { title: "Listing not found" };
  const kind = property.listingType === "lease" ? "for lease" : "for sale";
  return {
    title: `${property.title} — ${property.type} ${kind} in ${property.city}, ${property.state}`,
    description: `${property.type} ${kind} at ${fullAddress(property)}. ${formatListingPrice(property)}, ${formatSize(property)}.`,
  };
}

function keyStats(p: Property): { label: string; value: string }[] {
  const stats: { label: string; value: string }[] = [];
  if (p.listingType === "sale") {
    const ppsf = pricePerSquareFoot(p);
    if (p.size !== null) stats.push({ label: "Building size", value: `${formatNumber(p.size)} SF` });
    if (ppsf !== null) stats.push({ label: "Price / SF", value: `$${formatNumber(Math.round(ppsf))}` });
    if (p.lotSizeAcres !== null) stats.push({ label: "Lot size", value: `${formatNumber(p.lotSizeAcres)} AC` });
    if (p.lotSizeAcres && p.price) {
      stats.push({ label: "Price / acre", value: formatCurrency(Math.round(p.price / p.lotSizeAcres)) });
    }
  } else {
    if (p.size !== null) stats.push({ label: "Available", value: `${formatNumber(p.size)} SF` });
    if (p.leaseRate !== null && p.size !== null) {
      stats.push({ label: "Est. monthly rent", value: formatCurrency(Math.round(p.leaseRate * p.size)) });
      stats.push({ label: "Est. annual rent", value: formatCurrency(Math.round(p.leaseRate * p.size * 12)) });
    }
    if (p.lotSizeAcres !== null) stats.push({ label: "Lot size", value: `${formatNumber(p.lotSizeAcres)} AC` });
  }
  if (p.buildingClass) stats.push({ label: "Building class", value: `Class ${p.buildingClass}` });
  return stats.slice(0, 4);
}

function facts(p: Property): { label: string; value: string }[] {
  const rows: [string, string | null][] = [
    ["Property type", p.type],
    ["Use", p.subtype],
    ["Listing type", p.listingType === "lease" ? (p.sublease ? "Sublease" : "For lease") : "For sale"],
    ["Net lease investment", p.netLease ? "Yes" : null],
    ["Building class", p.buildingClass ? `Class ${p.buildingClass}` : null],
    [p.listingType === "lease" ? "Space available" : "Building size", p.size !== null ? `${formatNumber(p.size)} SF` : null],
    ["Lot size", p.lotSizeAcres !== null ? `${formatNumber(p.lotSizeAcres)} acres` : null],
    ["Asking", formatListingPrice(p)],
  ];
  return rows.filter((r): r is [string, string] => r[1] !== null).map(([label, value]) => ({ label, value }));
}

export default async function PropertyPage({ params }: { params: Params }) {
  const { id } = await params;
  const property = getPropertyById(id);
  if (!property) notFound();

  const p = property;
  const nearby = getNearbyProperties(p);
  const backHref = p.listingType === "lease" ? "/?listing=lease" : "/";
  const stats = keyStats(p);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={backHref} className="hover:text-brand-700 hover:underline">
              {p.listingType === "lease" ? "For lease" : "For sale"}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`${backHref}${backHref.includes("?") ? "&" : "?"}q=${encodeURIComponent(`${p.city} ${p.state}`)}`}
              className="hover:text-brand-700 hover:underline"
            >
              {p.city}, {p.state}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="truncate text-ink">{p.title}</li>
        </ol>
      </nav>

      <div className="grid gap-2 overflow-hidden rounded-2xl md:grid-cols-[2fr_1fr]">
        <ListingPhoto
          id={p.id}
          type={p.type}
          src={p.photoUrl}
          alt={p.title}
          priority
          className="aspect-[16/10] h-full max-h-[28rem] w-full"
        />
        <div className="hidden h-full min-h-56 md:block">
          <MapLoader pins={[toMapPin(p)]} activeId={p.id} showPopups={false} maxZoom={15} />
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold text-white ${
                p.listingType === "lease" ? "bg-lease" : "bg-brand-700"
              }`}
            >
              {p.listingType === "lease" ? (p.sublease ? "Sublease" : "For Lease") : "For Sale"}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{p.type}</span>
            {p.subtype && (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{p.subtype}</span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">{p.title}</h1>
          <p className="mt-1 text-slate-600">{fullAddress(p)}</p>

          <p className="mt-4 text-3xl font-bold text-ink">{formatListingPrice(p)}</p>
          <p className="text-sm text-slate-500">{formatSize(p)}</p>

          {stats.length > 0 && (
            <dl
              className={`mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 ${
                stats.length >= 4 ? "sm:grid-cols-4" : stats.length === 3 ? "sm:grid-cols-3" : ""
              }`}
            >
              {stats.map((s) => (
                <div key={s.label} className="bg-white p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</dt>
                  <dd className="mt-1 text-lg font-bold text-ink">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <section className="mt-8">
            <h2 className="text-lg font-bold text-ink">Property facts</h2>
            <dl className="mt-2 grid gap-x-8 sm:grid-cols-2">
              {facts(p).map((f) => (
                <div key={f.label} className="flex justify-between gap-4 border-b border-slate-100 py-2.5 text-sm">
                  <dt className="text-slate-500">{f.label}</dt>
                  <dd className="text-right font-medium text-ink">{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-8 md:hidden">
            <h2 className="text-lg font-bold text-ink">Location</h2>
            <div className="mt-3 h-64 overflow-hidden rounded-xl border border-slate-200">
              <MapLoader pins={[toMapPin(p)]} activeId={p.id} showPopups={false} maxZoom={15} />
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Listing {p.brokers.length === 1 ? "broker" : "brokers"}
            </h2>
            <ul className="mt-3 space-y-3">
              {p.brokers.map((name) => (
                <li key={name} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                    {name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <span className="font-medium text-ink">{name}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-slate-500">{DATA_SOURCE.name}</p>

            <a
              href={p.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 block w-full rounded-lg bg-brand-700 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-800"
            >
              View listing &amp; contact broker ↗
            </a>
            <a
              href={`tel:${SOURCE_PHONE.tel}`}
              className="mt-2 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-ink hover:border-slate-400"
            >
              Call {SOURCE_PHONE.display}
            </a>
            <p className="mt-3 text-xs text-slate-400">
              Brochures, floor plans, and broker contact details are on {DATA_SOURCE.name}’ site.
            </p>
          </div>
        </aside>
      </div>

      {nearby.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-ink">
            More {p.listingType === "lease" ? "for lease" : "for sale"} near {p.city}
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {nearby.map((n) => (
              <li key={n.id}>
                <PropertyCard property={n} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-12 border-t border-slate-200 pt-6 text-xs text-slate-400">
        Listing courtesy of {DATA_SOURCE.name}. Information is deemed reliable but not guaranteed; confirm all
        details with the listing broker.
      </p>
    </main>
  );
}
