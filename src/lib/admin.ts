/**
 * Admin mode. Curated ("premade") dishes are read-only for normal users — they
 * can only edit dishes they created/imported. Admin mode (you) unlocks editing
 * premade dishes in the app too, for previewing.
 *
 * Driven by an env flag so the shipped build is locked by default:
 *   • Regular users / production: leave `EXPO_PUBLIC_ADMIN` unset → IS_ADMIN false.
 *   • You: set `EXPO_PUBLIC_ADMIN=true` in your local `.env`.
 *
 * The durable way to fill premade dishes for ALL users is editing the data file
 * (`src/lib/plan/recipes.ts`) — see docs/10-editing-dishes.md. The in-app photo
 * an admin sets is per-device only; it does not ship to other users.
 */
export const IS_ADMIN = process.env.EXPO_PUBLIC_ADMIN === 'true';
