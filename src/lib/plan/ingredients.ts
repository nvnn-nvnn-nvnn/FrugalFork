/**
 * Ingredient → grocery category. Shared by the dish-detail ingredient list and
 * the Shop's categorized shopping list, so both group the same way. Unknown
 * names fall back to "Pantry".
 */
const INGREDIENT_CATEGORY: Record<string, string> = {
  // Protein
  eggs: 'Protein',
  egg: 'Protein',
  'chicken thigh': 'Protein',
  'canned beans': 'Protein',
  'canned chickpeas': 'Protein',
  'red lentils': 'Protein',
  'peanut butter': 'Protein',
  'canned tuna': 'Protein',
  sardines: 'Protein',
  tofu: 'Protein',
  'ground beef': 'Protein',
  bacon: 'Protein',
  ham: 'Protein',
  sausage: 'Protein',
  hummus: 'Protein',
  'baked beans': 'Protein',
  // Produce
  banana: 'Produce',
  onion: 'Produce',
  'frozen veg': 'Produce',
  'frozen berries': 'Produce',
  carrot: 'Produce',
  'mixed greens': 'Produce',
  cucumber: 'Produce',
  potato: 'Produce',
  avocado: 'Produce',
  lemon: 'Produce',
  'sweet potato': 'Produce',
  'bell pepper': 'Produce',
  mushroom: 'Produce',
  spinach: 'Produce',
  corn: 'Produce',
  peas: 'Produce',
  cabbage: 'Produce',
  'spring onion': 'Produce',
  lettuce: 'Produce',
  // Dairy
  milk: 'Dairy',
  butter: 'Dairy',
  yogurt: 'Dairy',
  cheese: 'Dairy',
  'cream cheese': 'Dairy',
  feta: 'Dairy',
  parmesan: 'Dairy',
  // Spices / sauces
  'soy sauce': 'Spices & sauces',
  'chili oil': 'Spices & sauces',
  'curry powder': 'Spices & sauces',
  salsa: 'Spices & sauces',
  dressing: 'Spices & sauces',
  'stock cube': 'Spices & sauces',
  'olive oil': 'Spices & sauces',
  mayo: 'Spices & sauces',
  // Pantry (default for the rest): flour, bagel, granola, honey, couscous,
  // quinoa, pita, bread, rice, pasta, tortilla, instant noodles, canned tomatoes
};

/** Display order for grocery categories. */
export const CATEGORY_ORDER = ['Protein', 'Produce', 'Dairy', 'Pantry', 'Spices & sauces', 'Other'];

/** Map a known ingredient name to a shopping/section category. */
export function categoryOf(name: string): string {
  return INGREDIENT_CATEGORY[name] ?? 'Pantry';
}
