"use client";

import { useState } from "react";
import type { PropertyType } from "@/lib/types";
import PropertyImage from "./PropertyImage";

/** Listing photo with a drawn illustration as fallback when there is none or it fails to load. */
export default function ListingPhoto({
  id,
  type,
  src,
  alt,
  className = "",
  priority = false,
}: {
  id: string;
  type: PropertyType;
  src: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <PropertyImage id={id} type={type} className={className} />;
  }

  return (
    // Photos are hosted by the listing source; plain <img> avoids proxying them.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`bg-slate-100 object-cover ${className}`}
    />
  );
}
