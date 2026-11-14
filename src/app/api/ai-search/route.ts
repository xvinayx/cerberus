import { NextResponse, type NextRequest } from "next/server";
import { AiSearchError, interpretSearch } from "@/lib/ai-search";
import { filtersToSearchParams } from "@/lib/filters";

const MAX_QUERY_LENGTH = 300;

// Best-effort per-IP limit so the public endpoint can't run up the API bill.
// It lives in one server instance's memory; use a shared store (e.g. Upstash)
// for a hard limit across instances.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5_000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

/**
 * POST /api/ai-search  { "query": "industrial in Kent over 20,000 SF" }
 * Returns the filters Claude chose, a one-line summary, and the search URL.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many AI searches. Wait a minute and try again." }, { status: 429 });
  }

  let query = "";
  try {
    const body = await request.json();
    query = typeof body?.query === "string" ? body.query.trim() : "";
  } catch {
    // Fall through to the empty-query error.
  }
  if (!query) {
    return NextResponse.json({ error: "Describe the property you're looking for." }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Keep the description under ${MAX_QUERY_LENGTH} characters.` },
      { status: 400 },
    );
  }

  try {
    const { filters, summary } = await interpretSearch(query);
    const params = filtersToSearchParams(filters);
    params.set("ai", summary);
    return NextResponse.json({ filters, summary, href: `/?${params.toString()}` });
  } catch (error) {
    if (error instanceof AiSearchError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[ai-search]", error);
    return NextResponse.json({ error: "AI search failed. Try the regular filters." }, { status: 500 });
  }
}
