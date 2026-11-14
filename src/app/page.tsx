import { Suspense } from "react";
import AiSearchBar from "@/components/AiSearchBar";
import FilterBar from "@/components/FilterBar";
import { aiSearchConfigured } from "@/lib/ai-search";
import SearchResults from "@/components/SearchResults";
import { parseFilters } from "@/lib/filters";
import { DATA_SOURCE, PAGE_SIZE, searchProperties, toMapPin } from "@/lib/properties";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);
  const results = searchProperties(filters);
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(filters.page, pageCount);
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <Suspense>
        {aiSearchConfigured() && <AiSearchBar />}
        <FilterBar resultCount={results.length} />
        <SearchResults
          properties={pageItems}
          pins={results.map(toMapPin)}
          total={results.length}
          page={page}
          pageCount={pageCount}
          pageSize={PAGE_SIZE}
          source={DATA_SOURCE}
        />
      </Suspense>
    </main>
  );
}
