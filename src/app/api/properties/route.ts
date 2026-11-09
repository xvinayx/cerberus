import { NextResponse, type NextRequest } from "next/server";
import { parseFilters } from "@/lib/filters";
import { searchProperties } from "@/lib/properties";

/**
 * GET /api/properties?listing=sale&types=Office,Retail&q=austin&minPrice=1000000
 * Same filters as the search page URL.
 */
export function GET(request: NextRequest) {
  const filters = parseFilters(request.nextUrl.searchParams);
  const results = searchProperties(filters);
  return NextResponse.json({ count: results.length, filters, results });
}
