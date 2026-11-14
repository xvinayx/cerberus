"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { filtersToSearchParams, parseFilters } from "@/lib/filters";

const EXAMPLES = [
  "Warehouse for lease in Kent over 20,000 SF under $1.50/SF/month",
  "Medical office for sale in Phoenix under $3 million",
  "Cheapest retail space for lease in Seattle",
];

export default function AiSearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The summary rides in the URL so results stay shareable; cap what we display.
  const summary = searchParams.get("ai")?.slice(0, 300) || null;
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  async function run(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || typeof body.href !== "string") {
        setError(body.error ?? "AI search failed. Try the regular filters.");
        return;
      }
      startTransition(() => router.push(body.href, { scroll: false }));
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    run(query);
  }

  function clearSummary() {
    // Keep the filters the AI chose; just drop the explanation banner.
    const qs = filtersToSearchParams(parseFilters(searchParams)).toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="border-b border-slate-200 bg-brand-50/60 px-4 py-3 sm:px-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row" role="search" aria-label="AI search">
        <label htmlFor="ai-search" className="sr-only">
          Describe the property you&apos;re looking for
        </label>
        <div className="relative min-w-0 flex-1">
          <svg
            viewBox="0 0 20 20"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-700"
            aria-hidden="true"
          >
            <path
              d="M10 2.5l1.6 4.3 4.4 1.7-4.4 1.6L10 14.5l-1.6-4.4L4 8.5l4.4-1.7L10 2.5zM15.5 13l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z"
              fill="currentColor"
            />
          </svg>
          <input
            id="ai-search"
            type="text"
            value={query}
            maxLength={300}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Describe what you need, e.g. "${EXAMPLES[0]}"`}
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="whitespace-nowrap rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {loading ? "Searching…" : "Search with AI"}
        </button>
      </form>

      <div aria-live="polite" className="text-sm">
        {error && (
          <p role="alert" className="mt-2 text-red-700">
            {error}
          </p>
        )}
        {!error && summary && (
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2 text-slate-700">
            <span className="font-semibold text-brand-800">AI search:</span>
            <span>{summary}</span>
            <span className="text-slate-500">Adjust the filters below to refine it.</span>
            <button type="button" onClick={clearSummary} className="font-medium text-brand-700 hover:underline">
              Dismiss
            </button>
          </p>
        )}
        {!error && !summary && (
          <p className="mt-2 hidden flex-wrap gap-x-3 gap-y-1 text-slate-500 sm:flex">
            <span>Try:</span>
            {EXAMPLES.slice(1).map((ex) => (
              <button
                key={ex}
                type="button"
                disabled={loading}
                onClick={() => {
                  setQuery(ex);
                  run(ex);
                }}
                className="text-brand-700 hover:underline disabled:opacity-60"
              >
                {ex}
              </button>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
