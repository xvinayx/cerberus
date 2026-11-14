/**
 * Natural-language search: Claude turns a query like "industrial over 20,000 SF
 * in Kent under $1.50/SF/mo" into the same filters the search page already
 * uses. Claude never sees or returns listings; the normal search does that.
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod/v4";
import { DEFAULT_FILTERS } from "./filters";
import { getMarkets } from "./properties";
import { PROPERTY_TYPES, type PropertyFilters } from "./types";

const MODEL = "claude-opus-5-5";

const SearchFiltersSchema = z.object({
  listingType: z.enum(["sale", "lease"]),
  propertyTypes: z.array(z.enum(PROPERTY_TYPES)),
  location: z.string(),
  minPrice: z.number().nullable(),
  maxPrice: z.number().nullable(),
  minSize: z.number().nullable(),
  maxSize: z.number().nullable(),
  sort: z.enum(["newest", "price-asc", "price-desc", "size-desc"]),
  summary: z.string(),
});

type AiFilters = z.infer<typeof SearchFiltersSchema>;

function systemPrompt(): string {
  return `You turn a person's description of the commercial property they want into search filters for a listings site. The site has Kidder Mathews listings for sale and for lease, mostly in Washington, California, Arizona, Oregon, Nevada and Texas.

Fill in the filters like this:
- listingType: "lease" if they want to rent or lease space, or mention rent or a rate per square foot; otherwise "sale" (buying, investing, a price in dollars).
- propertyTypes: the matching types from the allowed list, or an empty list for any type. A warehouse or distribution or flex space is Industrial; medical or dental office is Healthcare; a lab is Life Science; an apartment building is Multifamily; a hotel is Hospitality; a lot, parcel or acreage is Land; a church is Religious; a school is Educational.
- location: one place to search for, written as words that appear in a listing's address, such as "Kent WA", "Seattle", "Phoenix AZ" or a ZIP code. Use the exact city spelling from the markets list below when one matches, plus the state code. For a neighborhood or region, use the main city it belongs to. If they name several places, use the one they seem most interested in and say so in the summary. Use "" when they name no place.
- minPrice / maxPrice: for sale listings, the asking price in US dollars. For lease listings, the rent in dollars per square foot per month: convert a yearly rate by dividing by 12 (for example $24/SF/yr is 2). Use null when they give no limit. "Under $2M" means maxPrice 2000000.
- minSize / maxSize: building size (for sale) or space available (for lease) in square feet. Use null when they give no limit. Land is measured in acres and has no square footage, so leave size empty for land and mention that in the summary.
- sort: "price-asc" when they want the cheapest, "size-desc" when they want the biggest, "price-desc" when they want the most expensive; otherwise "newest".
- summary: one short plain sentence describing the search you set up, for example "Industrial space for lease in Kent, WA, at least 20,000 SF, up to $1.50/SF/month." Mention anything you could not search for, such as cap rate, parking or year built, which this site doesn't track.

If the request isn't about finding commercial property, return the default filters (sale, no types, empty location, no limits, newest) and say in the summary that you can only search for commercial property.

Markets with listings:
${getMarkets().join("; ")}`;
}

let cachedSystem: string | null = null;
let client: Anthropic | null = null;

export class AiSearchError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function aiSearchConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function interpretSearch(
  query: string,
): Promise<{ filters: PropertyFilters; summary: string }> {
  if (!aiSearchConfigured()) {
    throw new AiSearchError("AI search isn't set up yet. Add an ANTHROPIC_API_KEY to enable it.", 503);
  }
  client ??= new Anthropic({ timeout: 30_000, maxRetries: 1 });
  cachedSystem ??= systemPrompt();

  let response;
  try {
    response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 2_000,
      // Extraction is simple; low effort keeps search fast.
      output_config: { effort: "low", format: betaZodOutputFormat(SearchFiltersSchema) },
      // If a request is declined for policy reasons, let the API retry it on a fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: cachedSystem, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: query }],
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      throw new AiSearchError("AI search is busy right now. Try again in a moment.", 429);
    }
    if (error instanceof Anthropic.AuthenticationError) {
      throw new AiSearchError("AI search is misconfigured: the API key was rejected.", 503);
    }
    if (error instanceof Anthropic.APIError) {
      throw new AiSearchError("AI search is unavailable right now. Try the regular filters.", 502);
    }
    throw error;
  }

  if (response.stop_reason === "refusal") {
    throw new AiSearchError("AI search couldn't help with that request. Try describing the property you want.", 422);
  }
  const parsed: AiFilters | null = response.parsed_output;
  if (!parsed) {
    throw new AiSearchError("AI search couldn't understand that. Try rephrasing, or use the filters.", 502);
  }

  const positiveOrNull = (n: number | null) => (n !== null && Number.isFinite(n) && n > 0 ? n : null);
  const filters: PropertyFilters = {
    ...DEFAULT_FILTERS,
    listingType: parsed.listingType,
    types: [...new Set(parsed.propertyTypes)],
    q: parsed.location.trim().slice(0, 100),
    minPrice: positiveOrNull(parsed.minPrice),
    maxPrice: positiveOrNull(parsed.maxPrice),
    minSize: positiveOrNull(parsed.minSize),
    maxSize: positiveOrNull(parsed.maxSize),
    sort: parsed.sort,
  };
  return { filters, summary: parsed.summary.trim().slice(0, 300) };
}
