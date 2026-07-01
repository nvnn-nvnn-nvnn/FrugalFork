import { invokeExtract } from '@/lib/extract/client';
import type { ExtractedRecipe } from '@/lib/recipes/extracted';

/**
 * Import a recipe from a web/Pinterest link. The server resolves the page (and,
 * for Pinterest pins, hops to the source article), prefers schema.org JSON-LD,
 * and falls back to Claude on the page text — returning a structured recipe.
 * Throws a user-readable error if nothing recipe-like is found.
 */
export async function importRecipeFromUrl(url: string): Promise<ExtractedRecipe> {
  const { recipe } = await invokeExtract<{ recipe: ExtractedRecipe }>({
    kind: 'recipe',
    url: url.trim(),
  });
  return recipe;
}
