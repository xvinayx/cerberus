"use client";

import dynamic from "next/dynamic";
import type { PropertyMapProps } from "./PropertyMap";

// Leaflet touches `window`, so the map is only rendered in the browser.
const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

export default function MapLoader(props: PropertyMapProps) {
  return <PropertyMap {...props} />;
}
