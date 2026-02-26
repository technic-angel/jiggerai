/* eslint-disable no-console */
/**
 * Dev seed — mirrors the frontend mock data exactly so the UI can be
 * hydrated from the API with zero changes to the rendered output.
 *
 * Fixed user ID: "dev-user-001"
 * Run: npm run seed
 */
import { db } from './index.js';
import {
  users, inventory, recipes, userFavorites,
  ingredients, recipeIngredients,
} from './schema.js';

export const DEV_USER_ID = 'dev-user-001';

async function seed() {
  console.log('🌱 Seeding database…');

  // ────────────────────────────────────────────────────────────────────
  // 1. Clear old data (order matters due to FK constraints)
  // ────────────────────────────────────────────────────────────────────
  console.log('🧹 Clearing old data…');
  await db.delete(recipeIngredients);
  await db.delete(userFavorites);
  await db.delete(inventory);
  await db.delete(recipes);
  await db.delete(ingredients);
  await db.delete(users);

  // ────────────────────────────────────────────────────────────────────
  // 2. Dev user (fixed ID so the client can hard-code it in dev)
  // ────────────────────────────────────────────────────────────────────
  console.log('👤 Creating dev user…');
  await db.insert(users).values({
    id: DEV_USER_ID,
    email: 'melissa@example.com',
    displayName: 'Melissa',
  });
  console.log(`   -> user: ${DEV_USER_ID}`);

  // ────────────────────────────────────────────────────────────────────
  // 3. Inventory — 41 items matching the frontend seed exactly
  // ────────────────────────────────────────────────────────────────────
  console.log('🍾 Seeding inventory (41 items)…');
  await db.insert(inventory).values([
    // ── Whiskey / Bourbon / Scotch
    { userId: DEV_USER_ID, spiritName: "Maker's Mark",          category: 'Bourbon',      volumeEighths: 6, purchasePrice: '32.99', isFavorite: 1, unopenedCount: 1 },
    { userId: DEV_USER_ID, spiritName: "Hendrick's Bourbon",    category: 'Bourbon',      volumeEighths: 3, purchasePrice: null,    isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Buffalo Trace',         category: 'Bourbon',      volumeEighths: 8, purchasePrice: '26.99', isFavorite: 1, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Johnnie Walker Black',  category: 'Scotch',       volumeEighths: 5, purchasePrice: '38.00', isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Glenfiddich 12',        category: 'Scotch',       volumeEighths: 7, purchasePrice: '49.99', isFavorite: 1, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Bulleit Rye',           category: 'Whiskey',      volumeEighths: 4, purchasePrice: '28.99', isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Jameson Irish',         category: 'Whiskey',      volumeEighths: 2, purchasePrice: '24.99', isFavorite: 0, unopenedCount: 1 },
    // ── Gin
    { userId: DEV_USER_ID, spiritName: "Hendrick's Gin",        category: 'Gin',          volumeEighths: 6, purchasePrice: '36.99', isFavorite: 1, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Tanqueray London Dry',  category: 'Gin',          volumeEighths: 4, purchasePrice: '22.99', isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Bombay Sapphire',       category: 'Gin',          volumeEighths: 8, purchasePrice: '19.99', isFavorite: 0, unopenedCount: 0 },
    // ── Tequila / Mezcal
    { userId: DEV_USER_ID, spiritName: 'Casamigos Blanco',      category: 'Tequila',      volumeEighths: 5, purchasePrice: '44.99', isFavorite: 1, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Patrón Silver',         category: 'Tequila',      volumeEighths: 7, purchasePrice: '46.99', isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Del Maguey Vida',       category: 'Mezcal',       volumeEighths: 3, purchasePrice: '51.99', isFavorite: 0, unopenedCount: 0 },
    // ── Rum
    { userId: DEV_USER_ID, spiritName: 'Zacapa 23',             category: 'Rum',          volumeEighths: 4, purchasePrice: '55.00', isFavorite: 1, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Bacardí Superior',      category: 'Rum',          volumeEighths: 6, purchasePrice: '14.99', isFavorite: 0, unopenedCount: 1 },
    // ── Vodka
    { userId: DEV_USER_ID, spiritName: 'Grey Goose',            category: 'Vodka',        volumeEighths: 5, purchasePrice: '31.99', isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Ketel One',             category: 'Vodka',        volumeEighths: 8, purchasePrice: '22.99', isFavorite: 0, unopenedCount: 0 },
    // ── Brandy
    { userId: DEV_USER_ID, spiritName: 'Hennessy VS',           category: 'Brandy',       volumeEighths: 3, purchasePrice: '35.99', isFavorite: 0, unopenedCount: 0 },
    // ── Ingredients / Mixers
    { userId: DEV_USER_ID, spiritName: 'Fresh Lime Juice',      category: 'Lime Juice',   volumeEighths: 4, purchasePrice: null,    isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Fresh Lemon Juice',     category: 'Lemon Juice',  volumeEighths: 6, purchasePrice: null,    isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'House Simple Syrup',    category: 'Simple Syrup', volumeEighths: 5, purchasePrice: null,    isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Angostura Bitters',     category: 'Bitters',      volumeEighths: 7, purchasePrice: '8.99',  isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: "Peychaud's Bitters",    category: 'Bitters',      volumeEighths: 6, purchasePrice: '7.99',  isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Dolin Dry Vermouth',    category: 'Vermouth',     volumeEighths: 5, purchasePrice: '12.99', isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Dolin Sweet Vermouth',  category: 'Vermouth',     volumeEighths: 4, purchasePrice: '12.99', isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Fever-Tree Soda',       category: 'Soda Water',   volumeEighths: 3, purchasePrice: '5.99',  isFavorite: 0, unopenedCount: 2 },
    { userId: DEV_USER_ID, spiritName: 'Fresh Mint',            category: 'Mint',         volumeEighths: 4, purchasePrice: null,    isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Navel Orange Peels',    category: 'Orange Peel',  volumeEighths: 5, purchasePrice: null,    isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Luxardo Cherries',      category: 'Fruit',        volumeEighths: 6, purchasePrice: '16.99', isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Ooer Lychee',           category: 'Fruit',        volumeEighths: 2, purchasePrice: null,    isFavorite: 0, unopenedCount: 0 },
    // ── Liqueurs
    { userId: DEV_USER_ID, spiritName: 'Limoncello',            category: 'Liqueur',      volumeEighths: 5, purchasePrice: '18.99', isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Cointreau',             category: 'Liqueur',      volumeEighths: 6, purchasePrice: '29.99', isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'St-Germain (Elderflower)', category: 'Liqueur',   volumeEighths: 4, purchasePrice: '31.99', isFavorite: 1, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Campari',               category: 'Liqueur',      volumeEighths: 7, purchasePrice: '22.99', isFavorite: 0, unopenedCount: 0 },
    // ── Beer
    { userId: DEV_USER_ID, spiritName: 'Modelo Especial',       category: 'Beer',         volumeEighths: 8, purchasePrice: '12.99', isFavorite: 0, unopenedCount: 2 },
    { userId: DEV_USER_ID, spiritName: 'Guinness Draught',      category: 'Beer',         volumeEighths: 8, purchasePrice: '10.99', isFavorite: 0, unopenedCount: 1 },
    // ── Wine
    { userId: DEV_USER_ID, spiritName: 'Meiomi Pinot Noir',     category: 'Wine',         volumeEighths: 6, purchasePrice: '15.99', isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Kim Crawford Sauvignon Blanc', category: 'Wine',  volumeEighths: 8, purchasePrice: '13.99', isFavorite: 0, unopenedCount: 1 },
    // ── Other
    { userId: DEV_USER_ID, spiritName: 'Raw Honey',             category: 'Other',        volumeEighths: 6, purchasePrice: null,    isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Agave Syrup',           category: 'Other',        volumeEighths: 5, purchasePrice: null,    isFavorite: 0, unopenedCount: 0 },
    { userId: DEV_USER_ID, spiritName: 'Grenadine',             category: 'Other',        volumeEighths: 4, purchasePrice: '6.99',  isFavorite: 0, unopenedCount: 0 },
  ]);

  // ────────────────────────────────────────────────────────────────────
  // 4. Recipes — 25 items matching the frontend seed exactly
  // ────────────────────────────────────────────────────────────────────
  console.log('🍹 Seeding recipes (25 items)…');
  const recipeRows = await db.insert(recipes).values([
    // ── Gin
    { name: 'Gin & Tonic', category: 'Highball', baseSpirit: 'Gin', ingredients: ['2 oz Gin', '4 oz Tonic Water', 'Lime wedge'], instructions: 'Fill a highball glass with ice. Pour gin, top with tonic. Squeeze and drop in lime.', abv: '10%', glassType: 'Highball', difficulty: 'Easy', imageEmoji: '🥤' },
    { name: 'Negroni', category: 'Stirred', baseSpirit: 'Gin', ingredients: ['1 oz Gin', '1 oz Sweet Vermouth', '1 oz Campari', 'Orange peel'], instructions: 'Combine gin, vermouth, and Campari in a mixing glass with ice. Stir 30 sec. Strain over ice. Garnish with orange peel.', abv: '24%', glassType: 'Rocks', difficulty: 'Easy', imageEmoji: '🍊' },
    { name: 'Tom Collins', category: 'Highball', baseSpirit: 'Gin', ingredients: ['2 oz Gin', '1 oz Lemon Juice', '0.75 oz Simple Syrup', 'Soda Water'], instructions: 'Shake gin, lemon juice, and simple syrup with ice. Strain into a Collins glass with ice. Top with soda water.', abv: '11%', glassType: 'Collins', difficulty: 'Easy', imageEmoji: '🍋' },
    { name: 'Gimlet', category: 'Shaken', baseSpirit: 'Gin', ingredients: ['2.5 oz Gin', '0.75 oz Lime Juice', '0.75 oz Simple Syrup'], instructions: 'Shake all ingredients with ice. Double strain into a chilled coupe.', abv: '22%', glassType: 'Coupe', difficulty: 'Easy', imageEmoji: '🍸' },
    { name: 'Martini', category: 'Stirred', baseSpirit: 'Gin', ingredients: ['2.5 oz Gin', '0.5 oz Dry Vermouth', 'Lemon twist or olive'], instructions: 'Stir gin and vermouth with ice for 30 seconds. Strain into a chilled martini glass.', abv: '30%', glassType: 'Martini', difficulty: 'Easy', imageEmoji: '🍸' },
    { name: 'Clover Club', category: 'Shaken', baseSpirit: 'Gin', ingredients: ['2 oz Gin', '0.75 oz Lemon Juice', '0.75 oz Simple Syrup', '0.5 oz Raspberry Syrup', '1 Egg White'], instructions: 'Dry shake first, then shake with ice. Double strain into a coupe.', abv: '18%', glassType: 'Coupe', difficulty: 'Medium', imageEmoji: '🫐' },
    // ── Whiskey / Bourbon
    { name: 'Old Fashioned', category: 'Stirred', baseSpirit: 'Whiskey', ingredients: ['2 oz Bourbon', '2 dashes Angostura Bitters', '1 tsp Simple Syrup', 'Orange peel'], instructions: 'Add bitters and simple syrup to a rocks glass. Add ice and bourbon. Stir gently. Express orange peel over glass and drop in.', abv: '32%', glassType: 'Rocks', difficulty: 'Easy', imageEmoji: '🥃' },
    { name: 'Manhattan', category: 'Stirred', baseSpirit: 'Whiskey', ingredients: ['2 oz Rye or Bourbon', '1 oz Sweet Vermouth', '2 dashes Angostura Bitters', 'Luxardo Cherry'], instructions: 'Stir all ingredients with ice. Strain into a coupe. Garnish with cherry.', abv: '28%', glassType: 'Coupe', difficulty: 'Easy', imageEmoji: '🍒' },
    { name: 'Whiskey Sour', category: 'Shaken', baseSpirit: 'Whiskey', ingredients: ['2 oz Bourbon', '0.75 oz Lemon Juice', '0.75 oz Simple Syrup', '1 Egg White (optional)'], instructions: 'Shake all ingredients (dry shake if using egg white, then with ice). Strain over ice or into a coupe.', abv: '18%', glassType: 'Rocks or Coupe', difficulty: 'Easy', imageEmoji: '🍋' },
    { name: 'Mint Julep', category: 'Muddled', baseSpirit: 'Bourbon', ingredients: ['2.5 oz Bourbon', '0.75 oz Simple Syrup', '8 Mint leaves', 'Crushed ice'], instructions: 'Gently muddle mint with simple syrup. Fill a julep cup with crushed ice. Add bourbon and stir. Pack with more crushed ice. Garnish with a mint bouquet.', abv: '28%', glassType: 'Julep Cup', difficulty: 'Medium', imageEmoji: '🌿' },
    { name: 'Boulevardier', category: 'Stirred', baseSpirit: 'Bourbon', ingredients: ['1.5 oz Bourbon', '1 oz Sweet Vermouth', '1 oz Campari', 'Orange peel'], instructions: 'Stir all ingredients with ice. Strain over a large ice sphere. Express orange peel.', abv: '22%', glassType: 'Rocks', difficulty: 'Easy', imageEmoji: '🍊' },
    { name: 'Paper Plane', category: 'Shaken', baseSpirit: 'Bourbon', ingredients: ['0.75 oz Bourbon', '0.75 oz Aperol', '0.75 oz Amaro Nonino', '0.75 oz Lemon Juice'], instructions: 'Shake everything with ice. Double strain into a chilled coupe.', abv: '20%', glassType: 'Coupe', difficulty: 'Easy', imageEmoji: '✈️' },
    // ── Tequila
    { name: 'Margarita', category: 'Sour', baseSpirit: 'Tequila', ingredients: ['2 oz Tequila', '1 oz Lime Juice', '0.75 oz Triple Sec', 'Salt rim'], instructions: 'Shake tequila, lime, and triple sec with ice. Strain into a salt-rimmed rocks glass over ice.', abv: '18%', glassType: 'Rocks', difficulty: 'Easy', imageEmoji: '🍋' },
    { name: 'Paloma', category: 'Highball', baseSpirit: 'Tequila', ingredients: ['2 oz Tequila', '0.5 oz Lime Juice', 'Grapefruit Soda', 'Salt rim'], instructions: 'Rim a glass with salt. Add ice, tequila, and lime juice. Top with grapefruit soda.', abv: '12%', glassType: 'Highball', difficulty: 'Easy', imageEmoji: '🌸' },
    { name: "Tommy's Margarita", category: 'Shaken', baseSpirit: 'Tequila', ingredients: ['2 oz Tequila', '1 oz Lime Juice', '0.5 oz Agave Nectar'], instructions: 'Shake all ingredients with ice. Strain into a rocks glass over ice.', abv: '20%', glassType: 'Rocks', difficulty: 'Easy', imageEmoji: '🌵' },
    { name: 'Tequila Sunrise', category: 'Highball', baseSpirit: 'Tequila', ingredients: ['2 oz Tequila', '4 oz Orange Juice', '0.5 oz Grenadine'], instructions: 'Pour tequila and OJ over ice. Slowly pour grenadine down the side of the glass so it sinks.', abv: '12%', glassType: 'Highball', difficulty: 'Easy', imageEmoji: '🌅' },
    // ── Rum
    { name: 'Daiquiri', category: 'Shaken', baseSpirit: 'Rum', ingredients: ['2 oz White Rum', '1 oz Lime Juice', '0.75 oz Simple Syrup'], instructions: 'Shake all ingredients vigorously with ice. Double strain into a chilled coupe.', abv: '20%', glassType: 'Coupe', difficulty: 'Easy', imageEmoji: '🍹' },
    { name: 'Mojito', category: 'Muddled', baseSpirit: 'Rum', ingredients: ['2 oz White Rum', '1 oz Lime Juice', '0.75 oz Simple Syrup', '8 Mint leaves', 'Soda Water'], instructions: 'Muddle mint gently with simple syrup. Add rum and lime juice. Fill with ice and top with soda water.', abv: '12%', glassType: 'Collins', difficulty: 'Easy', imageEmoji: '🌿' },
    { name: 'Dark & Stormy', category: 'Highball', baseSpirit: 'Rum', ingredients: ['2 oz Dark Rum', '4 oz Ginger Beer', '0.5 oz Lime Juice'], instructions: 'Fill a glass with ice. Add lime juice, then dark rum. Float over ginger beer.', abv: '11%', glassType: 'Highball', difficulty: 'Easy', imageEmoji: '⛈️' },
    // ── Vodka
    { name: 'Moscow Mule', category: 'Highball', baseSpirit: 'Vodka', ingredients: ['2 oz Vodka', '4 oz Ginger Beer', '0.5 oz Lime Juice', 'Lime wedge'], instructions: 'Fill a copper mug with ice. Add vodka and lime juice. Top with ginger beer.', abv: '10%', glassType: 'Copper Mug', difficulty: 'Easy', imageEmoji: '🫖' },
    { name: 'Espresso Martini', category: 'Stirred', baseSpirit: 'Vodka', ingredients: ['1.5 oz Vodka', '1 oz Coffee Liqueur', '1 oz Fresh Espresso', '0.5 oz Simple Syrup'], instructions: 'Shake all ingredients hard with ice for 15 seconds. Double strain into a chilled coupe.', abv: '18%', glassType: 'Coupe', difficulty: 'Medium', imageEmoji: '☕' },
    { name: 'Cosmopolitan', category: 'Shaken', baseSpirit: 'Vodka', ingredients: ['1.5 oz Citrus Vodka', '0.75 oz Triple Sec', '0.5 oz Lime Juice', '1 oz Cranberry Juice'], instructions: 'Shake all ingredients with ice. Strain into a chilled martini glass. Garnish with orange twist.', abv: '20%', glassType: 'Martini', difficulty: 'Easy', imageEmoji: '🌸' },
    // ── Mezcal
    { name: 'Mezcal Negroni', category: 'Stirred', baseSpirit: 'Mezcal', ingredients: ['1 oz Mezcal', '1 oz Sweet Vermouth', '1 oz Campari', 'Orange peel'], instructions: 'Stir all ingredients with ice. Strain over a large ice sphere. Garnish with orange peel.', abv: '24%', glassType: 'Rocks', difficulty: 'Easy', imageEmoji: '🌿' },
    // ── Scotch / Brandy
    { name: 'Rob Roy', category: 'Stirred', baseSpirit: 'Scotch', ingredients: ['2 oz Scotch', '1 oz Sweet Vermouth', '2 dashes Angostura Bitters', 'Cherry'], instructions: 'Stir all ingredients with ice. Strain into a coupe. Garnish with cherry.', abv: '28%', glassType: 'Coupe', difficulty: 'Easy', imageEmoji: '🍒' },
    { name: 'Sidecar', category: 'Shaken', baseSpirit: 'Brandy', ingredients: ['1.5 oz Cognac', '0.75 oz Triple Sec', '0.75 oz Lemon Juice', 'Sugar rim'], instructions: 'Shake all ingredients with ice. Strain into a sugar-rimmed coupe.', abv: '22%', glassType: 'Coupe', difficulty: 'Medium', imageEmoji: '🍷' },
  ]).returning();

  // ────────────────────────────────────────────────────────────────────
  // 5. Favorites — recipes that are isFavorite: true in the frontend seed
  // ────────────────────────────────────────────────────────────────────
  console.log('❤️  Seeding recipe favorites…');
  const favNames = new Set(['Negroni', 'Martini', 'Old Fashioned', 'Manhattan', 'Margarita', 'Daiquiri', 'Espresso Martini']);
  const favRecipes = recipeRows.filter((r: any) => favNames.has(r.name));
  if (favRecipes.length > 0) {
    await db.insert(userFavorites).values(
      favRecipes.map((r: any) => ({ userId: DEV_USER_ID, recipeId: r.id }))
    );
    console.log(`   -> ${favRecipes.length} recipe favorites added`);
  }

  console.log('✅  Seed complete!');
  console.log(`\n   Dev user ID: ${DEV_USER_ID}`);
  console.log('   Pass this as userId in all dev API calls.\n');
}

export { seed };

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seed().then(() => process.exit(0)).catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); });
}
