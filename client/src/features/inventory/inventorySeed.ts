import type { Bottle } from "@/types";

// Shared seed data used by InventoryView and SpiritDetailView.
// Phase B: replaced by GET /api/inventory/:userId React Query hook.
export const SEED_INVENTORY: Bottle[] = [
  // ── Whiskey / Bourbon / Scotch
  { id: 1,  userId: "u1", spiritName: "Maker's Mark",         category: "Bourbon",       volumeEighths: 6, purchasePrice: "32.99", imageUrl: null, isFavorite: true,  unopenedCount: 1, updatedAt: "" },
  { id: 2,  userId: "u1", spiritName: "Hendrick's Bourbon",   category: "Bourbon",       volumeEighths: 3, purchasePrice: null,    imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 3,  userId: "u1", spiritName: "Buffalo Trace",        category: "Bourbon",       volumeEighths: 8, purchasePrice: "26.99", imageUrl: null, isFavorite: true,  unopenedCount: 0, updatedAt: "" },
  { id: 4,  userId: "u1", spiritName: "Johnnie Walker Black", category: "Scotch",        volumeEighths: 5, purchasePrice: "38.00", imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 5,  userId: "u1", spiritName: "Glenfiddich 12",       category: "Scotch",        volumeEighths: 7, purchasePrice: "49.99", imageUrl: null, isFavorite: true,  unopenedCount: 0, updatedAt: "" },
  { id: 6,  userId: "u1", spiritName: "Bulleit Rye",          category: "Whiskey",       volumeEighths: 4, purchasePrice: "28.99", imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 7,  userId: "u1", spiritName: "Jameson Irish",        category: "Whiskey",       volumeEighths: 2, purchasePrice: "24.99", imageUrl: null, isFavorite: false, unopenedCount: 1, updatedAt: "" },
  // ── Gin
  { id: 8,  userId: "u1", spiritName: "Hendrick's Gin",       category: "Gin",           volumeEighths: 6, purchasePrice: "36.99", imageUrl: null, isFavorite: true,  unopenedCount: 0, updatedAt: "" },
  { id: 9,  userId: "u1", spiritName: "Tanqueray London Dry", category: "Gin",           volumeEighths: 4, purchasePrice: "22.99", imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 10, userId: "u1", spiritName: "Bombay Sapphire",      category: "Gin",           volumeEighths: 8, purchasePrice: "19.99", imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  // ── Tequila / Mezcal
  { id: 11, userId: "u1", spiritName: "Casamigos Blanco",     category: "Tequila",       volumeEighths: 5, purchasePrice: "44.99", imageUrl: null, isFavorite: true,  unopenedCount: 0, updatedAt: "" },
  { id: 12, userId: "u1", spiritName: "Patrón Silver",        category: "Tequila",       volumeEighths: 7, purchasePrice: "46.99", imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 13, userId: "u1", spiritName: "Del Maguey Vida",      category: "Mezcal",        volumeEighths: 3, purchasePrice: "51.99", imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  // ── Rum
  { id: 14, userId: "u1", spiritName: "Zacapa 23",            category: "Rum",           volumeEighths: 4, purchasePrice: "55.00", imageUrl: null, isFavorite: true,  unopenedCount: 0, updatedAt: "" },
  { id: 15, userId: "u1", spiritName: "Bacardí Superior",     category: "Rum",           volumeEighths: 6, purchasePrice: "14.99", imageUrl: null, isFavorite: false, unopenedCount: 1, updatedAt: "" },
  // ── Vodka
  { id: 16, userId: "u1", spiritName: "Grey Goose",           category: "Vodka",         volumeEighths: 5, purchasePrice: "31.99", imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 17, userId: "u1", spiritName: "Ketel One",            category: "Vodka",         volumeEighths: 8, purchasePrice: "22.99", imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  // ── Brandy
  { id: 18, userId: "u1", spiritName: "Hennessy VS",          category: "Brandy",        volumeEighths: 3, purchasePrice: "35.99", imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  // ── Ingredients / Mixers
  { id: 19, userId: "u1", spiritName: "Fresh Lime Juice",     category: "Lime Juice",    volumeEighths: 4, purchasePrice: null,    imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 20, userId: "u1", spiritName: "Fresh Lemon Juice",    category: "Lemon Juice",   volumeEighths: 6, purchasePrice: null,    imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 21, userId: "u1", spiritName: "House Simple Syrup",   category: "Simple Syrup",  volumeEighths: 5, purchasePrice: null,    imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 22, userId: "u1", spiritName: "Angostura Bitters",    category: "Bitters",       volumeEighths: 7, purchasePrice: "8.99",  imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 23, userId: "u1", spiritName: "Peychaud's Bitters",   category: "Bitters",       volumeEighths: 6, purchasePrice: "7.99",  imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 24, userId: "u1", spiritName: "Dolin Dry Vermouth",   category: "Vermouth",      volumeEighths: 5, purchasePrice: "12.99", imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 25, userId: "u1", spiritName: "Dolin Sweet Vermouth", category: "Vermouth",      volumeEighths: 4, purchasePrice: "12.99", imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 26, userId: "u1", spiritName: "Fever-Tree Soda",      category: "Soda Water",    volumeEighths: 3, purchasePrice: "5.99",  imageUrl: null, isFavorite: false, unopenedCount: 2, updatedAt: "" },
  { id: 27, userId: "u1", spiritName: "Fresh Mint",           category: "Mint",          volumeEighths: 4, purchasePrice: null,    imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 28, userId: "u1", spiritName: "Navel Orange Peels",   category: "Orange Peel",   volumeEighths: 5, purchasePrice: null,    imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 29, userId: "u1", spiritName: "Luxardo Cherries",     category: "Fruit",         volumeEighths: 6, purchasePrice: "16.99", imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 30, userId: "u1", spiritName: "Ooer Lychee",          category: "Fruit",         volumeEighths: 2, purchasePrice: null,    imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  // ── Liqueurs
  { id: 31, userId: "u1", spiritName: "Limoncello",           category: "Liqueur",       volumeEighths: 5, purchasePrice: "18.99", imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 32, userId: "u1", spiritName: "Cointreau",            category: "Liqueur",       volumeEighths: 6, purchasePrice: "29.99", imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 33, userId: "u1", spiritName: "St-Germain (Elderflower)", category: "Liqueur",   volumeEighths: 4, purchasePrice: "31.99", imageUrl: null, isFavorite: true,  unopenedCount: 0, updatedAt: "" },
  { id: 34, userId: "u1", spiritName: "Campari",              category: "Liqueur",       volumeEighths: 7, purchasePrice: "22.99", imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  // ── Beer
  { id: 35, userId: "u1", spiritName: "Modelo Especial",      category: "Beer",          volumeEighths: 8, purchasePrice: "12.99", imageUrl: null, isFavorite: false, unopenedCount: 2, updatedAt: "" },
  { id: 36, userId: "u1", spiritName: "Guinness Draught",     category: "Beer",          volumeEighths: 8, purchasePrice: "10.99", imageUrl: null, isFavorite: false, unopenedCount: 1, updatedAt: "" },
  // ── Wine
  { id: 37, userId: "u1", spiritName: "Meiomi Pinot Noir",    category: "Wine",          volumeEighths: 6, purchasePrice: "15.99", imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 38, userId: "u1", spiritName: "Kim Crawford Sauvignon Blanc", category: "Wine",  volumeEighths: 8, purchasePrice: "13.99", imageUrl: null, isFavorite: false, unopenedCount: 1, updatedAt: "" },
  // ── Other (honey, syrups, etc.)
  { id: 39, userId: "u1", spiritName: "Raw Honey",            category: "Other",         volumeEighths: 6, purchasePrice: null,    imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 40, userId: "u1", spiritName: "Agave Syrup",          category: "Other",         volumeEighths: 5, purchasePrice: null,    imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
  { id: 41, userId: "u1", spiritName: "Grenadine",            category: "Other",         volumeEighths: 4, purchasePrice: "6.99",  imageUrl: null, isFavorite: false, unopenedCount: 0, updatedAt: "" },
];
