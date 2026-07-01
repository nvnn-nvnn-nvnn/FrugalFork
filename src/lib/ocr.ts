import * as ImagePicker from 'expo-image-picker';

import { invokeExtract } from '@/lib/extract/client';
import type { ExtractedRecipe } from '@/lib/recipes/extracted';

/**
 * Real OCR via the `extract` Edge Function (Claude vision). The user picks/takes
 * a photo, we send the base64 to the server, and get back structured data.
 *
 * Each function returns `null` when the user cancels the picker, and throws a
 * user-readable error if the extraction itself fails — callers surface that.
 */

export type ReceiptLine = { name: string; cost: number };
export type ReceiptScan = { items: ReceiptLine[]; total: number };

type Capture = { image: string; imageType: string };

/**
 * Open the photo library and return the chosen image as base64. (Swap
 * `launchImageLibraryAsync` for `launchCameraAsync` to shoot directly — same
 * options/result shape; the library path also works on web and simulators.)
 */
async function captureImage(): Promise<Capture | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.5, // smaller payload — OCR doesn't need full resolution
    base64: true,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset?.base64) return null;
  return { image: asset.base64, imageType: asset.mimeType ?? 'image/jpeg' };
}

/** Scan a grocery receipt into line items + total. Null if the user cancels. */
export async function scanReceipt(): Promise<ReceiptScan | null> {
  const capture = await captureImage();
  if (!capture) return null;
  const { receipt } = await invokeExtract<{ receipt: ReceiptScan }>({ kind: 'receipt', ...capture });
  return receipt;
}

/** Scan a recipe from a photo/screenshot. Null if the user cancels. */
export async function scanRecipePhoto(): Promise<ExtractedRecipe | null> {
  const capture = await captureImage();
  if (!capture) return null;
  const { recipe } = await invokeExtract<{ recipe: ExtractedRecipe }>({ kind: 'recipe', ...capture });
  return recipe;
}
