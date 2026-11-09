import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import SearchResults from "@/components/SearchResults";
import { parseFilters } from "@/lib/filters";
import { searchProperties } from "@/lib/properties";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);
  const properties = searchProperties(filters);

  return (
    <main className="flex h-[calc(100dvh-3.5rem)] flex-col">
      <Suspense>
        <FilterBar resultCount={properties.length} />
        <SearchResults properties={properties} />
      </Suspense>
    </main>
  );
}
