// Supabase Edge Function: `extract`
//
// One extraction backend for all three "unstructured → Recipe/Receipt" flows:
//   • receipt OCR      { kind: 'receipt', image }
//   • recipe photo OCR { kind: 'recipe',  image }
//   • recipe by link   { kind: 'recipe',  url }
//
// It calls Claude (claude-opus-4-8) with structured outputs so the response is
// guaranteed to match our schema — no brittle parsing on the client. The
// ANTHROPIC_API_KEY lives ONLY here (a Supabase secret), never in the app bundle.
//
// Deploy:  supabase functions deploy extract
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// NOTE: Supabase enforces a valid JWT by default, so only signed-in users reach
// this. TODO before launch: also verify the caller's SnackPlan Plus entitlement
// here (e.g. a `premium` table updated by a RevenueCat webhook) so free users
// can't spend Claude tokens.

import { fetchPageContext } from './page.ts';
import {
  RECEIPT_SCHEMA,
  RECIPE_SCHEMA,
  type ExtractedReceipt,
  type ExtractedRecipe,
} from './schemas.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MODEL = 'claude-opus-4-8';

type ImageBlock = {
  type: 'image';
  source: { type: 'base64'; media_type: string; data: string };
};
type TextBlock = { type: 'text'; text: string };
type Block = ImageBlock | TextBlock;

/** Call Claude with a JSON-schema-constrained response and return the parsed object. */
async function callClaude<T>(apiKey: string, schema: unknown, content: Block[]): Promise<T> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      output_config: { format: { type: 'json_schema', schema } },
      messages: [{ role: 'user', content }],
    }),
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    throw new Error(`Claude API error (${res.status}): ${detail}`);
  }

  const data = await res.json();
  if (data.stop_reason === 'refusal') throw new Error('The request was declined.');
  const textBlock = (data.content ?? []).find((b: { type: string }) => b.type === 'text');
  if (!textBlock?.text) throw new Error('No structured output was returned.');
  return JSON.parse(textBlock.text) as T;
}

const RECEIPT_PROMPT =
  'Extract every line item and the total from this grocery receipt photo as JSON. ' +
  'Use USD. Merge obvious duplicate lines. If a price is unreadable, give your best estimate.';

const RECIPE_PHOTO_PROMPT =
  'Extract this recipe from the photo into JSON matching the schema. Pick fitting meal ' +
  'slots, craving tags, and dietary "contains" attributes ONLY from the allowed sets. ' +
  'Estimate a realistic per-ingredient cost in USD for a typical US grocery store. ' +
  'Write concise, numbered-feeling step instructions (one action per step).';

function recipeUrlPrompt(ctx: { title: string; description: string; jsonLd: string[]; text: string }): string {
  return (
    'Extract the recipe described below into JSON matching the schema. If schema.org ' +
    'JSON-LD is present, prefer it as the source of truth. Choose meal slots, craving ' +
    'tags, and dietary "contains" attributes ONLY from the allowed sets. Estimate a ' +
    'realistic per-ingredient cost in USD for a typical US grocery store.\n\n' +
    `TITLE: ${ctx.title}\n` +
    `DESCRIPTION: ${ctx.description}\n\n` +
    `JSON-LD:\n${ctx.jsonLd.join('\n').slice(0, 8000) || '(none found)'}\n\n` +
    `PAGE TEXT:\n${ctx.text}`
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, 'content-type': 'application/json' },
    });

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) return json({ error: 'Server is missing ANTHROPIC_API_KEY.' }, 500);

    const { kind, image, imageType, url } = await req.json();

    if (kind === 'receipt') {
      if (!image) return json({ error: 'A receipt image is required.' }, 400);
      const receipt = await callClaude<ExtractedReceipt>(apiKey, RECEIPT_SCHEMA, [
        { type: 'image', source: { type: 'base64', media_type: imageType ?? 'image/jpeg', data: image } },
        { type: 'text', text: RECEIPT_PROMPT },
      ]);
      return json({ receipt });
    }

    if (kind === 'recipe') {
      let recipe: ExtractedRecipe;
      if (image) {
        recipe = await callClaude<ExtractedRecipe>(apiKey, RECIPE_SCHEMA, [
          { type: 'image', source: { type: 'base64', media_type: imageType ?? 'image/jpeg', data: image } },
          { type: 'text', text: RECIPE_PHOTO_PROMPT },
        ]);
      } else if (url) {
        const ctx = await fetchPageContext(url);
        recipe = await callClaude<ExtractedRecipe>(apiKey, RECIPE_SCHEMA, [
          { type: 'text', text: recipeUrlPrompt(ctx) },
        ]);
      } else {
        return json({ error: 'A recipe image or url is required.' }, 400);
      }
      return json({ recipe });
    }

    return json({ error: `Unknown kind: ${kind}` }, 400);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Extraction failed.';
    return json({ error: message }, 500);
  }
});
