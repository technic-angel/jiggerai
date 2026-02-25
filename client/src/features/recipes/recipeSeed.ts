// ─── Recipe Seed Data ─────────────────────────────────────────────────────────
// Phase B: replace with GET /api/recipes + GET /api/recipes/makeable/:userId

export interface SeedRecipe {
  id: number;
  name: string;
  category: string;       // cocktail style, e.g. "Sour", "Highball"
  baseSpirit: string;     // primary spirit, e.g. "Gin"
  ingredients: string[];
  instructions: string;
  abv: string;
  glassType: string;
  difficulty: "Easy" | "Medium" | "Hard";
  isMakeable: boolean;    // true = user has all ingredients in seed inventory
  isFavorite: boolean;
  imageEmoji: string;     // placeholder until real images
}

export const SEED_RECIPES: SeedRecipe[] = [
  // ── Gin
  {
    id: 1, name: "Gin & Tonic", category: "Highball", baseSpirit: "Gin",
    ingredients: ["2 oz Gin", "4 oz Tonic Water", "Lime wedge"],
    instructions: "Fill a highball glass with ice. Pour gin, top with tonic. Squeeze and drop in lime.",
    abv: "10%", glassType: "Highball", difficulty: "Easy",
    isMakeable: true, isFavorite: false, imageEmoji: "🥤",
  },
  {
    id: 2, name: "Negroni", category: "Stirred", baseSpirit: "Gin",
    ingredients: ["1 oz Gin", "1 oz Sweet Vermouth", "1 oz Campari", "Orange peel"],
    instructions: "Combine gin, vermouth, and Campari in a mixing glass with ice. Stir 30 sec. Strain over ice. Garnish with orange peel.",
    abv: "24%", glassType: "Rocks", difficulty: "Easy",
    isMakeable: true, isFavorite: true, imageEmoji: "🍊",
  },
  {
    id: 3, name: "Tom Collins", category: "Highball", baseSpirit: "Gin",
    ingredients: ["2 oz Gin", "1 oz Lemon Juice", "0.75 oz Simple Syrup", "Soda Water"],
    instructions: "Shake gin, lemon juice, and simple syrup with ice. Strain into a Collins glass with ice. Top with soda water.",
    abv: "11%", glassType: "Collins", difficulty: "Easy",
    isMakeable: true, isFavorite: false, imageEmoji: "🍋",
  },
  {
    id: 4, name: "Gimlet", category: "Shaken", baseSpirit: "Gin",
    ingredients: ["2.5 oz Gin", "0.75 oz Lime Juice", "0.75 oz Simple Syrup"],
    instructions: "Shake all ingredients with ice. Double strain into a chilled coupe.",
    abv: "22%", glassType: "Coupe", difficulty: "Easy",
    isMakeable: true, isFavorite: false, imageEmoji: "🍸",
  },
  {
    id: 5, name: "Martini", category: "Stirred", baseSpirit: "Gin",
    ingredients: ["2.5 oz Gin", "0.5 oz Dry Vermouth", "Lemon twist or olive"],
    instructions: "Stir gin and vermouth with ice for 30 seconds. Strain into a chilled martini glass.",
    abv: "30%", glassType: "Martini", difficulty: "Easy",
    isMakeable: true, isFavorite: true, imageEmoji: "🍸",
  },
  {
    id: 6, name: "Clover Club", category: "Shaken", baseSpirit: "Gin",
    ingredients: ["2 oz Gin", "0.75 oz Lemon Juice", "0.75 oz Simple Syrup", "0.5 oz Raspberry Syrup", "1 Egg White"],
    instructions: "Dry shake first, then shake with ice. Double strain into a coupe.",
    abv: "18%", glassType: "Coupe", difficulty: "Medium",
    isMakeable: false, isFavorite: false, imageEmoji: "🫐",
  },

  // ── Whiskey / Bourbon
  {
    id: 7, name: "Old Fashioned", category: "Stirred", baseSpirit: "Whiskey",
    ingredients: ["2 oz Bourbon", "2 dashes Angostura Bitters", "1 tsp Simple Syrup", "Orange peel"],
    instructions: "Add bitters and simple syrup to a rocks glass. Add ice and bourbon. Stir gently. Express orange peel over glass and drop in.",
    abv: "32%", glassType: "Rocks", difficulty: "Easy",
    isMakeable: true, isFavorite: true, imageEmoji: "🥃",
  },
  {
    id: 8, name: "Manhattan", category: "Stirred", baseSpirit: "Whiskey",
    ingredients: ["2 oz Rye or Bourbon", "1 oz Sweet Vermouth", "2 dashes Angostura Bitters", "Luxardo Cherry"],
    instructions: "Stir all ingredients with ice. Strain into a coupe. Garnish with cherry.",
    abv: "28%", glassType: "Coupe", difficulty: "Easy",
    isMakeable: true, isFavorite: true, imageEmoji: "🍒",
  },
  {
    id: 9, name: "Whiskey Sour", category: "Shaken", baseSpirit: "Whiskey",
    ingredients: ["2 oz Bourbon", "0.75 oz Lemon Juice", "0.75 oz Simple Syrup", "1 Egg White (optional)"],
    instructions: "Shake all ingredients (dry shake if using egg white, then with ice). Strain over ice or into a coupe.",
    abv: "18%", glassType: "Rocks or Coupe", difficulty: "Easy",
    isMakeable: true, isFavorite: false, imageEmoji: "🍋",
  },
  {
    id: 10, name: "Mint Julep", category: "Muddled", baseSpirit: "Bourbon",
    ingredients: ["2.5 oz Bourbon", "0.75 oz Simple Syrup", "8 Mint leaves", "Crushed ice"],
    instructions: "Gently muddle mint with simple syrup. Fill a julep cup with crushed ice. Add bourbon and stir. Pack with more crushed ice. Garnish with a mint bouquet.",
    abv: "28%", glassType: "Julep Cup", difficulty: "Medium",
    isMakeable: true, isFavorite: false, imageEmoji: "🌿",
  },
  {
    id: 11, name: "Boulevardier", category: "Stirred", baseSpirit: "Bourbon",
    ingredients: ["1.5 oz Bourbon", "1 oz Sweet Vermouth", "1 oz Campari", "Orange peel"],
    instructions: "Stir all ingredients with ice. Strain over a large ice sphere. Express orange peel.",
    abv: "22%", glassType: "Rocks", difficulty: "Easy",
    isMakeable: false, isFavorite: false, imageEmoji: "🍊",
  },
  {
    id: 12, name: "Paper Plane", category: "Shaken", baseSpirit: "Bourbon",
    ingredients: ["0.75 oz Bourbon", "0.75 oz Aperol", "0.75 oz Amaro Nonino", "0.75 oz Lemon Juice"],
    instructions: "Shake everything with ice. Double strain into a chilled coupe.",
    abv: "20%", glassType: "Coupe", difficulty: "Easy",
    isMakeable: false, isFavorite: false, imageEmoji: "✈️",
  },

  // ── Tequila
  {
    id: 13, name: "Margarita", category: "Sour", baseSpirit: "Tequila",
    ingredients: ["2 oz Tequila", "1 oz Lime Juice", "0.75 oz Triple Sec", "Salt rim"],
    instructions: "Shake tequila, lime, and triple sec with ice. Strain into a salt-rimmed rocks glass over ice.",
    abv: "18%", glassType: "Rocks", difficulty: "Easy",
    isMakeable: true, isFavorite: true, imageEmoji: "🍋",
  },
  {
    id: 14, name: "Paloma", category: "Highball", baseSpirit: "Tequila",
    ingredients: ["2 oz Tequila", "0.5 oz Lime Juice", "Grapefruit Soda", "Salt rim"],
    instructions: "Rim a glass with salt. Add ice, tequila, and lime juice. Top with grapefruit soda.",
    abv: "12%", glassType: "Highball", difficulty: "Easy",
    isMakeable: false, isFavorite: false, imageEmoji: "🌸",
  },
  {
    id: 15, name: "Tommy's Margarita", category: "Shaken", baseSpirit: "Tequila",
    ingredients: ["2 oz Tequila", "1 oz Lime Juice", "0.5 oz Agave Nectar"],
    instructions: "Shake all ingredients with ice. Strain into a rocks glass over ice.",
    abv: "20%", glassType: "Rocks", difficulty: "Easy",
    isMakeable: true, isFavorite: false, imageEmoji: "🌵",
  },
  {
    id: 16, name: "Tequila Sunrise", category: "Highball", baseSpirit: "Tequila",
    ingredients: ["2 oz Tequila", "4 oz Orange Juice", "0.5 oz Grenadine"],
    instructions: "Pour tequila and OJ over ice. Slowly pour grenadine down the side of the glass so it sinks.",
    abv: "12%", glassType: "Highball", difficulty: "Easy",
    isMakeable: false, isFavorite: false, imageEmoji: "🌅",
  },

  // ── Rum
  {
    id: 17, name: "Daiquiri", category: "Shaken", baseSpirit: "Rum",
    ingredients: ["2 oz White Rum", "1 oz Lime Juice", "0.75 oz Simple Syrup"],
    instructions: "Shake all ingredients vigorously with ice. Double strain into a chilled coupe.",
    abv: "20%", glassType: "Coupe", difficulty: "Easy",
    isMakeable: true, isFavorite: true, imageEmoji: "🍹",
  },
  {
    id: 18, name: "Mojito", category: "Muddled", baseSpirit: "Rum",
    ingredients: ["2 oz White Rum", "1 oz Lime Juice", "0.75 oz Simple Syrup", "8 Mint leaves", "Soda Water"],
    instructions: "Muddle mint gently with simple syrup. Add rum and lime juice. Fill with ice and top with soda water.",
    abv: "12%", glassType: "Collins", difficulty: "Easy",
    isMakeable: true, isFavorite: false, imageEmoji: "🌿",
  },
  {
    id: 19, name: "Dark & Stormy", category: "Highball", baseSpirit: "Rum",
    ingredients: ["2 oz Dark Rum", "4 oz Ginger Beer", "0.5 oz Lime Juice"],
    instructions: "Fill a glass with ice. Add lime juice, then dark rum. Float over ginger beer.",
    abv: "11%", glassType: "Highball", difficulty: "Easy",
    isMakeable: false, isFavorite: false, imageEmoji: "⛈️",
  },

  // ── Vodka
  {
    id: 20, name: "Moscow Mule", category: "Highball", baseSpirit: "Vodka",
    ingredients: ["2 oz Vodka", "4 oz Ginger Beer", "0.5 oz Lime Juice", "Lime wedge"],
    instructions: "Fill a copper mug with ice. Add vodka and lime juice. Top with ginger beer.",
    abv: "10%", glassType: "Copper Mug", difficulty: "Easy",
    isMakeable: false, isFavorite: false, imageEmoji: "🫖",
  },
  {
    id: 21, name: "Espresso Martini", category: "Stirred", baseSpirit: "Vodka",
    ingredients: ["1.5 oz Vodka", "1 oz Coffee Liqueur", "1 oz Fresh Espresso", "0.5 oz Simple Syrup"],
    instructions: "Shake all ingredients hard with ice for 15 seconds. Double strain into a chilled coupe.",
    abv: "18%", glassType: "Coupe", difficulty: "Medium",
    isMakeable: false, isFavorite: true, imageEmoji: "☕",
  },
  {
    id: 22, name: "Cosmopolitan", category: "Shaken", baseSpirit: "Vodka",
    ingredients: ["1.5 oz Citrus Vodka", "0.75 oz Triple Sec", "0.5 oz Lime Juice", "1 oz Cranberry Juice"],
    instructions: "Shake all ingredients with ice. Strain into a chilled martini glass. Garnish with orange twist.",
    abv: "20%", glassType: "Martini", difficulty: "Easy",
    isMakeable: false, isFavorite: false, imageEmoji: "🌸",
  },

  // ── Mezcal
  {
    id: 23, name: "Mezcal Negroni", category: "Stirred", baseSpirit: "Mezcal",
    ingredients: ["1 oz Mezcal", "1 oz Sweet Vermouth", "1 oz Campari", "Orange peel"],
    instructions: "Stir all ingredients with ice. Strain over a large ice sphere. Garnish with orange peel.",
    abv: "24%", glassType: "Rocks", difficulty: "Easy",
    isMakeable: true, isFavorite: false, imageEmoji: "🌿",
  },

  // ── Brandy / Scotch
  {
    id: 24, name: "Rob Roy", category: "Stirred", baseSpirit: "Scotch",
    ingredients: ["2 oz Scotch", "1 oz Sweet Vermouth", "2 dashes Angostura Bitters", "Cherry"],
    instructions: "Stir all ingredients with ice. Strain into a coupe. Garnish with cherry.",
    abv: "28%", glassType: "Coupe", difficulty: "Easy",
    isMakeable: true, isFavorite: false, imageEmoji: "🍒",
  },
  {
    id: 25, name: "Sidecar", category: "Shaken", baseSpirit: "Brandy",
    ingredients: ["1.5 oz Cognac", "0.75 oz Triple Sec", "0.75 oz Lemon Juice", "Sugar rim"],
    instructions: "Shake all ingredients with ice. Strain into a sugar-rimmed coupe.",
    abv: "22%", glassType: "Coupe", difficulty: "Medium",
    isMakeable: false, isFavorite: false, imageEmoji: "🍷",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const RECIPE_BASE_SPIRITS = [
  "Gin", "Whiskey", "Bourbon", "Tequila", "Rum", "Vodka", "Mezcal", "Scotch", "Brandy",
];

export const RECIPE_CATEGORIES = [
  "Sour", "Sweet", "Highball", "Stirred", "Muddled", "Shaken", "Other",
];

export const SPIRIT_EMOJI: Record<string, string> = {
  Gin:     "🍸",
  Whiskey: "🥃",
  Bourbon: "🪵",
  Tequila: "🌵",
  Rum:     "🍹",
  Vodka:   "🧊",
  Mezcal:  "🌿",
  Scotch:  "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  Brandy:  "🍷",
};

export const STYLE_EMOJI: Record<string, string> = {
  Sour:      "🍋",
  Sweet:     "🍬",
  Highball:  "🥤",
  Stirred:   "🥄",
  Muddled:   "🌿",
  Shaken:    "🍸",
  Other:     "✨",
};
