import { seed } from './seed.js';

seed().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
