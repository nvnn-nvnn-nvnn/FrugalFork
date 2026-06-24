/**
 * OCR + camera PLACEHOLDER.
 *
 * Real receipt OCR and meal-photo capture need native modules (camera, an OCR
 * engine or a vision API). Until those are wired, these stubs return canned data
 * after a short delay so the UI and data flow can be built and tested end-to-end.
 *
 * Swap the bodies for expo-image-picker + a vision/OCR call; the signatures and
 * return shapes are the contract the screens already depend on.
 */

export type ReceiptLine = { name: string; cost: number };
export type ReceiptScan = { items: ReceiptLine[]; total: number };

const SAMPLE_RECEIPT: ReceiptScan = {
  items: [
    { name: 'rice 2kg', cost: 4.5 },
    { name: 'eggs x12', cost: 3.2 },
    { name: 'canned beans x4', cost: 3.6 },
    { name: 'frozen veg 1kg', cost: 2.5 },
    { name: 'pasta 1kg', cost: 1.8 },
    { name: 'onions 1kg', cost: 1.2 },
    { name: 'milk 2L', cost: 2.4 },
  ],
  total: 19.2,
};

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** PLACEHOLDER: pretend to open the camera, scan a receipt, and parse it. */
export async function scanReceipt(): Promise<ReceiptScan> {
  await delay(900);
  return SAMPLE_RECEIPT;
}
