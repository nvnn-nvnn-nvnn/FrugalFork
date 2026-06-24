# 00 — Overview & Product

## What SnackPlan is

A mobile app (iOS / Android / web via Expo) that helps **frugal students eat cheap,
good food on a weekly budget**. It has two complementary modes:

- **Decide** — a low-friction "what do I eat right now?" picker. Open it, get
  exactly 3 options, tap one. This is the daily, lightweight entry point.
- **Plan / Shop** — the core value: tell the app what you feel like this week, it
  generates a 7-day meal plan that fits your grocery budget, plus a curated
  shopping list, calorie estimates, and health notes.

## The pivot (important context)

The project started as a *decision-first* app (the original idea was that weekly
planning is a chore that kills meal-planning apps, so we'd win the daily "what do
I eat" moment first).

It was then **deliberately pivoted to budget-first weekly meal planning for
students**. The budget calculator + cheap, good food is now the wedge. The Decide
screen was kept as the lightweight daily entry, but Plan/Shop is the heart.

If you read older comments mentioning "decision-first, planning is risky," treat
that as historical — the current direction is budget-first planning.

## The four tabs

| Tab      | Screen                       | Purpose |
|----------|------------------------------|---------|
| Decide   | `src/app/(tabs)/index.tsx`   | Discover dishes (B/L/D) + Cookbook (save into ≤3 collections). Quick-add to today. |
| Plan     | `src/app/(tabs)/plan.tsx`    | Mon–Sun day editor: per-day B/L/D, budget, "I ate this" / prep / photo. |
| Shop     | `src/app/(tabs)/shop.tsx`    | Curated ingredient list (from chosen dishes), budget vs real spend, receipt OCR. |
| Settings | `src/app/(tabs)/settings.tsx`| User info: diets, budget, favorites, usual meals, staples. |

## Mental model

1. **Onboarding** captures favorites, usual meals, and weekly grocery budget (once).
2. **Plan** uses the budget to generate a week of cheap recipes around your cravings.
3. **Shop** aggregates that plan into one shopping list and tracks real spend
   (via the OCR receipt placeholder) against the budget.
4. **Decide** is the everyday "I'm hungry now" shortcut, separate from the plan.

See [02 — Architecture](./02-architecture.md) for how the data flows between these.
