# Cerberus Commercial

A commercial real estate listings app: search office, retail, industrial,
multifamily, hospitality, mixed-use, and land listings for sale or lease on an
interactive map.

Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, and
Leaflet with OpenStreetMap tiles (no API key needed).

## Features

- **Map + list search**: price pins on the map stay in sync with the result cards (hover either one to highlight the other). On phones, a button switches between map and list.
- **Filters**: for sale or for lease, property type, price (or $/SF/yr for leases), size, minimum cap rate, and a city / address / ZIP search. Every filter is stored in the URL, so searches can be shared and the back button works.
- **Sorting**: newest, price, size, or cap rate.
- **Property detail pages**: key financials (cap rate, NOI, price/SF, estimated rent), property facts, highlights, a location map, nearby listings, and a contact-broker form.
- **JSON API**: `GET /api/properties` takes the same query parameters as the search page.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Project structure

```
src/
  app/
    page.tsx                  Search page (map + list)
    properties/[id]/page.tsx  Property detail page
    api/properties/route.ts   GET listings (same filters as the search URL)
    api/inquiries/route.ts    POST contact-broker form
  components/                 FilterBar, SearchResults, PropertyMap, PropertyCard, ...
  lib/
    types.ts                  Property and filter types
    filters.ts                URL <-> filter parsing
    properties.ts             Data access layer (search, lookup, nearby)
    sample-data.ts            Generated sample listings
    format.ts                 Currency / size formatting
```

## Sample data

The 120 listings in `src/lib/sample-data.ts` are generated from a fixed seed
and are entirely fictional, including their addresses, brokers, and numbers.
Listing images are SVG illustrations. To use real data, change the functions
in `src/lib/properties.ts`; the rest of the app reads listings only through
them.

## Not built yet

- The contact form validates and logs each inquiry on the server but doesn't deliver it. Connect it to email or a CRM in `src/app/api/inquiries/route.ts`.
- User accounts, saved properties, and saved searches.
- Clustering for map pins that overlap when zoomed out.
