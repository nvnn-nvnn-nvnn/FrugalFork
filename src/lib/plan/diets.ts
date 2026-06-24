import type { Recipe } from './types';

/**
 * Diet handling, rule-based.
 *
 * Each recipe declares what it *contains* (see `Recipe.contains`). Each diet
 * declares which of those attributes it *forbids*. A recipe satisfies a diet if
 * it contains none of the forbidden attributes. This is far less error-prone than
 * hand-listing every compatible diet on every recipe.
 */

/** Attributes a recipe can contain. */
export type FoodAttr =
  | 'meat' // red meat
  | 'poultry'
  | 'fish'
  | 'shellfish'
  | 'pork'
  | 'dairy'
  | 'egg'
  | 'gluten'
  | 'high-carb';

/** The diet/lifestyle options offered in onboarding. */
export const DIETS = [
  'vegetarian',
  'vegan',
  'pescatarian',
  'low-carb',
  'gluten-free',
  'dairy-free',
  'halal',
  'kosher',
] as const;

export type Diet = (typeof DIETS)[number];

/** What each diet forbids a recipe from containing. */
const FORBIDDEN: Record<Diet, FoodAttr[]> = {
  vegetarian: ['meat', 'poultry', 'fish', 'shellfish', 'pork'],
  vegan: ['meat', 'poultry', 'fish', 'shellfish', 'pork', 'dairy', 'egg'],
  pescatarian: ['meat', 'poultry', 'pork'],
  'low-carb': ['high-carb'],
  'gluten-free': ['gluten'],
  'dairy-free': ['dairy'],
  halal: ['pork'],
  kosher: ['pork', 'shellfish'],
};

export function recipeSatisfiesDiet(recipe: Recipe, diet: string): boolean {
  const forbidden = FORBIDDEN[diet as Diet] as string[] | undefined;
  if (!forbidden) return true; // unknown diet → don't filter
  return !recipe.contains.some((attr) => forbidden.includes(attr));
}

/** True only if the recipe satisfies every selected diet. */
export function recipeSatisfiesDiets(recipe: Recipe, diets: string[]): boolean {
  return diets.every((diet) => recipeSatisfiesDiet(recipe, diet));
}
