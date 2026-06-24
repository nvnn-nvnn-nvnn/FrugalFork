# SnackPlan — Developer Notes

These notes document everything built so far, broken down by major implementation,
so you can understand the tech stack and how the pieces fit together.

Read them in order if you're new to the codebase:

1. [00 — Overview & Product](./00-overview.md) — what the app is and the budget-first pivot
2. [01 — Tech Stack](./01-tech-stack.md) — every library, why it's here, how to run
3. [02 — Architecture](./02-architecture.md) — providers, persistence, the data flow
4. [03 — Decide (daily loop)](./03-decide.md) — the 3-option daily decision engine
5. [04 — Onboarding & Profile](./04-onboarding-profile.md) — first-launch questions + stored profile
6. [05 — Weekly Plan & Budget](./05-plan-budget.md) — the meal planner, recipes, budget calculator
7. [06 — Shopping & OCR](./06-shopping-ocr.md) — curated list, spend tracking, OCR placeholder
8. [07 — Settings](./07-staples.md) — user info: diets, budget, favorites, usuals, staples
9. [08 — Theming & UI](./08-theming-ui.md) — colors, components, spacing, splash, tabs
10. [09 — Known Gaps & Next Steps](./09-gaps-next-steps.md) — what's stubbed and what's next

## Folder map (quick reference)

```
SnackPlan/
├─ app.json                  Expo config (name, icons, splash, plugins)
├─ src/
│  ├─ app/                   Routes (expo-router, file-based)
│  │  ├─ _layout.tsx         Providers + onboarding gate + root Stack
│  │  ├─ (tabs)/             Tab group (so non-tab screens can push over tabs)
│  │  │  ├─ _layout.tsx      Renders the tab bar (AppTabs)
│  │  │  ├─ index.tsx        Decide — Discover (B/L/D) + Cookbook tabs; ♡ save, quick-add
│  │  │  ├─ plan.tsx         Plan — Mon–Sun day editor; per-day B/L/D + budget + actions
│  │  │  ├─ shop.tsx         Shop — shopping list (from builder) + spend + OCR
│  │  │  └─ settings.tsx     Settings — edit diets/budget/favorites/usuals/staples
│  │  └─ dish/[id].tsx       Dish detail (tabbed: cookware/ingredients/steps/reviews)
│  ├─ components/
│  │  ├─ themed-text.tsx     Text that respects light/dark theme
│  │  ├─ themed-view.tsx     View that respects light/dark theme
│  │  ├─ tag-input.tsx       Reusable "add chips to a list" control
│  │  ├─ animated-icon.tsx   Branded launch splash overlay
│  │  ├─ app-tabs.tsx        Bottom tab bar (native) + app-tabs.web.tsx (web)
│  │  ├─ cookbook/           cookbook-view (Cookbook tab) + save-sheet (♡ save)
│  │  ├─ plan/               budget-bar
│  │  └─ onboarding/         Onboarding flow
│  ├─ constants/theme.ts     Colors, fonts, spacing scale, brand accent
│  ├─ hooks/                 use-theme, use-color-scheme
│  └─ lib/
│     ├─ storage.ts          AsyncStorage JSON wrapper + storage keys
│     ├─ ocr.ts              OCR + camera PLACEHOLDER (receipts, meal photos)
│     ├─ cookbook/           context.tsx (saved-dish collections, max 3)
│     ├─ profile/            context.tsx (onboarding answers)
│     ├─ week/               dates.ts (date + weekday helpers)
│     └─ plan/               types, recipes, diets, dish-detail, planner, context
```
