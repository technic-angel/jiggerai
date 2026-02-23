import { db } from './index.js';
import { users, inventory, recipes, userFavorites } from './schema.js';
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
  await db.insert(inventory).values([
    {
      userId: user.id,
      spiritName: "Hendrick's Gin",
      category: 'Gin',
      volumeEighths: 8,
      purchasePrice: '35.00',
    },
    {
      userId: user.id,
      spiritName: 'Campari',
      category: 'Liqueur',
      volumeEighths: 6,
      purchasePrice: '28.00',
    },
    {
      userId: user.id,
      spiritName: 'Sweet Vermouth',
      category: 'Vermouth',
      volumeEighths: 4,
      purchasePrice: '15.00',
    },
  ]);

  // 4. Add Recipes
  console.log('🍹 Adding recipes...');
  await db.insert(recipes).values([
    {
      name: 'Negroni',
      category: 'Cocktail',
      ingredients: ['1 oz Gin', '1 oz Campari', '1 oz Sweet Vermouth'],
      instructions: 'Stir with ice and strain into a chilled glass. Garnish with an orange peel.',
    },
    {
      name: 'Gin & Tonic',
      category: 'Cocktail',
      ingredients: ['2 oz Gin', '4 oz Tonic Water'],
      instructions: 'Build in a highball glass over ice. Garnish with a lime wedge.',
    },
  ]);

  console.log('✅ Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
