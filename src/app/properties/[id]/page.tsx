import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import MapLoader from "@/components/MapLoader";
import PropertyCard from "@/components/PropertyCard";
import PropertyImage from "@/components/PropertyImage";
import {
  daysOnMarket,
  formatCurrency,
  formatListingPrice,
  formatNumber,
  formatSize,
  fullAddress,
  pricePerSquareFoot,
} from "@/lib/format";
import { getNearbyProperties, getPropertyById } from "@/lib/properties";
import type { Property } from "@/lib/types";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const property = getPropertyById((await params).id);
  if (!property) return { title: "Listing not found" };
  return {
    title: `${property.title} — ${property.type} ${property.listingType === "lease" ? "for lease" : "for sale"} in ${property.city}, ${property.state}`,
    description: property.description,
  };
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

function keyStats(p: Property): { label: string; value: string }[] {
  const stats: { label: string; value: string }[] = [];
  if (p.listingType === "sale") {
    const ppsf = pricePerSquareFoot(p);
    if (p.capRate !== null) stats.push({ label: "Cap rate", value: `${p.capRate.toFixed(2)}%` });
    if (p.noi !== null) stats.push({ label: "NOI", value: formatCurrency(p.noi) });
    if (ppsf !== null) stats.push({ label: "Price / SF", value: `$${formatNumber(Math.round(ppsf))}` });
    if (p.type === "Land") {
      stats.push({ label: "Price / acre", value: formatCurrency(Math.round((p.price ?? 0) / p.lotSizeAcres)) });
    }
  } else {
    if (p.availableSize !== null) stats.push({ label: "Available", value: `${formatNumber(p.availableSize)} SF` });
    if (p.leaseRate !== null && p.availableSize !== null) {
      stats.push({
        label: "Est. annual rent",
        value: formatCurrency(Math.round(p.leaseRate * p.availableSize)),
      });
    }
  }
  if (p.buildingSize !== null) stats.push({ label: "Building size", value: `${formatNumber(p.buildingSize)} SF` });
  stats.push({ label: "Lot size", value: `${p.lotSizeAcres.toFixed(2)} AC` });
  return stats.slice(0, 4);
}

function buildingFacts(p: Property): { label: string; value: string }[] {
  const facts: [string, string | null][] = [
    ["Property type", p.type],
    ["Listing type", p.listingType === "lease" ? "For lease" : "For sale"],
    ["Building class", p.buildingClass ? `Class ${p.buildingClass}` : null],
    ["Building size", p.buildingSize !== null ? `${formatNumber(p.buildingSize)} SF` : null],
    ["Space available", p.availableSize !== null ? `${formatNumber(p.availableSize)} SF` : null],
    ["Lot size", `${p.lotSizeAcres.toFixed(2)} acres`],
    ["Year built", p.yearBuilt !== null ? String(p.yearBuilt) : null],
    ["Floors", p.floors !== null ? String(p.floors) : null],
    ["Units", p.units !== null ? String(p.units) : null],
    ["Rooms", p.rooms !== null ? String(p.rooms) : null],
    ["Occupancy", p.occupancy !== null ? `${p.occupancy}%` : null],
    ["Parking", p.parkingSpaces !== null ? `${formatNumber(p.parkingSpaces)} spaces` : null],
    ["Zoning", p.zoning],
    ["Days on market", String(daysOnMarket(p.listedAt))],
  ];
  return facts.filter((f): f is [string, string] => f[1] !== null).map(([label, value]) => ({ label, value }));
}

export default async function PropertyPage({ params }: { params: Params }) {
  const { id } = await params;
  const property = getPropertyById(id);
  if (!property) notFound();

  const p = property;
  const nearby = getNearbyProperties(p);
  const backHref = p.listingType === "lease" ? "/?listing=lease" : "/";

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
              href={`${backHref}${backHref.includes("?") ? "&" : "?"}q=${encodeURIComponent(`${p.city}, ${p.state}`)}`}
              className="hover:text-brand-700 hover:underline"
            >
              {p.city}, {p.state}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="truncate text-ink">{p.title}</li>
        </ol>
      </nav>

      {/* Gallery */}
      <div className="grid gap-2 overflow-hidden rounded-2xl sm:grid-cols-4 sm:grid-rows-2">
        <PropertyImage id={p.id} type={p.type} className="aspect-[16/10] h-full w-full sm:col-span-2 sm:row-span-2" />
        {[1, 2, 3, 4].map((v) => (
          <PropertyImage key={v} id={p.id} type={p.type} variant={v} className="hidden aspect-[16/10] h-full w-full sm:block" />
        ))}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold text-white ${
                p.listingType === "lease" ? "bg-slate-700" : "bg-brand-700"
              }`}
            >
              {p.listingType === "lease" ? "For Lease" : "For Sale"}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{p.type}</span>
            {p.buildingClass && (
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                Class {p.buildingClass}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">{p.title}</h1>
          <p className="mt-1 text-slate-600">{fullAddress(p)}</p>

          <p className="mt-4 text-3xl font-bold text-ink">{formatListingPrice(p)}</p>
          <p className="text-sm text-slate-500">
            {formatSize(p)} · Listed {daysOnMarket(p.listedAt)} days ago
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-4">
            {keyStats(p).map((s) => (
              <div key={s.label} className="bg-white p-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{s.label}</dt>
                <dd className="mt-1 text-lg font-bold text-ink">{s.value}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-ink">About this property</h2>
            <p className="mt-2 leading-relaxed text-slate-700">{p.description}</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {p.highlights.map((h) => (
                <li key={h} className="flex gap-2 text-sm text-slate-700">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 flex-none text-brand-600" aria-hidden="true">
                    <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {h}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-ink">Property facts</h2>
            <dl className="mt-2 grid gap-x-8 sm:grid-cols-2">
              {buildingFacts(p).map((f) => (
                <Fact key={f.label} label={f.label} value={f.value} />
              ))}
            </dl>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-ink">Location</h2>
            <div className="mt-3 h-72 overflow-hidden rounded-xl border border-slate-200">
              <MapLoader properties={[p]} activeId={p.id} showPopups={false} maxZoom={14} />
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-brand-100 text-base font-bold text-brand-800">
                {p.broker.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-ink">{p.broker.name}</p>
                <p className="truncate text-sm text-slate-500">{p.broker.company}</p>
                <a href={`tel:${p.broker.phone.replace(/[^\d]/g, "")}`} className="text-sm text-brand-700 hover:underline">
                  {p.broker.phone}
                </a>
              </div>
            </div>
            <ContactForm propertyId={p.id} propertyTitle={p.title} brokerName={p.broker.name} />
          </div>
        </aside>
      </div>

      {nearby.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-ink">More listings near {p.city}</h2>
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
        Sample listing for demonstration. All properties, prices, and brokers shown are fictional.
      </p>
    </main>
  );
}
