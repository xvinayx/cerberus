"use client";

import { useAuth } from "./AuthProvider";

export default function HeartButton({
  propertyId,
  title,
  variant = "overlay",
  className = "",
}: {
  propertyId: string;
  title: string;
  /** "overlay": round icon over a photo. "labeled": button with text, for detail pages. */
  variant?: "overlay" | "labeled";
  className?: string;
}) {
  const { enabled, isSaved, toggleSaved } = useAuth();
  if (!enabled) return null;

  const saved = isSaved(propertyId);
  const label = saved ? `Remove ${title} from saved properties` : `Save ${title}`;
  const icon = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.8 3.6 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.4 0 5.5 3.3 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === "labeled") {
    return (
      <button
        type="button"
        onClick={() => toggleSaved(propertyId)}
        aria-pressed={saved}
        aria-label={label}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
          saved
            ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
            : "border-slate-300 text-ink hover:border-slate-400"
        } ${className}`}
      >
        <span className={saved ? "text-rose-600" : "text-slate-600"}>{icon}</span>
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleSaved(propertyId)}
      aria-pressed={saved}
      aria-label={label}
      title={saved ? "Saved" : "Save"}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-brand-600 ${
        saved ? "text-rose-600" : "text-slate-700"
      } ${className}`}
    >
      {icon}
    </button>
  );
}
