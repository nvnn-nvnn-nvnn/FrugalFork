# 06 — Shopping & OCR

**Goal:** turn the chosen dishes into one curated shopping list, and track real
spend against the budget — including scanning receipts.

> Note: the shopping list is built from the **meal builder** (every dish across
> all days), not a separate week plan. A future phase makes this push-based
> (per-dish "add to groceries" + "add all" focused screen) — see [09](./09-gaps-next-steps.md).

## Files

| File | Role |
|------|------|
| `src/app/(tabs)/shop.tsx` | The Shop screen |
| `src/lib/plan/planner.ts` | `buildShoppingList(builder)` aggregation |
| `src/lib/ocr.ts` | OCR + camera **placeholder** (receipts + meal photos) |
| `src/components/plan/budget-bar.tsx` | Reused budget bar |

## Shopping list aggregation (`buildShoppingList` in `planner.ts`)

Walks every dish in the builder, pulls each recipe's ingredients, and **merges by
ingredient name**:
- sums the estimated cost,
- collects each portion description (so "rice" used 3× shows all three quantities).

Returns `{ items: ShoppingItem[], total }`, sorted by cost descending.
`ShoppingItem = { name, qtys[], cost }`.

## The Shop screen (`src/app/shop.tsx`)

Two cards:

1. **Spend tracking**
   - `BudgetBar` "Spent this week" — real spend vs budget (from `usePlan().spend`).
   - **📷 Scan a receipt** button → `scanReceipt()` (placeholder) → `addSpend(total)`.
   - Shows the parsed receipt lines + total after scanning.

2. **Ingredients** (only if the builder has dishes)
   - "est. $X" total + a `BudgetBar` "Estimated grocery cost" vs budget.
   - The curated list: each item with its quantities and summed cost.
   - If nothing's picked yet, a friendly nudge to add dishes in Decide.

## OCR placeholder (`src/lib/ocr.ts`)

> This is intentionally a **stub**. Real receipt OCR and photo capture need native
> camera + an OCR engine or vision API; those aren't wired yet.

- `scanReceipt(): Promise<ReceiptScan>` — returns a canned sample receipt after a
  short delay. `ReceiptScan = { items: {name, cost}[], total }`.
- `captureMealPhoto(): Promise<string>` — returns a placeholder reference like
  `placeholder://meal/<timestamp>` (used by the Plan screen's 📷 action).
- `isPlaceholderPhoto(uri)` — helper to detect placeholder URIs.

**To make it real:** add `expo-image-picker` (or `expo-camera`) for capture and an
OCR/vision call for parsing. Keep the same function signatures and return shapes —
the screens already depend on them, so nothing in the UI needs to change.
