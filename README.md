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
- **AI search**: describe what you need in plain English ("warehouse for lease in Kent over 20,000 SF under $1.50/SF/month") and Claude turns it into the regular filters, with a one-line summary of how it read the request. Needs an Anthropic API key (see below).
- **Accounts and saved properties**: people sign in with an emailed link (no password) and tap the heart on any listing to save it. "Saved properties" in the account menu lists them. Needs a Supabase project (see below).
- **JSON API**: `GET /api/properties` takes the same query parameters as the search page and returns one page of results.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

### AI search setup

AI search calls the Claude API, so it needs an Anthropic API key. Without one, the AI search bar is hidden and everything else works.

- **Locally:** copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`.
- **On Vercel:** project → **Settings** → **Environment Variables**, add `ANTHROPIC_API_KEY`, then redeploy.

How it works: `POST /api/ai-search` sends the query to Claude (`src/lib/ai-search.ts`), which returns filters in a fixed schema (structured outputs). The app then runs its normal search with those filters, so Claude never invents listings. Each search costs roughly a cent or less in API usage. The route limits each visitor to 10 AI searches a minute (per server instance) and 300 characters per query.

### Sign-in and saved properties setup

Sign-in and hearts use [Supabase](https://supabase.com) (free tier) for accounts and storage. Until it's configured, the Sign in link and heart buttons are hidden.

1. **Create a project** at supabase.com.
2. **Create the table:** in the Supabase dashboard open **SQL Editor**, paste the contents of `supabase/migrations/0001_favorites.sql`, and click **Run**. It creates the `favorites` table with row-level security, so each person can only see and change their own hearts.
3. **Allow your site's address:** **Authentication → URL Configuration**. Set **Site URL** to your live site (for example `https://cerberus-xxxx.vercel.app`) and add these under **Redirect URLs**:
   - `https://YOUR-SITE/**`
   - `http://localhost:3000/**` (for local development)
4. **Add the keys to Vercel:** from **Project Settings → API Keys** (or **Data API**) copy the project URL and the publishable key (`sb_publishable_…`, or the older anon key) into Vercel environment variables `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`, then redeploy. Never use the secret key: the publishable key is sent to visitors' browsers. (`SUPABASE_ANON_KEY` and the `NEXT_PUBLIC_`-prefixed names also work.) Sign-in now works, but a link only works in the same browser that requested it.

Before real users arrive:

5. **Set up email sending:** Supabase's built-in email only sends a few messages an hour and is meant for testing. Under **Authentication → Emails → SMTP Settings**, connect an email service such as Resend, Postmark or Amazon SES.
6. **Make sign-in links work on any device:** once custom SMTP is set up, Supabase lets you edit email templates. In **Authentication → Emails**, open the **Magic Link** and **Confirm signup** templates and change the link's address from `{{ .ConfirmationURL }}` to
   `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email`
   so the line reads `<a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Log In</a>`. Save both.

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
- Saved searches and email alerts for new matching listings.
