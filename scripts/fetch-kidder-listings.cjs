#!/usr/bin/env node
/**
 * Refreshes src/data/kidder-listings.json from Kidder Mathews' public
 * property search (used with Kidder Mathews' permission).
 *
 * It opens https://kidder.com/properties/index.html in a headless browser the
 * way a visitor would, switches between "For Lease" and "For Sale", and keeps
 * the search results the page itself loads. It only reads search results:
 * never per-listing detail records.
 *
 * Usage:  npm run import:kidder
 * Needs:  Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`)
 */
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const SEARCH_URL = "https://kidder.com/properties/index.html";
const OUT_FILE = path.join(__dirname, "..", "src", "data", "kidder-listings.json");

const TYPE_MAP = {
  office: "Office",
  industrial: "Industrial",
  retail: "Retail",
  multifamily: "Multifamily",
  hospitality: "Hospitality",
  land: "Land",
  healthcare: "Healthcare",
  "life science": "Life Science",
  educational: "Educational",
  religious: "Religious",
};

const clean = (s) => (typeof s === "string" ? s.replace(/\s+/g, " ").trim() : "");
const positive = (n) => (typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null);

/** "warehouseOffice" -> "Warehouse Office" */
function humanize(code) {
  if (!code) return null;
  return code
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

function normalize(raw, listingType) {
  const type = TYPE_MAP[clean(raw.use_type).toLowerCase()] ?? "Other";
  const sf = positive(raw.sf_avail);
  const isLand = type === "Land";
  const address = clean(raw.property_address);
  return {
    id: `km-${raw.listing_key}`,
    title: clean(raw.property_name) || clean(raw.building_name) || address,
    type,
    subtype: humanize(raw.speciality_type),
    listingType,
    address,
    city: clean(raw.city),
    state: clean(raw.state_code),
    zip: clean(raw.zip_postal_code),
    lat: Math.round(raw.latitude * 1e6) / 1e6,
    lng: Math.round(raw.longitude * 1e6) / 1e6,
    price: listingType === "sale" ? positive(raw.list_price) : null,
    // Kidder publishes asking rent in $/SF per month.
    leaseRate: listingType === "lease" ? positive(raw.asking_rent_max) : null,
    size: isLand ? null : sf,
    lotSizeAcres: isLand && sf ? Math.round((sf / 43_560) * 100) / 100 : null,
    buildingClass: clean(raw.bldg_class).toUpperCase() || null,
    sublease: raw.sublease_flg === true,
    netLease: raw.retail_investment_nnn_flg === true,
    photoUrl: raw.listing_photo || raw.property_photo || null,
    brokers: (raw.brokers ?? []).map(clean).filter(Boolean),
    sourceUrl: `https://kidder.com/properties/single.html?listing=${raw.listing_key}&property=${raw.property_key}`,
    recency: raw.listing_key,
  };
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const results = {};

  page.on("response", async (res) => {
    if (!res.url().endsWith("/search/public/listing") || res.request().method() !== "POST") return;
    try {
      const criteria = JSON.parse(res.request().postData()).searchCriteria.listingTypeCriteria;
      const key = criteria.forSale ? "sale" : criteria.forLease ? "lease" : null;
      if (key) results[key] = (await res.json()).results;
    } catch {
      // Ignore responses we can't parse; missing data is reported below.
    }
  });

  for (const [listingType, label] of [["lease", "For Lease"], ["sale", "For Sale"]]) {
    await page.goto(`${SEARCH_URL}?listType=${listingType}`, { waitUntil: "networkidle", timeout: 90_000 });
    if (!results[listingType]) {
      await page.click(`label.radio-toggle:has(input[value="${label}"])`);
      await page.waitForLoadState("networkidle");
    }
    await page.waitForTimeout(2_000);
  }
  await browser.close();

  for (const key of ["sale", "lease"]) {
    if (!Array.isArray(results[key]) || results[key].length === 0) {
      throw new Error(`No ${key} listings were captured; the Kidder page may have changed.`);
    }
  }

  const listings = [];
  let skipped = 0;
  for (const key of ["sale", "lease"]) {
    for (const raw of results[key]) {
      if (typeof raw.latitude !== "number" || typeof raw.longitude !== "number") {
        skipped++;
        continue;
      }
      listings.push(normalize(raw, key));
    }
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(
    OUT_FILE,
    JSON.stringify({ source: "Kidder Mathews", fetchedAt: new Date().toISOString(), listings }) + "\n",
  );
  console.log(
    `Saved ${listings.length} listings (${results.sale.length} sale, ${results.lease.length} lease; ` +
      `${skipped} skipped without coordinates) to ${path.relative(process.cwd(), OUT_FILE)}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
