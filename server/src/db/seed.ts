/* eslint-disable no-console */
import { db } from './index.js';
import { users, inventory, recipes, userFavorites, ingredients, recipeIngredients } from './schema.js';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Clear existing data
  console.log('🧹 Clearing old data...');
  await db.delete(userFavorites);
  await db.delete(inventory);
  await db.delete(recipes);
  await db.delete(users);

  // 2. Create a User
  console.log('👤 Creating user...');
  const userId = uuidv4();
  const [user] = await db.insert(users).values({
    id: userId,
    email: 'melissa@example.com',
    displayName: 'Melissa',
  }).returning();

  console.log(`   -> Created user: ${user.displayName} (${user.id})`);

  // 3. Add Inventory
  console.log('🍾 Adding inventory...');
  // insert canonical ingredients first
  const ingredientRows = await db.insert(ingredients).values([
    { name: "Hendrick's Gin", type: 'spirit', unit: 'ml', category: 'Gin' },
    { name: 'Campari', type: 'liqueur', unit: 'ml', category: 'Bitter' },
    { name: 'Sweet Vermouth', type: 'liqueur', unit: 'ml', category: 'Vermouth' },
    { name: 'Tonic Water', type: 'mixer', unit: 'ml', category: 'Soda' },
    { name: 'Simple Syrup', type: 'sweetener', unit: 'ml', category: 'Syrup' },
    { name: 'Lime Juice', type: 'citrus', unit: 'ml', category: 'Citrus' },
    { name: 'Mint Leaves', type: 'garnish', unit: 'count', category: 'Herb' },
  ]).returning();

  const findIngredientId = (name: string) => {
    const row = ingredientRows.find((r: any) => r.name === name);
    return row ? row.id : null;
  };

  await db.insert(inventory).values([
    {
      userId: user.id,
      spiritName: "Hendrick's Gin",
      category: 'Gin',
      volumeEighths: 8,
      purchasePrice: '35.00',
      unopenedCount: 2,
      ingredientId: findIngredientId("Hendrick's Gin"),
      // Example flavor values (0.00 - 1.00)
      flavor_sweetness: '0.05',
      flavor_bitterness: '0.02',
      flavor_sourness: '0.01',
      flavor_body: '0.40',
    },
    {
      userId: user.id,
      spiritName: 'Campari',
      category: 'Liqueur',
      volumeEighths: 6,
      purchasePrice: '28.00',
      unopenedCount: 1,
      ingredientId: findIngredientId('Campari'),
      flavor_sweetness: '0.10',
      flavor_bitterness: '0.85',
      flavor_sourness: '0.05',
      flavor_body: '0.30',
    },
    {
      userId: user.id,
      spiritName: 'Sweet Vermouth',
      category: 'Vermouth',
      volumeEighths: 4,
      purchasePrice: '15.00',
      unopenedCount: 0,
      ingredientId: findIngredientId('Sweet Vermouth'),
      flavor_sweetness: '0.60',
      flavor_bitterness: '0.05',
      flavor_sourness: '0.02',
      flavor_body: '0.25',
    },
  ]);

  // 4. Add Recipes
  console.log('🍹 Adding recipes...');
  const [negroni, gnt] = await db.insert(recipes).values([
    {
      name: 'Negroni',
      category: 'Cocktail',
      ingredients: ['1 oz Gin', '1 oz Campari', '1 oz Sweet Vermouth'],
      instructions: 'Stir with ice and strain into a chilled glass. Garnish with an orange peel.',
      // Basic embedding placeholder — small, non-zero values to show shape
      embedding: Array.from({ length: 768 }, (_, i) => (i % 7 === 0 ? 0.01 : 0.0)),
      // flavor attributes (approximate)
      flavor_sweetness: '0.25',
      flavor_bitterness: '0.45',
      flavor_sourness: '0.02',
      flavor_body: '0.35',
    },
    {
      name: 'Gin & Tonic',
      category: 'Cocktail',
      ingredients: ['2 oz Gin', '4 oz Tonic Water'],
      instructions: 'Build in a highball glass over ice. Garnish with a lime wedge.',
      embedding: Array.from({ length: 768 }, (_, i) => (i % 13 === 0 ? 0.01 : 0.0)),
      flavor_sweetness: '0.05',
      flavor_bitterness: '0.05',
      flavor_sourness: '0.10',
      flavor_body: '0.20',
    },
  ]).returning();

  // Create recipe_ingredients mappings for structured lookups
  const hendricksId = findIngredientId("Hendrick's Gin");
  const campariId = findIngredientId('Campari');
  const vermouthId = findIngredientId('Sweet Vermouth');
  const tonicId = findIngredientId('Tonic Water');

  if (negroni && negroni.id) {
    await db.insert(recipeIngredients).values([
      { recipeId: negroni.id, ingredientId: hendricksId, amountText: '1 oz', position: 0 },
      { recipeId: negroni.id, ingredientId: campariId, amountText: '1 oz', position: 1 },
      { recipeId: negroni.id, ingredientId: vermouthId, amountText: '1 oz', position: 2 },
    ]);
  }

  if (gnt && gnt.id) {
    await db.insert(recipeIngredients).values([
      { recipeId: gnt.id, ingredientId: hendricksId, amountText: '2 oz', position: 0 },
      { recipeId: gnt.id, ingredientId: tonicId, amountText: '4 oz', position: 1 },
    ]);
  }

  console.log('✅ Seeding complete!');
  return;
}
export { seed };

// Keep CLI compatibility: if run directly with tsx, execute seed
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seed().then(() => process.exit(0)).catch((err) => { console.error('❌ Seeding failed:', err); process.exit(1); });
}
