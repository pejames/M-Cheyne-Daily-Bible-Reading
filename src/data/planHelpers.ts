import rawPlan from './mcheynePlan.json';
import type {PlanDay, PlanReading} from '../types/bible';

export const MCHEYNE_PLAN: PlanDay[] = rawPlan as PlanDay[];

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export type MCheyneTrackKey = 'family-1' | 'family-2' | 'secret-1' | 'secret-2';

export interface BookPlanPortion {
  reading: PlanReading;
  day: number;
  dateLabel: string;
  shortDate: string;
}

export interface MCheyneTrackBook {
  key: string;
  trackKey: MCheyneTrackKey;
  trackGroup: 'Family' | 'Secret';
  trackLabel: string;
  orderInTrack: number;
  book: string;
  slug: string;
  startDay: number;
  endDay: number;
  portions: BookPlanPortion[];
}

export interface MCheyneTrackGroup {
  trackKey: MCheyneTrackKey;
  trackGroup: 'Family' | 'Secret';
  title: string;
  shortTitle: string;
  subtitle: string;
  books: MCheyneTrackBook[];
}

export interface MCheyneOrderedBook extends MCheyneTrackBook {
  globalOrder: number;
  cycleNumber: number;
}

const TRACK_META: Array<{
  trackKey: MCheyneTrackKey;
  trackGroup: 'Family' | 'Secret';
  readingIndex: 0 | 1 | 2 | 3;
  title: string;
  shortTitle: string;
  subtitle: string;
}> = [
  {
    trackKey: 'family-1',
    trackGroup: 'Family',
    readingIndex: 0,
    title: 'Family · Genesis to 2 Chronicles',
    shortTitle: 'Family: Genesis',
    subtitle: 'Old Testament History (14 books)',
  },
  {
    trackKey: 'family-2',
    trackGroup: 'Family',
    readingIndex: 1,
    title: 'Family · Matthew to Revelation',
    shortTitle: 'Family: Matthew',
    subtitle: 'Gospels, Psalms & Epistles (28 books)',
  },
  {
    trackKey: 'secret-1',
    trackGroup: 'Secret',
    readingIndex: 2,
    title: 'Secret · Ezra to Malachi',
    shortTitle: 'Secret: Ezra',
    subtitle: 'Post-Exilic, Wisdom & Prophets (24 books)',
  },
  {
    trackKey: 'secret-2',
    trackGroup: 'Secret',
    readingIndex: 3,
    title: 'Secret · Acts to John',
    shortTitle: 'Secret: Acts',
    subtitle: 'Acts, Epistles, Psalms & Gospels (28 books)',
  },
];

let cachedTrackGroups: MCheyneTrackGroup[] | null = null;
let cachedOrderedBooks: MCheyneOrderedBook[] | null = null;

export function getMCheyneTrackBooks(): MCheyneTrackGroup[] {
  if (cachedTrackGroups) return cachedTrackGroups;

  cachedTrackGroups = TRACK_META.map((meta) => {
    const books: MCheyneTrackBook[] = [];

    for (const dayObj of MCHEYNE_PLAN) {
      const r = dayObj.readings[meta.readingIndex];
      if (!r) continue;

      const lastBook = books[books.length - 1];
      if (!lastBook || lastBook.book !== r.book) {
        const orderInTrack = books.length + 1;
        books.push({
          key: `${meta.trackKey}:${r.slug}`,
          trackKey: meta.trackKey,
          trackGroup: meta.trackGroup,
          trackLabel: meta.title,
          orderInTrack,
          book: r.book,
          slug: r.slug,
          startDay: dayObj.day,
          endDay: dayObj.day,
          portions: [
            {
              reading: r,
              day: dayObj.day,
              dateLabel: dayObj.dateLabel,
              shortDate: dayObj.shortDate,
            },
          ],
        });
      } else {
        lastBook.endDay = dayObj.day;
        lastBook.portions.push({
          reading: r,
          day: dayObj.day,
          dateLabel: dayObj.dateLabel,
          shortDate: dayObj.shortDate,
        });
      }
    }

    return {
      trackKey: meta.trackKey,
      trackGroup: meta.trackGroup,
      title: meta.title,
      shortTitle: meta.shortTitle,
      subtitle: meta.subtitle,
      books,
    };
  });

  return cachedTrackGroups;
}

export function getMCheyneOrderedBooks(): MCheyneOrderedBook[] {
  if (cachedOrderedBooks) return cachedOrderedBooks;

  const groups = getMCheyneTrackBooks();
  const maxBooksInTrack = Math.max(...groups.map((g) => g.books.length));
  const ordered: MCheyneOrderedBook[] = [];

  for (let cycleIdx = 0; cycleIdx < maxBooksInTrack; cycleIdx++) {
    for (const group of groups) {
      const bookItem = group.books[cycleIdx];
      if (bookItem) {
        ordered.push({
          ...bookItem,
          globalOrder: ordered.length + 1,
          cycleNumber: cycleIdx + 1,
        });
      }
    }
  }

  cachedOrderedBooks = ordered;
  return cachedOrderedBooks;
}

export function getDayByNumber(dayNumber: number): PlanDay {
  const clamped = Math.max(1, Math.min(365, dayNumber));
  return MCHEYNE_PLAN[clamped - 1];
}

export function getCalendarDayNumber(date: Date = new Date()): number {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const mmdd = m === '02' && d === '29' ? '0228' : `${m}${d}`;
  const found = MCHEYNE_PLAN.find((item) => item.mmdd === mmdd);
  return found ? found.day : 1;
}

export function getCustomDayNumber(startDateStr: string, now: Date = new Date()): number {
  const parts = startDateStr.split('-').map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return getCalendarDayNumber(now);
  }
  const start = new Date(parts[0], parts[1] - 1, parts[2]);
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((todayMidnight.getTime() - start.getTime()) / 86400000);
  if (diffDays < 0) return 1;
  return (diffDays % 365) + 1;
}

export function formatLocalDateInput(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
