# `extract` — OCR + recipe-link import (Claude)

One Edge Function behind three SnackPlan Plus features. Turns unstructured input
into structured data using Claude (`claude-opus-4-8`) with **structured outputs**,
so the response always matches our schema.

| Request body | Returns | Used by |
|---|---|---|
| `{ kind: 'receipt', image, imageType? }` | `{ receipt: { items, total } }` | Shop → Scan a receipt |
| `{ kind: 'recipe',  image, imageType? }` | `{ recipe: ExtractedRecipe }` | Cookbook → Scan a recipe |
| `{ kind: 'recipe',  url }` | `{ recipe: ExtractedRecipe }` | Cookbook → Import a recipe |

`image` is base64 (no data-URL prefix). For `url`, the server resolves the page
(Pinterest pins hop to their source article), prefers schema.org/Recipe JSON-LD,
and falls back to Claude on the page text.

## Why a server

The `ANTHROPIC_API_KEY` must never ship in the app bundle, web can't fetch
arbitrary recipe sites (CORS), and parsing logic should change without an app
release. The app just calls this function; Supabase attaches the user's auth.

## Deploy

```sh
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy extract
```

Supabase enforces a valid JWT by default, so only signed-in users reach it.

## TODO before launch

- **Verify SnackPlan Plus entitlement here** (server-side), so free users can't
  spend Claude tokens — e.g. a `premium` table updated by a RevenueCat webhook,
  checked at the top of the handler. The client gates the UI, but the server is
  the real boundary.
- Consider `claude-haiku-4-5` as a cost lever if extraction volume gets high.

## Keep in sync

`schemas.ts` mirrors the app's `Recipe` shape and the diet/craving vocabularies
(`src/lib/plan/types.ts`, `diets.ts`, `recipes.ts`). If those enums change,
update `schemas.ts` too, or imports will carry values the app's filters ignore.
