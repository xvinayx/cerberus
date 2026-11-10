# Cerberus Commercial

A commercial real estate listings app: search office, industrial, retail, land,
multifamily, healthcare and other commercial listings for sale or lease on an
interactive map. Listings come from Kidder Mathews (used with their permission).

Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, and
Leaflet with OpenStreetMap tiles (no API key needed).

## Features

- **Map + list search**: price pins on the map stay in sync with the result cards (hover either one to highlight the other), and nearby pins group into clusters. The list shows 40 listings per page. On phones, a button switches between map and list.
- **Filters**: for sale or for lease, property type, price (or $/SF/month for leases), size, and a search box that matches city, address, ZIP, property name, or broker. Every filter is stored in the URL, so searches can be shared and the back button works.
- **Sorting**: newest, price, or size.
- **Property detail pages**: listing photo, price/SF or estimated rent, property facts, a location map, listing brokers, a link to the full listing on kidder.com, and nearby listings.
- **JSON API**: `GET /api/properties` takes the same query parameters as the search page and returns one page of results.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Project structure

```
scripts/
  fetch-kidder-listings.cjs   Refreshes the listing data (see below)
src/
  data/kidder-listings.json   Listing data used by the app
  app/
    page.tsx                  Search page (map + list)
    properties/[id]/page.tsx  Property detail page
    api/properties/route.ts   GET listings (same filters as the search URL)
  components/                 FilterBar, SearchResults, PropertyMap, PropertyCard, ...
  lib/
    types.ts                  Property and filter types
    filters.ts                URL <-> filter parsing
    properties.ts             Data access layer (search, lookup, nearby)
    format.ts                 Currency / size formatting
```

## Listing data

Listings are stored in `src/data/kidder-listings.json` and come from Kidder
Mathews' public property search at https://kidder.com/property-search/, used
with Kidder Mathews' permission. To refresh them:

```bash
npm run import:kidder
```

The script needs Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`).
It opens Kidder's search page in a headless browser, switches between "For Lease"
and "For Sale", saves the search results that the page loads, and normalizes them.
It reads only search results, never individual listing detail records. Commit the
updated JSON file to publish the new data.

Notes on the data:
- Lease rates are asking rent in dollars per square foot **per month**, as Kidder publishes them.
- Listings without a price or rate show "Contact for price/rate", matching Kidder's "Call Broker".
- Kidder's search results don't include cap rate, NOI, year built, or descriptions, so the app doesn't show them.
- Photos load directly from Kidder's image host.
- Inquiries go to Kidder Mathews: each detail page links to the listing on kidder.com and their main phone line.
- The app reads listings only through `src/lib/properties.ts`, so switching to an official feed means changing that file.

## Not built yet

- Scheduled data refreshes (for example, a nightly GitHub Action that runs the import).
- User accounts, saved properties, and saved searches.
