"use client";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import L from "leaflet";
import "leaflet.markercluster";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { MapPin } from "@/lib/types";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function pinIcon(pin: MapPin, active: boolean) {
  const classes = ["price-pin", pin.listingType === "lease" ? "is-lease" : "", active ? "is-active" : ""]
    .filter(Boolean)
    .join(" ");
  return L.divIcon({
    className: classes,
    html: `<span>${escapeHtml(pin.pinLabel)}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -26],
  });
}

function clusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 34 : count < 100 ? 40 : count < 1000 ? 48 : 56;
  return L.divIcon({
    className: "cluster-pin",
    html: `<span style="width:${size}px;height:${size}px">${count}</span>`,
    iconSize: [size, size],
  });
}

function popupHtml(pin: MapPin) {
  return `<a href="/properties/${encodeURIComponent(pin.id)}" class="map-popup">
    <strong>${escapeHtml(pin.priceLabel)}</strong>
    <span>${escapeHtml(pin.summary)}</span>
    <span class="map-popup__title">${escapeHtml(pin.title)}</span>
    <span class="map-popup__address">${escapeHtml(pin.address)}</span>
    <span class="map-popup__cta">View details →</span>
  </a>`;
}

/**
 * Clustered price pins. Leaflet.markercluster is imperative, so the markers are
 * managed here rather than as React components.
 */
function ClusteredPins({
  pins,
  activeId,
  onHover,
  showPopups,
  maxZoom,
}: {
  pins: MapPin[];
  activeId: string | null;
  onHover?: (id: string | null) => void;
  showPopups: boolean;
  maxZoom: number;
}) {
  const map = useMap();
  const markers = useRef(new Map<string, L.Marker>());
  const onHoverRef = useRef(onHover);
  const activeRef = useRef<string | null>(null);
  const fittedWhileHidden = useRef(false);
  const pinsRef = useRef(pins);

  useEffect(() => {
    onHoverRef.current = onHover;
  }, [onHover]);

  const fit = useCallback(() => {
    const list = pinsRef.current;
    fittedWhileHidden.current = map.getSize().x === 0;
    if (list.length === 0) return;
    if (list.length === 1) {
      map.setView([list[0].lat, list[0].lng], maxZoom);
      return;
    }
    map.fitBounds(L.latLngBounds(list.map((p) => [p.lat, p.lng] as [number, number])), {
      padding: [40, 40],
      maxZoom,
    });
  }, [map, maxZoom]);

  // Rebuild markers whenever the result set changes.
  const key = useMemo(() => pins.map((p) => p.id).join(","), [pins]);
  useEffect(() => {
    pinsRef.current = pins;
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: clusterIcon,
      chunkedLoading: true,
    });
    markers.current.clear();
    for (const pin of pins) {
      const marker = L.marker([pin.lat, pin.lng], { icon: pinIcon(pin, false) });
      marker.on("mouseover", () => onHoverRef.current?.(pin.id));
      marker.on("mouseout", () => onHoverRef.current?.(null));
      if (showPopups) marker.bindPopup(popupHtml(pin), { minWidth: 220, maxWidth: 260 });
      markers.current.set(pin.id, marker);
    }
    group.addLayers([...markers.current.values()]);
    map.addLayer(group);
    activeRef.current = null;
    fit();
    return () => {
      map.removeLayer(group);
    };
    // `pins` is represented by `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map, showPopups, fit]);

  // Highlight the hovered listing's pin.
  useEffect(() => {
    const byId = new Map(pinsRef.current.map((p) => [p.id, p]));
    const prev = activeRef.current;
    if (prev && prev !== activeId) {
      const pin = byId.get(prev);
      const marker = markers.current.get(prev);
      if (pin && marker) {
        marker.setIcon(pinIcon(pin, false));
        marker.setZIndexOffset(0);
      }
    }
    if (activeId) {
      const pin = byId.get(activeId);
      const marker = markers.current.get(activeId);
      if (pin && marker) {
        marker.setIcon(pinIcon(pin, true));
        marker.setZIndexOffset(1000);
      }
    }
    activeRef.current = activeId;
  }, [activeId, key]);

  // Re-measure when the container is resized or shown (mobile map/list toggle).
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
  pins: MapPin[];
  activeId?: string | null;
  onHover?: (id: string | null) => void;
  /** Disable popups (used on the detail page). */
  showPopups?: boolean;
  maxZoom?: number;
  className?: string;
}

export default function PropertyMap({
  pins,
  activeId = null,
  onHover,
  showPopups = true,
  maxZoom = 14,
  className = "h-full w-full",
}: PropertyMapProps) {
  const [center] = useState<[number, number]>(() =>
    pins[0] ? [pins[0].lat, pins[0].lng] : [40, -115],
  );

  return (
    <MapContainer center={center} zoom={pins.length ? 10 : 4} scrollWheelZoom className={className}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClusteredPins
        pins={pins}
        activeId={activeId}
        onHover={onHover}
        showPopups={showPopups}
        maxZoom={maxZoom}
      />
    </MapContainer>
  );
}
