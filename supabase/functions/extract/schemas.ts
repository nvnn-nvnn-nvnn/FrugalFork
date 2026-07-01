// Structured-output schemas for the `extract` function.
//
// These mirror the app's `Recipe` shape (src/lib/plan/types.ts) and the diet /
// craving vocabularies (src/lib/plan/diets.ts, recipes.ts). KEEP IN SYNC — the
// enums here constrain what Claude may emit so imported/scanned recipes filter
// and group exactly like the curated library.

/** Meal slots — mirrors `Slot` in src/lib/plan/types.ts. */
export const SLOTS = ['breakfast', 'lunch', 'dinner'] as const;

/** Craving/cuisine tags — mirrors CRAVINGS in src/lib/plan/recipes.ts. */
export const CRAVINGS = [
  'comfort',
  'asian',
  'mexican',
  'italian',
  'healthy',
  'high-protein',
  'quick',
  'spicy',
] as const;

/** Dietary attributes a recipe can contain — mirrors `FoodAttr` in diets.ts. */
export const FOOD_ATTRS = [
  'meat',
  'poultry',
  'fish',
  'shellfish',
  'pork',
  'dairy',
  'egg',
  'gluten',
  'high-carb',
] as const;

/** What the model returns for a recipe (no id/cost/cheap — the client derives those). */
export type ExtractedRecipe = {
  title: string;
  emoji: string;
  slots: (typeof SLOTS)[number][];
  calories: number;
  health: string;
  tags: (typeof CRAVINGS)[number][];
  contains: (typeof FOOD_ATTRS)[number][];
  ingredients: { name: string; qty: string; cost: number }[];
  steps: string[];
};

export type ExtractedReceipt = {
  items: { name: string; cost: number }[];
  total: number;
};

// JSON Schemas for structured outputs. Constraints honor the API's limits:
// every object sets additionalProperties:false + required; no min/max or length.

export const RECIPE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Dish name, title-cased.' },
    emoji: { type: 'string', description: 'A single food emoji that fits the dish.' },
    slots: {
      type: 'array',
      description: 'Which meals this fits.',
      items: { type: 'string', enum: SLOTS },
    },
    calories: { type: 'integer', description: 'Estimated calories per serving.' },
    health: { type: 'string', description: 'Short health note, e.g. "high protein · fiber".' },
    tags: {
      type: 'array',
      description: 'Craving/cuisine tags from the allowed set.',
      items: { type: 'string', enum: CRAVINGS },
    },
    contains: {
      type: 'array',
      description: 'Dietary attributes present, from the allowed set (for diet filtering).',
      items: { type: 'string', enum: FOOD_ATTRS },
    },
    ingredients: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Lower-case ingredient name.' },
          qty: { type: 'string', description: 'Amount used, e.g. "1 cup".' },
          cost: { type: 'number', description: 'Estimated USD cost of the portion used.' },
        },
        required: ['name', 'qty', 'cost'],
        additionalProperties: false,
      },
    },
    steps: { type: 'array', items: { type: 'string' } },
  },
  required: ['title', 'emoji', 'slots', 'calories', 'health', 'tags', 'contains', 'ingredients', 'steps'],
  additionalProperties: false,
} as const;

export const RECEIPT_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Line-item name as printed.' },
          cost: { type: 'number', description: 'Line-item price in USD.' },
        },
        required: ['name', 'cost'],
        additionalProperties: false,
      },
    },
    total: { type: 'number', description: 'Receipt total in USD.' },
  },
  required: ['items', 'total'],
  additionalProperties: false,
} as const;
