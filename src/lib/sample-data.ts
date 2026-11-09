/**
 * Deterministic sample listings so the app works end to end without a live
 * data feed. Every name, address, broker and number here is fictional.
 *
 * To plug in a real provider, replace the implementation in `properties.ts`;
 * nothing else imports this file.
 */
import type {
  BuildingClass,
  ListingType,
  Property,
  PropertyType,
} from "./types";

// Small seeded PRNG (mulberry32) so the data is identical on every build.
function createRandom(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(20261109);
const between = (min: number, max: number) => min + random() * (max - min);
const int = (min: number, max: number) => Math.floor(between(min, max + 1));
const pick = <T,>(items: readonly T[]): T => items[Math.floor(random() * items.length)];
const roundTo = (value: number, step: number) => Math.round(value / step) * step;

interface Market {
  city: string;
  state: string;
  lat: number;
  lng: number;
  /** Offsets (degrees) kept on land for coastal / lakefront cities. */
  latRange: [number, number];
  lngRange: [number, number];
  zips: string[];
  /** Relative pricing versus the national average. */
  priceFactor: number;
}

const MARKETS: Market[] = [
  { city: "Austin", state: "TX", lat: 30.2672, lng: -97.7431, latRange: [-0.09, 0.12], lngRange: [-0.1, 0.08], zips: ["78701", "78702", "78704", "78741", "78751", "78758"], priceFactor: 1.15 },
  { city: "Dallas", state: "TX", lat: 32.7767, lng: -96.797, latRange: [-0.08, 0.12], lngRange: [-0.12, 0.1], zips: ["75201", "75204", "75207", "75219", "75226", "75247"], priceFactor: 1.0 },
  { city: "Denver", state: "CO", lat: 39.7392, lng: -104.9903, latRange: [-0.09, 0.08], lngRange: [-0.1, 0.1], zips: ["80202", "80205", "80211", "80216", "80223", "80231"], priceFactor: 1.1 },
  { city: "Phoenix", state: "AZ", lat: 33.4484, lng: -112.074, latRange: [-0.08, 0.12], lngRange: [-0.12, 0.1], zips: ["85003", "85004", "85008", "85016", "85034", "85040"], priceFactor: 0.9 },
  { city: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298, latRange: [-0.1, 0.1], lngRange: [-0.16, -0.01], zips: ["60601", "60607", "60608", "60612", "60614", "60622"], priceFactor: 1.05 },
  { city: "Atlanta", state: "GA", lat: 33.749, lng: -84.388, latRange: [-0.08, 0.1], lngRange: [-0.1, 0.1], zips: ["30303", "30308", "30309", "30312", "30318", "30324"], priceFactor: 0.95 },
  { city: "Seattle", state: "WA", lat: 47.6062, lng: -122.3321, latRange: [-0.08, 0.08], lngRange: [-0.01, 0.06], zips: ["98101", "98104", "98108", "98109", "98121", "98134"], priceFactor: 1.35 },
  { city: "Miami", state: "FL", lat: 25.7617, lng: -80.1918, latRange: [-0.06, 0.1], lngRange: [-0.12, 0.0], zips: ["33125", "33127", "33130", "33132", "33137", "33142"], priceFactor: 1.3 },
  { city: "Nashville", state: "TN", lat: 36.1627, lng: -86.7816, latRange: [-0.08, 0.08], lngRange: [-0.1, 0.08], zips: ["37201", "37203", "37206", "37208", "37210", "37211"], priceFactor: 1.0 },
  { city: "Charlotte", state: "NC", lat: 35.2271, lng: -80.8431, latRange: [-0.08, 0.08], lngRange: [-0.1, 0.1], zips: ["28202", "28203", "28204", "28205", "28206", "28208"], priceFactor: 0.95 },
];

const STREETS = [
  "Commerce", "Main", "Market", "Industrial", "Lakeview", "Parkway", "Union",
  "Exchange", "Harbor", "Railway", "Summit", "Founders", "Meridian", "Ridge",
  "Crossroads", "Gateway", "Cedar", "Willow", "Highland", "Riverside",
  "Pioneer", "Granite", "Foundry", "Mill", "Beacon", "Heritage", "Junction",
];
const SUFFIXES = ["St", "Ave", "Blvd", "Dr", "Way", "Pkwy", "Rd"];

const BROKER_FIRST = ["Jordan", "Avery", "Morgan", "Casey", "Riley", "Taylor", "Quinn", "Reese", "Drew", "Parker", "Sam", "Elliot"];
const BROKER_LAST = ["Alvarez", "Brennan", "Chen", "Delgado", "Ellison", "Foster", "Grant", "Haddad", "Iverson", "Kapoor", "Lindqvist", "Okafor"];
const BROKERAGES = ["Northgate Commercial", "Keystone Capital Realty", "Bluestone Partners", "Atlas CRE Advisors", "Summit Ridge Brokerage", "Meridian Property Group"];

interface TypeProfile {
  /** Sale price per building SF (or per acre for land), national average. */
  salePerUnit: [number, number];
  /** Lease $/SF/yr. Null when the type isn't offered for lease. */
  leaseRate: [number, number] | null;
  capRate: [number, number];
  size: [number, number];
  names: string[];
  zoning: string[];
  highlights: string[];
}

const PROFILES: Record<PropertyType, TypeProfile> = {
  Office: {
    salePerUnit: [180, 420], leaseRate: [24, 58], capRate: [6.5, 9.0], size: [8_000, 240_000],
    names: ["Plaza", "Tower", "Corporate Center", "Office Park", "Executive Center", "Commons"],
    zoning: ["C-2", "CBD", "O-1", "MU-3"],
    highlights: ["Recently renovated lobby and common areas", "Floor-to-ceiling windows with skyline views", "On-site fitness center and tenant lounge", "Structured parking at 3.5/1,000 SF", "Walkable to transit and dining", "Fiber connectivity from multiple carriers", "LEED Gold certified"],
  },
  Retail: {
    salePerUnit: [220, 480], leaseRate: [18, 52], capRate: [5.75, 8.0], size: [2_500, 90_000],
    names: ["Shopping Center", "Marketplace", "Retail Center", "Village Shops", "Square", "Pavilion"],
    zoning: ["C-1", "C-2", "CR", "MU-2"],
    highlights: ["Grocery-anchored with strong national tenants", "High-traffic signalized corner", "Pylon signage visible from the highway", "Drive-thru pad available", "Long-term NNN leases in place", "Dense residential population within 3 miles"],
  },
  Industrial: {
    salePerUnit: [110, 230], leaseRate: [8, 18], capRate: [5.0, 7.0], size: [15_000, 450_000],
    names: ["Logistics Center", "Distribution Center", "Industrial Park", "Commerce Center", "Business Park"],
    zoning: ["I-1", "I-2", "M-1", "LI"],
    highlights: ["32' clear height", "ESFR sprinkler system", "Dock-high and grade-level loading", "Ample trailer parking", "Minutes to the interstate", "Heavy power: 3-phase, 2,000 amps", "Cross-dock configuration"],
  },
  Multifamily: {
    salePerUnit: [190, 360], leaseRate: null, capRate: [4.75, 6.5], size: [18_000, 320_000],
    names: ["Apartments", "Residences", "Lofts", "Flats", "Commons"],
    zoning: ["R-4", "R-5", "MF-3", "MU-3"],
    highlights: ["96% occupied with rents below market", "Value-add upside through unit renovations", "Resort-style pool and clubhouse", "In-unit washer and dryer", "Covered parking and EV charging", "Close to major employers and universities"],
  },
  Hospitality: {
    salePerUnit: [220, 450], leaseRate: null, capRate: [7.0, 9.5], size: [30_000, 220_000],
    names: ["Hotel", "Inn & Suites", "Suites", "Lodge"],
    zoning: ["C-3", "CBD", "H-1"],
    highlights: ["Premium select-service flag", "RevPAR outperforming the competitive set", "Recent PIP completed", "Meeting space and rooftop bar", "Walkable to the convention center"],
  },
  "Mixed Use": {
    salePerUnit: [230, 470], leaseRate: [22, 48], capRate: [5.5, 7.5], size: [12_000, 180_000],
    names: ["Mixed-Use", "Commons", "Collective", "Yards", "District"],
    zoning: ["MU-2", "MU-3", "PUD", "CBD"],
    highlights: ["Ground-floor retail with residential above", "Located in a designated Opportunity Zone", "Walk Score of 94", "Diversified rent roll", "Rooftop amenity deck"],
  },
  Land: {
    salePerUnit: [180_000, 1_400_000], leaseRate: null, capRate: [0, 0], size: [0, 0],
    names: ["Development Site", "Land Parcel", "Acreage", "Pad Site"],
    zoning: ["PUD", "C-2", "I-1", "MU-3", "R-5"],
    highlights: ["Entitled for mixed-use development", "All utilities at the site", "Flat, cleared, and ready to build", "Frontage on a major arterial", "Located in a growth corridor", "Phase I environmental report available"],
  },
};

// Weighted so the dataset feels like a real market.
const TYPE_WEIGHTS: [PropertyType, number][] = [
  ["Office", 18], ["Retail", 17], ["Industrial", 20], ["Multifamily", 14],
  ["Hospitality", 6], ["Mixed Use", 10], ["Land", 9],
];

function pickType(): PropertyType {
  const total = TYPE_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);
  let roll = random() * total;
  for (const [type, weight] of TYPE_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return type;
  }
  return "Office";
}

