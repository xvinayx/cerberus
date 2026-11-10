import { NextResponse, type NextRequest } from "next/server";
import { parseFilters } from "@/lib/filters";
import { DATA_SOURCE, PAGE_SIZE, searchProperties } from "@/lib/properties";

/**
 * GET /api/properties?listing=sale&types=Office,Retail&q=seattle&minPrice=1000000&page=2
 * Same filters as the search page URL; returns one page of results.
 */
export function GET(request: NextRequest) {
  const filters = parseFilters(request.nextUrl.searchParams);
  const results = searchProperties(filters);
  const start = (filters.page - 1) * PAGE_SIZE;
  return NextResponse.json({
    source: DATA_SOURCE,
    total: results.length,
    page: filters.page,
    pageSize: PAGE_SIZE,
    filters,
    results: results.slice(start, start + PAGE_SIZE),
  });
}
