import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { StorageKeys, loadJSON, saveJSON } from '@/lib/storage';
import { isoDate, weekdayIndex, startOfWeek } from '@/lib/week/dates';
import { builderItemId, type BuilderItem, type CookedEntry } from './types';

/** Real spend logged per week (e.g. from receipt scans), keyed by Monday ISO. */
type SpendByWeek = Record<string, number>;

type PlanContextValue = {
  ready: boolean;
  /** ISO date of this week's Monday (used to key weekly spend). */
  weekStart: string;
  /** Real money spent this week so far. */
  spend: number;
  /** Add to this week's real spend (from a scanned receipt). */
  addSpend: (amount: number) => void;

  /** Which weekday the Plan screen is viewing (0=Sun..6=Sat). Held here so it survives tab switches. */
  selectedPlanDay: number;
  setSelectedPlanDay: (day: number) => void;

  // --- The meal builder: the app's single source of truth ----------------
  /** Dishes the user picked, newest first. Each is tied to a weekday + servings. */
  builder: BuilderItem[];
  /** Collect a dish for a weekday (0=Sun..6=Sat) at a serving count (default 1). */
  addToBuilder: (recipeId: string, day: number, servings?: number) => void;
  /** Drop a dish by its id. */
  removeItem: (id: string) => void;
  /** Change a planned meal's serving count (clamped 1–4). */
  setServings: (id: string, servings: number) => void;
  /** Empty the builder. */
  clearBuilder: () => void;
  /** Toggle the "I ate this" flag. */
  toggleEaten: (id: string) => void;
  /** Toggle the meal-prepped flag. */
  togglePrepped: (id: string) => void;
  /** Attach (or clear) a meal photo. */
  setPhoto: (id: string, photo: string | null) => void;

  // --- Groceries: which PLANNED dishes are on the shopping list ------------
  // A dish can only be on the list if it's currently in the plan; servings are
  // derived from the plan (Shop reads them), so the list always stays in sync.
  /** Recipe ids flagged for shopping. */
  groceries: string[];
  /** True if `recipeId` is flagged for shopping. */
  isInGroceries: (recipeId: string) => boolean;
  /** Add/remove a dish on the shopping list. */
  toggleGrocery: (recipeId: string) => void;
  /** Flag several dishes for shopping at once. */
  addGroceries: (recipeIds: string[]) => void;

  // --- Shopping list: which ingredients are crossed off -------------------
  /** True if the ingredient `name` is crossed off the shopping list. */
  isChecked: (name: string) => boolean;
  /** Toggle an ingredient's crossed-off state. */
  toggleChecked: (name: string) => void;
  /** Cross off every given ingredient name. */
  markAllChecked: (names: string[]) => void;

  // --- Finished-dishes log -------------------------------------------------
  /** History of cooked dishes, newest first. */
  cookedLog: CookedEntry[];
  /** Record that a dish was cooked/eaten. */
  logCooked: (recipeId: string, servings: number) => void;
};

const PlanContext = createContext<PlanContextValue | null>(null);

/**
 * Backfill `day` and re-key items by `${recipeId}:${day}` (dropping the old
 * per-slot dimension), de-duping any that now collide on the same day.
 * `dayShift` converts the stored weekday index (used once for the v1→v2
 * Monday→Sunday move; 0 otherwise).
 */
function migrate(items: BuilderItem[], dayShift = 0): BuilderItem[] {
  const today = weekdayIndex();
  const seen = new Set<string>();
  const out: BuilderItem[] = [];
  for (const it of items) {
    const stored = typeof it.day === 'number' ? it.day : today;
    const day = (stored + dayShift + 7) % 7;
    const id = builderItemId(it.recipeId, day);
    if (seen.has(id)) continue;
    seen.add(id);
    const { slot: _slot, ...rest } = it as BuilderItem & { slot?: unknown };
    const servings = typeof it.servings === 'number' ? it.servings : 1;
    out.push({ ...rest, day, id, servings });
  }
  return out;
}

const clampServings = (n: number) => Math.max(1, Math.min(4, Math.round(n)));