function describe(p: Omit<Property, "description" | "highlights" | "broker">): string {
  const where = `${p.city}, ${p.state}`;
  const size = p.buildingSize ? `${p.buildingSize.toLocaleString("en-US")} SF ` : "";
  switch (p.type) {
    case "Land":
      return `${p.lotSizeAcres.toFixed(2)}-acre ${p.zoning}-zoned parcel in ${where}. The site offers excellent access and visibility, and is well positioned for a range of commercial or residential development. Survey and title work are available to qualified buyers.`;
    case "Multifamily":
      return `${p.units}-unit multifamily community built in ${p.yearBuilt} in ${where}. The property is ${p.occupancy}% occupied, with a stable tenant base and room to grow rents through light interior upgrades. Strong demographics and limited new supply nearby support continued rent growth.`;
    case "Hospitality":
      return `${p.rooms}-key hotel in ${where}, built in ${p.yearBuilt}. The asset benefits from steady corporate and leisure demand drivers, a well-maintained physical plant, and upside from improved revenue management.`;
    default:
      if (p.listingType === "lease") {
        return `${p.availableSize?.toLocaleString("en-US")} SF available for lease in this ${size}${p.type.toLowerCase()} property in ${where}. Flexible floor plates can accommodate a range of tenant sizes, and the landlord is offering a competitive improvement allowance for qualified tenants.`;
      }
      return `${size}${p.buildingClass ? `Class ${p.buildingClass} ` : ""}${p.type.toLowerCase()} property built in ${p.yearBuilt} in ${where}. Currently ${p.occupancy}% occupied, the property offers investors durable in-place cash flow with upside through lease-up and operational improvements.`;
  }
}

