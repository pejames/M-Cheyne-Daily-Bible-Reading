import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  MCHEYNE_PLAN,
  formatLocalDateInput,
  getCalendarDayNumber,
  getCustomDayNumber,
} from '../data/planHelpers';
import type {UserReadingState} from '../types/bible';

const STORAGE_KEY = 'daily-bread-mcheyne-state-v1';

const DEFAULT_STATE: UserReadingState = {
  completedIds: {},
  notes: {},
  highlights: {},
  scheduleMode: 'calendar',
  customStartDate: formatLocalDateInput(),
  translation: 'bsb',
  compareTranslation: null,
  fontSize: 1,
  verseNumbers: true,
  paragraphMode: false,
  theme: 'light',
};

const BUNDLE_APPLIED_KEY = 'daily-bread-embedded-bundle-id';

function loadInitialState(): UserReadingState {
  const embedded =
    typeof window !== 'undefined' ? window.__DAILY_BREAD_EMBEDDED_STATE__ : undefined;

  let localState: Partial<UserReadingState> | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      localState = JSON.parse(raw) as Partial<UserReadingState>;
    }
  } catch {
    localState = null;
  }

  if (embedded?.state) {
    let alreadyApplied = false;
    try {
      alreadyApplied = localStorage.getItem(BUNDLE_APPLIED_KEY) === embedded.bundleId;
    } catch {
      alreadyApplied = false;
    }

    if (!localState || !alreadyApplied) {
      const merged: UserReadingState = {
        ...DEFAULT_STATE,
        ...embedded.state,
        ...localState,
        completedIds: {
          ...(embedded.state.completedIds ?? {}),
          ...(localState?.completedIds ?? {}),
        },
        notes: {
          ...(localState?.notes ?? {}),
          ...(embedded.state.notes ?? {}),
        },
        highlights: {
          ...(embedded.state.highlights ?? {}),
          ...(localState?.highlights ?? {}),
        },
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        localStorage.setItem(BUNDLE_APPLIED_KEY, embedded.bundleId);
      } catch {
        // Ignore if file:// localStorage is restricted
      }
      return merged;
    }
  }

  if (localState) {
    return {
      ...DEFAULT_STATE,
      ...localState,
      completedIds: localState.completedIds ?? {},
      notes: localState.notes ?? {},
      highlights: localState.highlights ?? {},
    };
  }

  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return {...DEFAULT_STATE, theme: prefersDark ? 'dark' : 'light'};
}

