// ─── Spirit Detail Seed Data ─────────────────────────────────────────────────
// Keyed by inventory bottle ID (matches SEED_INVENTORY in InventoryView.tsx).
// Phase B: replace with GET /api/inventory/item/:id which will return this
// structured data from the DB (or fetched by the MixologistAgent on demand).

export interface WhereToBuy {
  store: string;
  price: string;
  deliveryNote: string;
  affiliateUrl: string;
  logo?: string; // emoji stand-in until real logos
}

export interface CommonCocktail {
  name: string;
  emoji: string;
}

export interface SpiritDetail {
  id: number;
  spiritName: string;
  subtitle: string;
  description: string;
  category: string;
  abv: string;
  origin: string;
  flavorProfile: string;
  whereToBuy: WhereToBuy[];
  commonCocktails: CommonCocktail[];
}

export const SPIRIT_DETAILS: Record<number, SpiritDetail> = {
  // ── Maker's Mark Bourbon
  1: {
    id: 1,
    spiritName: "Maker's Mark",
    subtitle: "Small Batch Kentucky Straight Bourbon",
    description:
      "Maker's Mark is a classic wheated bourbon made at Star Hill Farm in Loretto, Kentucky. Soft winter wheat replaces rye as the secondary grain, producing the brand's signature smooth, approachable sweetness with notes of caramel, vanilla, and a light fruity finish.",
    category: "Bourbon",
    abv: "45%",
    origin: "Kentucky, USA",
    flavorProfile: "Caramel, Vanilla, Wheat, Light Oak",
    whereToBuy: [
      { store: "Drizly", price: "$29.99 avg", deliveryNote: "Delivery in 30–60 min", affiliateUrl: "https://drizly.com/search#q=maker's%20mark", logo: "🛒" },
      { store: "Total Wine & More", price: "$27.99", deliveryNote: "In-store pickup available", affiliateUrl: "https://www.totalwine.com/search/all?text=maker's+mark", logo: "🍾" },
      { store: "ReserveBar", price: "$31.99", deliveryNote: "Ships nationwide", affiliateUrl: "https://www.reservebar.com/search?q=maker%27s+mark", logo: "📦" },
    ],
    commonCocktails: [
      { name: "Old Fashioned", emoji: "🥃" },
      { name: "Mint Julep",    emoji: "🌿" },
      { name: "Whiskey Sour",  emoji: "🍋" },
      { name: "Manhattan",     emoji: "🍒" },
    ],
  },

  // ── Buffalo Trace Bourbon
  3: {
    id: 3,
    spiritName: "Buffalo Trace",
    subtitle: "Kentucky Straight Bourbon Whiskey",
    description:
      "Buffalo Trace is produced at the oldest continually operating distillery in the United States. Aged up to eight years in new American oak, it delivers a complex nose of vanilla, mint, and molasses followed by a long, smooth finish.",
    category: "Bourbon",
    abv: "45%",
    origin: "Kentucky, USA",
    flavorProfile: "Vanilla, Molasses, Toffee, Spice",
    whereToBuy: [
      { store: "Drizly", price: "$28.99 avg", deliveryNote: "Delivery in 30–60 min", affiliateUrl: "https://drizly.com/search#q=buffalo%20trace", logo: "🛒" },
      { store: "Total Wine & More", price: "$26.99", deliveryNote: "In-store pickup available", affiliateUrl: "https://www.totalwine.com/search/all?text=buffalo+trace", logo: "🍾" },
    ],
    commonCocktails: [
      { name: "Old Fashioned", emoji: "🥃" },
      { name: "Boulevardier", emoji: "🍊" },
      { name: "Mint Julep",   emoji: "🌿" },
    ],
  },

  // ── Glenfiddich 12
  5: {
    id: 5,
    spiritName: "Glenfiddich 12",
    subtitle: "12 Year Old Single Malt Scotch Whisky",
    description:
      "The world's most awarded single malt. Glenfiddich 12 is matured in the finest American oak and European sherry casks at their Dufftown distillery, producing a fresh pear and apple character with subtle oak warmth and a long, smooth finish.",
    category: "Scotch",
    abv: "40%",
    origin: "Speyside, Scotland",
    flavorProfile: "Green Apple, Pear, Oak, Malt",
    whereToBuy: [
      { store: "Drizly", price: "$47.99 avg", deliveryNote: "Delivery in 30–60 min", affiliateUrl: "https://drizly.com/search#q=glenfiddich+12", logo: "🛒" },
      { store: "Total Wine & More", price: "$44.99", deliveryNote: "In-store pickup available", affiliateUrl: "https://www.totalwine.com/search/all?text=glenfiddich+12", logo: "🍾" },
      { store: "Master of Malt", price: "$49.99", deliveryNote: "Ships in 3–5 days", affiliateUrl: "https://www.masterofmalt.com/whiskies/glenfiddich/glenfiddich-12-year-old-whisky/", logo: "📦" },
    ],
    commonCocktails: [
      { name: "Rob Roy",      emoji: "🍒" },
      { name: "Rusty Nail",   emoji: "🔩" },
      { name: "Scotch Sour",  emoji: "🍋" },
    ],
  },

  // ── Hendrick's Gin
  8: {
    id: 8,
    spiritName: "Hendrick's Gin",
    subtitle: "Premium Scottish Gin",
    description:
      "Hendrick's Gin is a Premium Scottish Gin distilled in small batches at the Girvan distillery in Ayrshire. Unusually for gin, it is infused with cucumber and rose petal extracts after distillation, giving it a floral, refreshing character that stands apart from traditional London Dry gins.",
    category: "Gin",
    abv: "41.4%",
    origin: "Scotland",
    flavorProfile: "Cucumber, Rose, Citrus, Floral",
    whereToBuy: [
      { store: "Drizly",              price: "$35.00 avg",  deliveryNote: "Delivery today",           affiliateUrl: "https://drizly.com/search#q=hendricks+gin",              logo: "🛒" },
      { store: "Total Wine & More",   price: "$32.99",      deliveryNote: "Delivery in Reston · $32.99", affiliateUrl: "https://www.totalwine.com/search/all?text=hendricks+gin", logo: "🍾" },
      { store: "Local Liquor Store",  price: "$37.50",      deliveryNote: "Delivery in Padox · $37.50",  affiliateUrl: "https://www.google.com/maps/search/liquor+store+near+me",  logo: "🏪" },
    ],
    commonCocktails: [
      { name: "Gin & Tonic",     emoji: "🥤" },
      { name: "Cucumber Cooler", emoji: "🥒" },
      { name: "Gimlet",          emoji: "🍸" },
      { name: "Negroni",         emoji: "🍊" },
    ],
  },

  // ── Tanqueray Gin
  9: {
    id: 9,
    spiritName: "Tanqueray London Dry",
    subtitle: "London Dry Gin",
    description:
      "One of the most celebrated dry gins in the world, Tanqueray London Dry is crafted using a carefully balanced blend of four botanicals distilled four times for exceptional smoothness. Its crisp juniper-forward character makes it the go-to choice for a classic G&T.",
    category: "Gin",
    abv: "47.3%",
    origin: "London, England",
    flavorProfile: "Juniper, Coriander, Angelica, Citrus",
    whereToBuy: [
      { store: "Drizly",            price: "$22.99 avg", deliveryNote: "Delivery today",           affiliateUrl: "https://drizly.com/search#q=tanqueray", logo: "🛒" },
      { store: "Total Wine & More", price: "$21.99",     deliveryNote: "In-store pickup available", affiliateUrl: "https://www.totalwine.com/search/all?text=tanqueray", logo: "🍾" },
    ],
    commonCocktails: [
      { name: "Gin & Tonic",  emoji: "🥤" },
      { name: "Martini",      emoji: "🍸" },
      { name: "Tom Collins",  emoji: "🍋" },
    ],
  },

  // ── Casamigos Blanco
  11: {
    id: 11,
    spiritName: "Casamigos Blanco",
    subtitle: "100% Blue Weber Agave Tequila",
    description:
      "Founded by George Clooney, Casamigos Blanco is made from 100% Blue Weber agave grown in the Highlands of Jalisco. It's un-aged, or rested minimally, resulting in a clean, crisp profile with citrus, vanilla, and a light agave sweetness.",
    category: "Tequila",
    abv: "40%",
    origin: "Jalisco, Mexico",
    flavorProfile: "Agave, Citrus, Vanilla, Light Pepper",
    whereToBuy: [
      { store: "Drizly",            price: "$44.99 avg", deliveryNote: "Delivery in 30–60 min",   affiliateUrl: "https://drizly.com/search#q=casamigos+blanco",            logo: "🛒" },
      { store: "Total Wine & More", price: "$42.99",     deliveryNote: "In-store pickup available", affiliateUrl: "https://www.totalwine.com/search/all?text=casamigos+blanco", logo: "🍾" },
      { store: "ReserveBar",        price: "$46.99",     deliveryNote: "Ships nationwide",          affiliateUrl: "https://www.reservebar.com/search?q=casamigos",            logo: "📦" },
    ],
    commonCocktails: [
      { name: "Margarita",       emoji: "🍋" },
      { name: "Paloma",          emoji: "🍊" },
      { name: "Tequila Sunrise", emoji: "🌅" },
      { name: "Tommy's Margarita", emoji: "🌵" },
    ],
  },

  // ── Zacapa 23
  14: {
    id: 14,
    spiritName: "Zacapa 23",
    subtitle: "Solera Aged Dark Rum",
    description:
      "Ron Zacapa Centenario 23 is crafted from virgin sugarcane honey and aged at 2,300 metres above sea level in Guatemala. Its Solera system blends rums aged 6–23 years in ex-bourbon, sherry, and Pedro Ximénez casks for a rich, complex sipping experience.",
    category: "Rum",
    abv: "40%",
    origin: "Guatemala",
    flavorProfile: "Honey, Toffee, Dark Chocolate, Dried Fruit",
    whereToBuy: [
      { store: "Drizly",            price: "$54.99 avg", deliveryNote: "Delivery today",           affiliateUrl: "https://drizly.com/search#q=zacapa+23",            logo: "🛒" },
      { store: "Total Wine & More", price: "$51.99",     deliveryNote: "In-store pickup available", affiliateUrl: "https://www.totalwine.com/search/all?text=zacapa+23", logo: "🍾" },
    ],
    commonCocktails: [
      { name: "Rum Old Fashioned", emoji: "🥃" },
      { name: "Dark & Stormy",     emoji: "⛈️" },
      { name: "Rum Manhattan",     emoji: "🍒" },
    ],
  },
};

/** Returns detail data for a bottle ID, or a reasonable fallback. */
export function getSpiritDetail(id: number): SpiritDetail | null {
  return SPIRIT_DETAILS[id] ?? null;
}