function generate(count: number): Property[] {
  const properties: Property[] = [];
  // Listing dates are relative to today (UTC) so the sample data never looks stale.
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  for (let i = 0; i < count; i++) {
    const market = MARKETS[i % MARKETS.length];
    const type = pickType();
    const profile = PROFILES[type];
    const listingType: ListingType =
      profile.leaseRate && random() < 0.4 ? "lease" : "sale";

    const street = `${int(100, 9800)} ${pick(STREETS)} ${pick(SUFFIXES)}`;
    const name = `${pick(STREETS)} ${pick(profile.names)}`;

    const isLand = type === "Land";
    const buildingSize = isLand ? null : roundTo(between(...profile.size), 100);
    const lotSizeAcres = isLand
      ? Math.round(between(0.8, 42) * 100) / 100
      : Math.round(((buildingSize ?? 0) / 43_560) * between(1.2, 3.5) * 100) / 100;

    const yearBuilt = isLand ? null : int(1965, 2024);
    const buildingClass: BuildingClass | null =
      type === "Office" || type === "Mixed Use"
        ? yearBuilt && yearBuilt > 2008 ? "A" : pick(["A", "B", "B", "C"] as const)
        : null;
    const occupancy = isLand ? null : int(72, 100);
    const floors = isLand
      ? null
      : type === "Industrial" ? 1
      : type === "Retail" ? int(1, 2)
      : type === "Office" ? Math.max(1, Math.round((buildingSize ?? 0) / int(9_000, 24_000)))
      : int(3, 14);
    const units = type === "Multifamily" ? Math.max(12, Math.round((buildingSize ?? 0) / int(850, 1_050))) : null;
    const rooms = type === "Hospitality" ? Math.max(40, Math.round((buildingSize ?? 0) / int(520, 700))) : null;
    const parkingSpaces = isLand ? null : Math.round(((buildingSize ?? 0) / 1000) * between(1.5, 4));

    let price: number | null = null;
    let leaseRate: number | null = null;
    let noi: number | null = null;
    let capRate: number | null = null;
    let availableSize: number | null = null;

    if (listingType === "sale") {
      const perUnit = between(...profile.salePerUnit) * market.priceFactor;
      const raw = isLand ? perUnit * lotSizeAcres : perUnit * (buildingSize ?? 0);
      price = roundTo(raw, raw > 10_000_000 ? 100_000 : 25_000);
      if (!isLand) {
        capRate = Math.round(between(...profile.capRate) * 100) / 100;
        noi = roundTo(price * (capRate / 100), 100);
      }
    } else {
      leaseRate = Math.round(between(...profile.leaseRate!) * market.priceFactor * 4) / 4;
      availableSize = roundTo(
        Math.min(buildingSize ?? 0, between(1_200, Math.max(2_000, (buildingSize ?? 0) * 0.45))),
        50,
      );
    }

    const daysAgo = int(0, 180);
    const listedAt = new Date(today - daysAgo * 86_400_000).toISOString().slice(0, 10);

    const firstName = pick(BROKER_FIRST);
    const lastName = pick(BROKER_LAST);
    const company = pick(BROKERAGES);

    const base = {
      id: `${market.city.toLowerCase()}-${String(i + 1).padStart(3, "0")}`,
      title: isLand ? `${lotSizeAcres.toFixed(1)} AC ${pick(profile.names)}` : name,
      type,
      listingType,
      address: street,
      city: market.city,
      state: market.state,
      zip: pick(market.zips),
      lat: Math.round((market.lat + between(...market.latRange)) * 1e5) / 1e5,
      lng: Math.round((market.lng + between(...market.lngRange)) * 1e5) / 1e5,
      price,
      leaseRate,
      noi,
      capRate,
      buildingSize,
      availableSize,
      lotSizeAcres,
      yearBuilt,
      buildingClass,
      occupancy,
      floors,
      units,
      rooms,
      parkingSpaces,
      zoning: pick(profile.zoning),
      listedAt,
    };

    const highlights = [...profile.highlights]
      .sort(() => random() - 0.5)
      .slice(0, int(3, 4));

    properties.push({
      ...base,
      description: describe(base),
      highlights,
      broker: {
        name: `${firstName} ${lastName}`,
        company,
        phone: `(555) ${int(200, 899)}-${String(int(0, 9999)).padStart(4, "0")}`,
        email: `${firstName}.${lastName}@example.com`.toLowerCase(),
      },
    });
  }

  return properties;
}

export const SAMPLE_PROPERTIES: Property[] = generate(120);