/** Groceries are now a recipe-id list; tolerate older shapes (string[] or {recipeId,servings}[]). */
function normalizeGroceries(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((g) => (typeof g === 'string' ? g : (g as { recipeId?: string })?.recipeId))
    .filter((id): id is string => typeof id === 'string');
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [builder, setBuilder] = useState<BuilderItem[]>([]);
  const [spendByWeek, setSpendByWeek] = useState<SpendByWeek>({});
  const [groceries, setGroceries] = useState<string[]>([]);
  const [checked, setChecked] = useState<string[]>([]);
  const [cookedLog, setCookedLog] = useState<CookedEntry[]>([]);
  const [selectedPlanDay, setSelectedPlanDay] = useState(0); // 0 = Sunday
  const [ready, setReady] = useState(false);

  const weekStart = useMemo(() => isoDate(startOfWeek(new Date())), []);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadJSON<BuilderItem[] | null>(StorageKeys.builder, null),
      loadJSON<BuilderItem[]>(StorageKeys.builderLegacy, []),
      loadJSON<SpendByWeek>(StorageKeys.spend, {}),
      loadJSON<unknown>(StorageKeys.groceries, []),
      loadJSON<string[]>(StorageKeys.shopChecked, []),
      loadJSON<CookedEntry[]>(StorageKeys.cookedLog, []),
    ]).then(([v2, v1, loadedSpend, loadedGroceries, loadedChecked, loadedLog]) => {
      if (!active) return;
      let next: BuilderItem[];
      if (v2 !== null) {
        next = migrate(v2); // already Sunday-first
      } else {
        // One-time: shift legacy Monday-first days (0=Mon) to Sunday-first (0=Sun).
        next = migrate(v1, 1);
        saveJSON(StorageKeys.builder, next);
      }
      setBuilder(next);
      setSpendByWeek(loadedSpend);
      setGroceries(normalizeGroceries(loadedGroceries));
      setChecked(loadedChecked);
      setCookedLog(loadedLog);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((next: BuilderItem[]) => {
    setBuilder(next);
    saveJSON(StorageKeys.builder, next);
  }, []);

  const mutateById = useCallback(
    (id: string, change: (item: BuilderItem) => BuilderItem) =>
      setBuilder((prev) => {
        const next = prev.map((it) => (it.id === id ? change(it) : it));
        saveJSON(StorageKeys.builder, next);
        return next;
      }),
    [],
  );

  const addToBuilder = useCallback((recipeId: string, day: number, servings = 1) => {
    setBuilder((prev) => {
      const id = builderItemId(recipeId, day);
      if (prev.some((b) => b.id === id)) return prev; // same dish on the same day already there
      const next: BuilderItem[] = [
        {
          id,
          recipeId,
          day,
          servings: clampServings(servings),
          addedAt: Date.now(),
          eaten: false,
          prepped: false,
          photo: null,
        },
        ...prev,
      ];
      saveJSON(StorageKeys.builder, next);
      return next;
    });
  }, []);

  const setServings = useCallback(
    (id: string, servings: number) =>
      mutateById(id, (it) => ({ ...it, servings: clampServings(servings) })),
    [mutateById],
  );

  const removeItem = useCallback(
    (id: string) => {
      const removed = builder.find((b) => b.id === id);
      const next = builder.filter((b) => b.id !== id);
      persist(next);
      // If that dish is no longer planned anywhere, drop it from the shopping list too.
      if (removed && !next.some((b) => b.recipeId === removed.recipeId)) {
        setGroceries((g) => {
          const ng = g.filter((id) => id !== removed.recipeId);
          if (ng.length === g.length) return g;
          saveJSON(StorageKeys.groceries, ng);
          return ng;
        });
      }
    },
    [builder, persist],
  );

  const clearBuilder = useCallback(() => persist([]), [persist]);

  const toggleEaten = useCallback(
    (id: string) => mutateById(id, (it) => ({ ...it, eaten: !it.eaten })),
    [mutateById],
  );

  const togglePrepped = useCallback(
    (id: string) => mutateById(id, (it) => ({ ...it, prepped: !it.prepped })),
    [mutateById],
  );

  const setPhoto = useCallback(
    (id: string, photo: string | null) => mutateById(id, (it) => ({ ...it, photo })),
    [mutateById],
  );

  const isInGroceries = useCallback((recipeId: string) => groceries.includes(recipeId), [groceries]);

  const toggleGrocery = useCallback((recipeId: string) => {
    setGroceries((prev) => {
      const next = prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId];
      saveJSON(StorageKeys.groceries, next);
      return next;
    });
  }, []);

  const addGroceries = useCallback((recipeIds: string[]) => {
    setGroceries((prev) => {
      const next = Array.from(new Set([...prev, ...recipeIds]));
      saveJSON(StorageKeys.groceries, next);
      return next;
    });
  }, []);

  const isChecked = useCallback((name: string) => checked.includes(name), [checked]);

  const toggleChecked = useCallback((name: string) => {
    setChecked((prev) => {
      const next = prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name];
      saveJSON(StorageKeys.shopChecked, next);
      return next;
    });
  }, []);

  const markAllChecked = useCallback((names: string[]) => {
    setChecked((prev) => {
      const next = Array.from(new Set([...prev, ...names]));
      saveJSON(StorageKeys.shopChecked, next);
      return next;
    });
  }, []);

  const logCooked = useCallback((recipeId: string, servings: number) => {
    setCookedLog((prev) => {
      const next = [{ recipeId, at: Date.now(), servings }, ...prev];
      saveJSON(StorageKeys.cookedLog, next);
      return next;
    });
  }, []);

  const addSpend = useCallback(
    (amount: number) =>
      setSpendByWeek((prev) => {
        const next = {
          ...prev,
          [weekStart]: Math.round(((prev[weekStart] ?? 0) + amount) * 100) / 100,
        };
        saveJSON(StorageKeys.spend, next);
        return next;
      }),
    [weekStart],
  );

  const value = useMemo<PlanContextValue>(
    () => ({
      ready,
      weekStart,
      spend: spendByWeek[weekStart] ?? 0,
      addSpend,
      selectedPlanDay,
      setSelectedPlanDay,
      builder,
      addToBuilder,
      removeItem,
      setServings,
      clearBuilder,
      toggleEaten,
      togglePrepped,
      setPhoto,
      groceries,
      isInGroceries,
      toggleGrocery,
      addGroceries,
      isChecked,
      toggleChecked,
      markAllChecked,
      cookedLog,
      logCooked,
    }),
    [ready, weekStart, spendByWeek, addSpend, selectedPlanDay, builder, addToBuilder, removeItem, setServings, clearBuilder, toggleEaten, togglePrepped, setPhoto, groceries, isInGroceries, toggleGrocery, addGroceries, isChecked, toggleChecked, markAllChecked, cookedLog, logCooked],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within a PlanProvider');
  return ctx;
}
