export interface PassageSegment {
  startCh: number;
  startV: number;
  endCh: number;
  endV: number;
}

export interface PlanReading {
  id: string;
  track: 'family' | 'secret';
  slotLabel: string;
  label: string;
  book: string;
  slug: string;
  segments: PassageSegment[];
}

export interface PlanDay {
  day: number;
  mmdd: string;
  dateLabel: string;
  shortDate: string;
  readings: PlanReading[];
}

export interface BibleVersionMeta {
  id: string;
  shortName: string;
  fullName: string;
  year: string;
  styleNote: string;
  closestModernNote: string;
  isCustom?: boolean;
}

export interface BibleBookIndex {
  index: number;
  name: string;
  slug: string;
  testament: 'OT' | 'NT';
  chapterCount: number;
  verseCount: number;
}

export interface BibleBookData {
  name: string;
  slug: string;
  testament: 'OT' | 'NT';
  chapters: string[][];
}

export interface ExtractedChapter {
  chapterNumber: number;
  verses: Array<{
    verseNumber: number;
    text: string;
  }>;
}

export interface BibleSearchHit {
  book: string;
  slug: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface UserReadingState {
  completedIds: Record<string, string>;
  notes: Record<number, string>;
  highlights: Record<string, boolean>;
  scheduleMode: 'calendar' | 'custom';
  customStartDate: string;
  translation: string;
  compareTranslation: string | null;
  fontSize: 0 | 1 | 2 | 3;
  verseNumbers: boolean;
  paragraphMode: boolean;
  theme: 'light' | 'dark';
}

export interface EmbeddedPortableState {
  bundleId: string;
  exportedAt: string;
  state: UserReadingState;
}

declare global {
  interface Window {
    __DAILY_BREAD_PORTABLE__?: boolean;
    __DAILY_BREAD_EMBEDDED_STATE__?: EmbeddedPortableState;
    __DAILY_BREAD_EMBEDDED_VERSIONS__?: BibleVersionMeta[];
    __DAILY_BREAD_EMBEDDED_BIBLES__?: Record<string, Record<string, BibleBookData>>;
  }
}
