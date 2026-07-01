# 10 — Editing the premade dishes (admin guide)

Everything about the curated ("premade") dishes lives in **plain data files** you
edit by hand. There's no database and no admin UI — you change a TypeScript array,
save, and the app picks it up. Normal users can't change these dishes in the app;
only you (editing these files) can.

## TL;DR — the two files you'll touch

| File | What's in it |
|---|---|
| [`src/lib/plan/recipes.ts`](../src/lib/plan/recipes.ts) | **The dishes themselves** — the `RECIPES` array. Add/edit dishes here. |
| [`src/lib/plan/ingredients.ts`](../src/lib/plan/ingredients.ts) | Ingredient → shopping-category map. Add any **new** ingredient name you use. |

After editing, verify nothing broke:

```sh
npx tsc --noEmit -p tsconfig.json
```

---

## 1. Where the dishes are

Open [`src/lib/plan/recipes.ts`](../src/lib/plan/recipes.ts). The whole library is
one array called `RECIPES`. Each `{ … }` block is one dish. `RECIPES_BY_ID` (used
everywhere else) is built from this array automatically — you only edit `RECIPES`.

## 2. The shape of one dish

```ts
{
  id: 'r-tunapasta',          // unique, lowercase, prefix "r-". NEVER reuse an id.
  title: 'Tuna pasta',        // shown everywhere
  emoji: '🐟',                // fallback thumbnail when there's no photo
  image: 'https://…/tuna.jpg',// OPTIONAL photo thumbnail (see §4)
  slots: ['lunch', 'dinner'], // any of: breakfast | lunch | dinner
  cost: 1.7,                  // est. $ per serving (usually ≈ sum of ingredient costs)
  calories: 580,              // per serving
  health: 'omega-3 · protein',// short benefit line, "·"-separated
  cheap: true,                // true = a standout cheap eat (roughly cost ≤ ~1.5)
  tags: ['italian', 'high-protein', 'quick'],   // cravings — see allowed list below
  contains: ['fish', 'gluten', 'high-carb'],    // diet attributes — see below
  ingredients: [
    { name: 'pasta',      qty: '100g',  cost: 0.4 },
    { name: 'canned tuna', qty: '1 can', cost: 1.0 },
  ],
  steps: ['Boil the pasta.', 'Stir through the tuna.'],  // OPTIONAL
}
```

### Allowed values (use ONLY these — anything else is silently ignored by filters)

- **`slots`**: `breakfast`, `lunch`, `dinner`
- **`tags`** (cravings): `comfort`, `asian`, `mexican`, `italian`, `healthy`,
  `high-protein`, `quick`, `spicy`
- **`contains`** (dietary attributes): `meat`, `poultry`, `fish`, `shellfish`,
  `pork`, `dairy`, `egg`, `gluten`, `high-carb`

`contains` is what powers **diet filtering** ([`diets.ts`](../src/lib/plan/diets.ts)).
A diet hides any dish that *contains* something it forbids — e.g. `vegetarian`
forbids `meat`/`poultry`/`fish`/`shellfish`/`pork`; `gluten-free` forbids `gluten`.
So be accurate: if a dish has cheese, add `dairy`; bread/pasta/rice → `high-carb`
(and usually `gluten`). A dish with `contains: []` passes **every** diet.

## 3. Ingredients & cost (this is the budget engine)

Each ingredient's `cost` is the price of **the portion this recipe uses**, in USD.
The app sums these for the dish cost, the weekly budget, and the shopping total —
so rough-but-honest numbers matter more than precision.

**If you introduce a new ingredient name**, add it to the category map in
[`ingredients.ts`](../src/lib/plan/ingredients.ts) so the shopping list groups it
correctly (otherwise it falls into "Pantry"):

```ts
// in INGREDIENT_CATEGORY
'smoked salmon': 'Protein',
'bok choy': 'Produce',
```

Categories: `Protein`, `Produce`, `Dairy`, `Pantry`, `Spices & sauces`.

## 4. Adding a photo to a premade dish

Set the `image` field to an **image URL** that's publicly reachable (host it
anywhere — Supabase Storage, Cloudinary, a CDN). It ships with the app, so every
user sees it. The emoji is the fallback when `image` is omitted.

```ts
image: 'https://yourcdn.com/dishes/tuna-pasta.jpg',
```

> A user's own in-app photo (if they set one on their device) overrides this for
> them only. Premade `image` is the default everyone gets.

## 5. Adding a brand-new dish

1. Copy an existing block in `RECIPES`.
2. Give it a **new unique `id`** (`r-something`).
3. Fill in every field; pick `slots`/`tags`/`contains` from the allowed lists.
4. Add any new ingredient names to [`ingredients.ts`](../src/lib/plan/ingredients.ts).
5. Run `npx tsc --noEmit -p tsconfig.json` — TypeScript will flag typos/missing fields.

That's it — it shows up in Discover, the planner picker, and search immediately.

---

## Who can edit what (the lock)

- **Normal users**: can only add a photo to dishes **they** created/imported.
  Premade dishes are read-only in the app — no edit affordance is shown.
- **You (admin)**: set `EXPO_PUBLIC_ADMIN=true` in your local `.env` to also get
  the "📷 Change photo" button on premade dishes (handy for previewing). But the
  photo set that way is per-device — to ship a premade photo to **all** users, put
  the URL in the dish's `image` field here, as in §4.

Enforced in [`src/lib/admin.ts`](../src/lib/admin.ts) +
[`src/app/dish/[id].tsx`](../src/app/dish/%5Bid%5D.tsx).

## Keep in sync

If you ever change the allowed `tags`/`contains`/`slots` vocab, update **all** of:
`recipes.ts` (CRAVINGS) · `diets.ts` (FoodAttr) · the import/OCR schemas in
`supabase/functions/extract/schemas.ts` — otherwise imported recipes can carry
values the app's filters ignore.
