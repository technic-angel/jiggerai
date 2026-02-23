/* eslint-disable no-console */
import { db } from './index.js';
import { inventory, ingredients } from './schema.js';

async function normalize(s: string | null | undefined) {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function link() {
  console.log('🔗 Linking inventory rows to canonical ingredients...');

  const rows = await db.select().from(inventory).where(inventory.ingredientId.isNull());
  console.log(`Found ${rows.length} inventory rows without ingredientId`);

  const allIngredients = await db.select().from(ingredients);
  const normalizedIndex: Record<string, any> = {};
  allIngredients.forEach((ing: any) => {
    const key = (ing.name || '').toLowerCase();
    normalizedIndex[key] = ing;
  });

  let linked = 0;
  for (const row of rows) {
    const name = row.spiritName || row.itemName || '';
    const norm = await normalize(name);

    // 1) exact lowercase match
    let match = allIngredients.find((i: any) => (i.name || '').toLowerCase() === norm);

    // 2) substring match
    if (!match) {
      match = allIngredients.find((i: any) => (i.name || '').toLowerCase().includes(norm) || norm.includes((i.name || '').toLowerCase()));
    }

    // 3) token overlap
    if (!match && norm) {
      const tokens = norm.split(' ');
      match = allIngredients.find((i: any) => {
        const inorm = (i.name || '').toLowerCase();
        const itoks = inorm.split(' ');
        const common = tokens.filter((t) => itoks.includes(t));
        return common.length >= Math.max(1, Math.floor(tokens.length / 2));
      });
    }

    if (match) {
      await db.update(inventory).set({ ingredientId: match.id }).where(inventory.id.eq(row.id));
      linked += 1;
      console.log(`Linked inventory id=${row.id} ('${name}') -> ingredient id=${match.id} ('${match.name}')`);
    } else {
      console.log(`No match for inventory id=${row.id} ('${name}')`);
    }
  }

  console.log(`✅ Linked ${linked} rows`);
  process.exit(0);
}

link().catch((err) => {
  console.error('Linker failed:', err);
  process.exit(1);
});