export function useReadingStore() {
  const [state, setState] = useState<UserReadingState>(loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota failures
    }
  }, [state]);

  useEffect(() => {
    const isDark = state.theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#141210' : '#1E3A5F');
    }
  }, [state.theme]);

  const todayDayNumber = useMemo(() => {
    if (state.scheduleMode === 'custom') {
      return getCustomDayNumber(state.customStartDate);
    }
    return getCalendarDayNumber();
  }, [state.scheduleMode, state.customStartDate]);

  const toggleReading = useCallback((readingId: string) => {
    setState((prev) => {
      const next = {...prev.completedIds};
      if (next[readingId]) {
        delete next[readingId];
      } else {
        next[readingId] = new Date().toISOString();
      }
      return {...prev, completedIds: next};
    });
  }, []);

  const markReadingComplete = useCallback((readingId: string) => {
    setState((prev) => {
      if (prev.completedIds[readingId]) return prev;
      return {
        ...prev,
        completedIds: {
          ...prev.completedIds,
          [readingId]: new Date().toISOString(),
        },
      };
    });
  }, []);

  const toggleDayAll = useCallback((dayNumber: number) => {
    const dayObj = MCHEYNE_PLAN[dayNumber - 1];
    if (!dayObj) return;
    setState((prev) => {
      const allDone = dayObj.readings.every((r) => !!prev.completedIds[r.id]);
      const next = {...prev.completedIds};
      const now = new Date().toISOString();
      for (const r of dayObj.readings) {
        if (allDone) {
          delete next[r.id];
        } else {
          next[r.id] = next[r.id] || now;
        }
      }
      return {...prev, completedIds: next};
    });
  }, []);

  const toggleManyReadings = useCallback((readingIds: string[], markComplete: boolean) => {
    setState((prev) => {
      const next = {...prev.completedIds};
      const now = new Date().toISOString();
      for (const id of readingIds) {
        if (markComplete) {
          next[id] = next[id] || now;
        } else {
          delete next[id];
        }
      }
      return {...prev, completedIds: next};
    });
  }, []);

  const setDayNote = useCallback((dayNumber: number, note: string) => {
    setState((prev) => {
      const nextNotes = {...prev.notes};
      if (!note.trim()) {
        delete nextNotes[dayNumber];
      } else {
        nextNotes[dayNumber] = note;
      }
      return {...prev, notes: nextNotes};
    });
  }, []);

  const toggleVerseHighlight = useCallback((slug: string, chapter: number, verse: number) => {
    const key = `${slug}:${chapter}:${verse}`;
    setState((prev) => {
      const next = {...prev.highlights};
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return {...prev, highlights: next};
    });
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setState((prev) => ({...prev, theme}));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({...prev, theme: prev.theme === 'dark' ? 'light' : 'dark'}));
  }, []);

  const setFontSize = useCallback((fontSize: 0 | 1 | 2 | 3) => {
    setState((prev) => ({...prev, fontSize}));
  }, []);

  const toggleVerseNumbers = useCallback(() => {
    setState((prev) => ({...prev, verseNumbers: !prev.verseNumbers}));
  }, []);

  const toggleParagraphMode = useCallback(() => {
    setState((prev) => ({...prev, paragraphMode: !prev.paragraphMode}));
  }, []);

  const setScheduleMode = useCallback((scheduleMode: 'calendar' | 'custom') => {
    setState((prev) => ({...prev, scheduleMode}));
  }, []);

  const setCustomStartDate = useCallback((customStartDate: string) => {
    setState((prev) => ({...prev, customStartDate}));
  }, []);

  const setTranslation = useCallback((translation: string) => {
    setState((prev) => ({...prev, translation}));
  }, []);

  const setCompareTranslation = useCallback((compareTranslation: string | null) => {
    setState((prev) => ({...prev, compareTranslation}));
  }, []);

  const resetProgress = useCallback(() => {
    setState((prev) => ({
      ...prev,
      completedIds: {},
      notes: {},
      highlights: {},
    }));
  }, []);

  const exportBackupJson = useCallback(() => {
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        state,
      },
      null,
      2
    );
  }, [state]);

  const importBackupJson = useCallback((jsonText: string): boolean => {
    try {
      const parsed = JSON.parse(jsonText) as {state?: Partial<UserReadingState>};
      const incoming = parsed.state ?? (parsed as unknown as Partial<UserReadingState>);
      if (!incoming || typeof incoming !== 'object') return false;
      setState((prev) => ({
        ...prev,
        completedIds: incoming.completedIds ?? prev.completedIds,
        notes: incoming.notes ?? prev.notes,
        highlights: incoming.highlights ?? prev.highlights,
        scheduleMode: incoming.scheduleMode ?? prev.scheduleMode,
        customStartDate: incoming.customStartDate ?? prev.customStartDate,
      }));
      return true;
    } catch {
      return false;
    }
  }, []);

  const stats = useMemo(() => {
    let completedReadings = 0;
    let completedDays = 0;
    let familyCompleted = 0;
    let secretCompleted = 0;

    for (const dayObj of MCHEYNE_PLAN) {
      let dayDoneCount = 0;
      for (const r of dayObj.readings) {
        if (state.completedIds[r.id]) {
          completedReadings++;
          dayDoneCount++;
          if (r.track === 'family') familyCompleted++;
          else secretCompleted++;
        }
      }
      if (dayDoneCount === dayObj.readings.length) {
        completedDays++;
      }
    }

    // Streak backwards from todayDayNumber (or yesterday if today isn't completed yet)
    const isDayComplete = (dayNum: number) => {
      const d = MCHEYNE_PLAN[dayNum - 1];
      return d ? d.readings.every((r) => !!state.completedIds[r.id]) : false;
    };

    let streak = 0;
    let cursor = todayDayNumber;
    if (!isDayComplete(cursor) && cursor > 1) {
      cursor -= 1;
    }
    while (cursor >= 1 && isDayComplete(cursor)) {
      streak++;
      cursor--;
    }

    return {
      completedReadings,
      totalReadings: 1460,
      completedDays,
      totalDays: 365,
      familyCompleted,
      secretCompleted,
      streak,
      percentYear: Math.round((completedReadings / 1460) * 100),
    };
  }, [state.completedIds, todayDayNumber]);

  return {
    state,
    todayDayNumber,
    stats,
    toggleReading,
    markReadingComplete,
    toggleDayAll,
    toggleManyReadings,
    setDayNote,
    toggleVerseHighlight,
    setTheme,
    toggleTheme,
    setFontSize,
    toggleVerseNumbers,
    toggleParagraphMode,
    setScheduleMode,
    setCustomStartDate,
    setTranslation,
    setCompareTranslation,
    resetProgress,
    exportBackupJson,
    importBackupJson,
  };
}
