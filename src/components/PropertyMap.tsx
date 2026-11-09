"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { Property } from "@/lib/types";
import { formatListingPrice, formatPinPrice, formatSize } from "@/lib/format";

function pinIcon(p: Property, active: boolean) {
  const classes = ["price-pin", p.listingType === "lease" ? "is-lease" : "", active ? "is-active" : ""]
    .filter(Boolean)
    .join(" ");
  return L.divIcon({
    className: classes,
    html: `<span>${formatPinPrice(p)}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -26],
  });
}

/**
 * Fit the map to the results whenever they change, and re-measure when the
 * container is resized or shown (e.g. the mobile map/list toggle). If the last
 * fit happened while the map was hidden, fit again once it has a size.
 */
function FitToProperties({ properties, maxZoom }: { properties: Property[]; maxZoom: number }) {
  const map = useMap();
  const key = properties.map((p) => p.id).join(",");
  const propertiesRef = useRef(properties);
  propertiesRef.current = properties;
  const fittedWhileHidden = useRef(false);

  const fit = useCallback(() => {
    const list = propertiesRef.current;
    fittedWhileHidden.current = map.getSize().x === 0;
    if (list.length === 0) return;
    if (list.length === 1) {
      map.setView([list[0].lat, list[0].lng], maxZoom);
      return;
    }
    const bounds = L.latLngBounds(list.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom });
  }, [map, maxZoom]);

  useEffect(() => {
    fit();
  }, [key, fit]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      if (fittedWhileHidden.current && map.getSize().x > 0) fit();
    });
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map, fit]);

  return null;
}

export interface PropertyMapProps {
  properties: Property[];
  activeId?: string | null;
  onHover?: (id: string | null) => void;
  /** Disable popups (used on the detail page). */
  showPopups?: boolean;
  maxZoom?: number;
  className?: string;
}

export default function PropertyMap({
  properties,
  activeId = null,
  onHover,
  showPopups = true,
  maxZoom = 13,
  className = "h-full w-full",
}: PropertyMapProps) {
  const center = useMemo<[number, number]>(
    () => (properties[0] ? [properties[0].lat, properties[0].lng] : [39.5, -98.35]),
    // Only used for the initial render; FitToProperties handles later changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <MapContainer
      center={center}
      zoom={properties.length ? 11 : 4}
      scrollWheelZoom
      className={className}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToProperties properties={properties} maxZoom={maxZoom} />
      {properties.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={pinIcon(p, p.id === activeId)}
          zIndexOffset={p.id === activeId ? 1000 : 0}
          eventHandlers={{
            mouseover: () => onHover?.(p.id),
            mouseout: () => onHover?.(null),
          }}
        >
          {showPopups && (
            <Popup>
              <Link href={`/properties/${p.id}`} className="block p-3 !text-ink no-underline">
                <span className="block text-base font-bold">{formatListingPrice(p)}</span>
                <span className="block text-sm">
                  {p.type} · {formatSize(p)}
                  {p.capRate !== null ? ` · ${p.capRate.toFixed(2)}% cap` : ""}
                </span>
                <span className="mt-1 block truncate text-sm font-medium">{p.title}</span>
                <span className="block truncate text-xs text-slate-500">
                  {p.address}, {p.city}, {p.state}
                </span>
                <span className="mt-2 block text-sm font-semibold !text-brand-700">View details →</span>
              </Link>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}
