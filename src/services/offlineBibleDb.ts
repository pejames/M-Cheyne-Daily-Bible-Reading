import type {
  BibleBookData,
  BibleBookIndex,
  BibleSearchHit,
  BibleVersionMeta,
  ExtractedChapter,
  PassageSegment,
} from '../types/bible';

const DB_NAME = 'daily-bread-mcheyne-db';
const DB_VERSION = 2;
const BOOK_STORE = 'books';
const META_STORE = 'meta';
const CUSTOM_VERSION_STORE = 'customVersions';

export const BUILT_IN_VERSIONS: BibleVersionMeta[] = [
  {
    id: 'kjv',
    shortName: 'KJV',
    fullName: 'King James Version',
    year: '1769',
    styleNote: 'Classic formal heritage prose · Public Domain',
    closestModernNote: 'Traditional English cadence',
  },
  {
    id: 'bsb',
    shortName: 'BSB',
    fullName: 'Berean Standard Bible',
    year: '2023',
    styleNote: 'Modern literary-literal translation · Public Domain (CC0)',
    closestModernNote: 'Closest public-domain style to ESV / NIV',
  },
  {
    id: 'ukjv',
    shortName: 'UKJV',
    fullName: 'Updated King James Version',
    year: '2000',
    styleNote: 'KJV updated to modern pronouns & verbs · Public Domain',
    closestModernNote: 'Closest public-domain style to NKJV',
  },
  {
    id: 'asv',
    shortName: 'ASV',
    fullName: 'American Standard Version',
    year: '1901',
    styleNote: 'Formal word-for-word translation · Public Domain',
    closestModernNote: 'Direct historical predecessor to NASB 1995',
  },
  {
    id: 'nheb',
    shortName: 'NHEB',
    fullName: 'New Heart English Bible',
    year: '2010',
    styleNote: 'Clear contemporary modern English · Public Domain',
    closestModernNote: 'Clean everyday readability',
  },
];

interface StoredBookRecord extends BibleBookData {
  cacheKey: string;
  versionId: string;
}

const memoryBookCache = new Map<string, BibleBookData>();
const memoryIndexCache = new Map<string, BibleBookIndex[]>();
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        // Recreate books store on v1->v2 upgrade to key by `${versionId}:${slug}`
        if (db.objectStoreNames.contains(BOOK_STORE)) {
          db.deleteObjectStore(BOOK_STORE);
        }
        db.createObjectStore(BOOK_STORE, {keyPath: 'cacheKey'});
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, {keyPath: 'key'});
        }
        if (!db.objectStoreNames.contains(CUSTOM_VERSION_STORE)) {
          db.createObjectStore(CUSTOM_VERSION_STORE, {keyPath: 'id'});
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function idbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  try {
    const db = await openDb();
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

async function idbGetAll<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openDb();
    return await new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve((req.result as T[]) || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

async function idbPut(storeName: string, value: unknown): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Graceful degradation
  }
}

async function idbDelete(storeName: string, key: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

export async function getAvailableVersions(): Promise<BibleVersionMeta[]> {
  if (typeof window !== 'undefined' && window.__DAILY_BREAD_EMBEDDED_VERSIONS__?.length) {
    return window.__DAILY_BREAD_EMBEDDED_VERSIONS__;
  }
  const custom = await idbGetAll<BibleVersionMeta>(CUSTOM_VERSION_STORE);
  return [...BUILT_IN_VERSIONS, ...custom];
}

export async function getBookIndex(versionId: string = 'kjv'): Promise<BibleBookIndex[]> {
  const mem = memoryIndexCache.get(versionId);
  if (mem) return mem;

  const embeddedBooks =
    typeof window !== 'undefined' ? window.__DAILY_BREAD_EMBEDDED_BIBLES__?.[versionId] : undefined;
  if (embeddedBooks) {
    const derived: BibleBookIndex[] = Object.values(embeddedBooks).map((b, i) => ({
      index: i + 1,
      name: b.name,
      slug: b.slug,
      testament: b.testament,
      chapterCount: b.chapters.length,
      verseCount: b.chapters.reduce((acc, c) => acc + c.length, 0),
    }));
    memoryIndexCache.set(versionId, derived);
    return derived;
  }

  const metaKey = `book-index:${versionId}`;
  const cached = await idbGet<{key: string; data: BibleBookIndex[]}>(META_STORE, metaKey);
  if (cached?.data?.length) {
    memoryIndexCache.set(versionId, cached.data);
    return cached.data;
  }

  // Fallback to kjv index for custom or remote versions if same 66-book structure
  const fetchVersion = BUILT_IN_VERSIONS.some((v) => v.id === versionId) ? versionId : 'kjv';
  const res = await fetch(`/bible/${fetchVersion}/index.json`);
  if (!res.ok) {
    throw new Error(`Failed to load Bible index for ${versionId}`);
  }
  const data = (await res.json()) as BibleBookIndex[];
  memoryIndexCache.set(versionId, data);
  await idbPut(META_STORE, {key: metaKey, data});
  return data;
}

export async function getBibleBook(
  slug: string,
  versionId: string = 'kjv'
): Promise<BibleBookData> {
  const cacheKey = `${versionId}:${slug}`;
  const mem = memoryBookCache.get(cacheKey);
  if (mem) return mem;

  const embedded =
    typeof window !== 'undefined'
      ? window.__DAILY_BREAD_EMBEDDED_BIBLES__?.[versionId]?.[slug]
      : undefined;
  if (embedded) {
    memoryBookCache.set(cacheKey, embedded);
    return embedded;
  }

  const stored = await idbGet<StoredBookRecord>(BOOK_STORE, cacheKey);
  if (stored && stored.chapters?.length) {
    memoryBookCache.set(cacheKey, stored);
    return stored;
  }

  const isBuiltIn = BUILT_IN_VERSIONS.some((v) => v.id === versionId);
  if (!isBuiltIn) {
    throw new Error(`Book "${slug}" is not present in this custom translation.`);
  }

  const res = await fetch(`/bible/${versionId}/${slug}.json`);
  if (!res.ok) {
    throw new Error(`Book "${slug}" (${versionId.toUpperCase()}) is not yet cached for offline reading.`);
  }
  const data = (await res.json()) as BibleBookData;
  memoryBookCache.set(cacheKey, data);
  await idbPut(BOOK_STORE, {...data, cacheKey, versionId});
  return data;
}

export async function getCachedBookSlugs(versionId: string = 'kjv'): Promise<Set<string>> {
  const embedded =
    typeof window !== 'undefined' ? window.__DAILY_BREAD_EMBEDDED_BIBLES__?.[versionId] : undefined;
  if (embedded) {
    return new Set(Object.keys(embedded));
  }

  try {
    const db = await openDb();
    return await new Promise<Set<string>>((resolve, reject) => {
      const tx = db.transaction(BOOK_STORE, 'readonly');
      const req = tx.objectStore(BOOK_STORE).getAllKeys();
      req.onsuccess = () => {
        const prefix = `${versionId}:`;
        const keys = ((req.result as string[]) || [])
          .filter((k) => k.startsWith(prefix))
          .map((k) => k.slice(prefix.length));
        resolve(new Set(keys));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    const prefix = `${versionId}:`;
    return new Set(
      [...memoryBookCache.keys()]
        .filter((k) => k.startsWith(prefix))
        .map((k) => k.slice(prefix.length))
    );
  }
}

export async function getAllVersionCacheCounts(): Promise<Record<string, number>> {
  if (typeof window !== 'undefined' && window.__DAILY_BREAD_EMBEDDED_BIBLES__) {
    const counts: Record<string, number> = {};
    for (const [vId, books] of Object.entries(window.__DAILY_BREAD_EMBEDDED_BIBLES__)) {
      counts[vId] = Object.keys(books).length;
    }
    return counts;
  }

  try {
    const db = await openDb();
    return await new Promise<Record<string, number>>((resolve, reject) => {
      const tx = db.transaction(BOOK_STORE, 'readonly');
      const req = tx.objectStore(BOOK_STORE).getAllKeys();
      req.onsuccess = () => {
        const counts: Record<string, number> = {};
        for (const rawKey of (req.result as string[]) || []) {
          const idx = rawKey.indexOf(':');
          if (idx > 0) {
            const vId = rawKey.slice(0, idx);
            counts[vId] = (counts[vId] || 0) + 1;
          }
        }
        resolve(counts);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return {};
  }
}

export async function cacheAllBooks(
  versionId: string = 'kjv',
  onProgress?: (loaded: number, total: number, currentBook: string) => void
): Promise<number> {
  const index = await getBookIndex(versionId);
  const cached = await getCachedBookSlugs(versionId);
  let completed = cached.size;
  const total = index.length;
  onProgress?.(completed, total, '');

  const missing = index.filter((b) => !cached.has(b.slug));
  const concurrency = 4;
  let cursor = 0;

  async function worker() {
    while (cursor < missing.length) {
      const item = missing[cursor++];
      await getBibleBook(item.slug, versionId);
      completed++;
      onProgress?.(completed, total, item.name);
    }
  }

  await Promise.all(Array.from({length: Math.min(concurrency, missing.length)}, worker));
  return completed;
}

export async function clearOfflineBookCache(versionId?: string): Promise<void> {
  if (!versionId) {
    memoryBookCache.clear();
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(BOOK_STORE, 'readwrite');
        tx.objectStore(BOOK_STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // ignore
    }
    return;
  }

  const prefix = `${versionId}:`;
  for (const k of [...memoryBookCache.keys()]) {
    if (k.startsWith(prefix)) memoryBookCache.delete(k);
  }

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(BOOK_STORE, 'readwrite');
      const store = tx.objectStore(BOOK_STORE);
      const req = store.getAllKeys();
      req.onsuccess = () => {
        for (const k of (req.result as string[]) || []) {
          if (k.startsWith(prefix)) store.delete(k);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

const BOOK_ALIASES: Record<string, string> = {
  'I Samuel': '1 Samuel',
  'II Samuel': '2 Samuel',
  'I Kings': '1 Kings',
  'II Kings': '2 Kings',
  'I Chronicles': '1 Chronicles',
  'II Chronicles': '2 Chronicles',
  'I Corinthians': '1 Corinthians',
  'II Corinthians': '2 Corinthians',
  'I Thessalonians': '1 Thessalonians',
  'II Thessalonians': '2 Thessalonians',
  'I Timothy': '1 Timothy',
  'II Timothy': '2 Timothy',
  'I Peter': '1 Peter',
  'II Peter': '2 Peter',
  'I John': '1 John',
  'II John': '2 John',
  'III John': '3 John',
  'Revelation of John': 'Revelation',
  'Song of Songs': 'Song of Solomon',
  Psalm: 'Psalms',
};

const slugify = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

/**
 * Allows users to import a personal local Bible JSON file (scrollmapper `{ translation, books }`
 * format or thiagobodruk `[{ name, chapters }]` format) straight into browser IndexedDB.
 */
export async function importCustomTranslationJson(
  shortLabel: string,
  fullName: string,
  jsonText: string
): Promise<BibleVersionMeta> {
  const cleanText = jsonText.replace(/^\uFEFF/, '');
  const parsed = JSON.parse(cleanText) as unknown;

  const cleanShort = shortLabel.trim().toUpperCase().slice(0, 12) || 'CUSTOM';
  const id = `custom-${cleanShort.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

  let normalizedBooks: BibleBookData[] = [];

  if (Array.isArray(parsed)) {
    // Format A: [{ name, chapters: string[][] }]
    normalizedBooks = parsed.map((b: {name?: string; chapters?: string[][]}, i: number) => {
      const rawName = String(b.name || `Book ${i + 1}`);
      const name = BOOK_ALIASES[rawName] || rawName;
      return {
        name,
        slug: slugify(name),
        testament: i < 39 ? 'OT' : 'NT',
        chapters: Array.isArray(b.chapters) ? b.chapters : [],
      };
    });
  } else if (
    parsed &&
    typeof parsed === 'object' &&
    Array.isArray((parsed as {books?: unknown[]}).books)
  ) {
    // Format B: { translation, books: [{ name, chapters: [{ chapter, verses: [{ verse, text }] }] }] }
    const obj = parsed as {
      books: Array<{
        name: string;
        chapters: Array<{verses: Array<{text?: string}>} | string[]>;
      }>;
    };
    normalizedBooks = obj.books.map((b, i) => {
      const rawName = String(b.name || `Book ${i + 1}`);
      const name = BOOK_ALIASES[rawName] || rawName;
      const chapters = b.chapters.map((ch) =>
        Array.isArray(ch) ? ch : (ch.verses || []).map((v) => String(v.text || '').trim())
      );
      return {
        name,
        slug: slugify(name),
        testament: i < 39 ? 'OT' : 'NT',
        chapters,
      };
    });
  } else {
    throw new Error(
      'Unrecognized Bible JSON structure. Expected an array of books or { books: [...] }.'
    );
  }

  if (normalizedBooks.length === 0) {
    throw new Error('No books were found in the imported JSON file.');
  }

  const indexData: BibleBookIndex[] = normalizedBooks.map((b, i) => ({
    index: i + 1,
    name: b.name,
    slug: b.slug,
    testament: b.testament,
    chapterCount: b.chapters.length,
    verseCount: b.chapters.reduce((acc, c) => acc + c.length, 0),
  }));

  const meta: BibleVersionMeta = {
    id,
    shortName: cleanShort,
    fullName: fullName.trim() || `${cleanShort} (Local Import)`,
    year: 'Local',
    styleNote: 'User-imported local Bible JSON · Stored on this device only',
    closestModernNote: 'Custom offline library',
    isCustom: true,
  };

  for (const book of normalizedBooks) {
    const cacheKey = `${id}:${book.slug}`;
    memoryBookCache.set(cacheKey, book);
    await idbPut(BOOK_STORE, {...book, cacheKey, versionId: id});
  }
  memoryIndexCache.set(id, indexData);
  await idbPut(META_STORE, {key: `book-index:${id}`, data: indexData});
  await idbPut(CUSTOM_VERSION_STORE, meta);

  return meta;
}

export async function removeCustomTranslation(versionId: string): Promise<void> {
  await clearOfflineBookCache(versionId);
  await idbDelete(META_STORE, `book-index:${versionId}`);
  await idbDelete(CUSTOM_VERSION_STORE, versionId);
  memoryIndexCache.delete(versionId);
}

export function extractPassageChapters(
  bookData: BibleBookData,
  segments: PassageSegment[]
): ExtractedChapter[] {
  const result: ExtractedChapter[] = [];

  for (const seg of segments) {
    for (let ch = seg.startCh; ch <= seg.endCh; ch++) {
      const chapterVerses = bookData.chapters[ch - 1] ?? [];
      const firstVerse = ch === seg.startCh ? seg.startV : 1;
      const lastVerse = ch === seg.endCh ? seg.endV : chapterVerses.length;
      const verses: Array<{verseNumber: number; text: string}> = [];

      for (let v = firstVerse; v <= lastVerse; v++) {
        const text = chapterVerses[v - 1];
        if (text !== undefined) {
          verses.push({verseNumber: v, text});
        }
      }

      result.push({
        chapterNumber: ch,
        verses,
      });
    }
  }

  return result;
}

export async function searchOfflineBible(
  query: string,
  options?: {versionId?: string; testament?: 'ALL' | 'OT' | 'NT'; limit?: number}
): Promise<{hits: BibleSearchHit[]; searchedBooks: number; totalBooks: number}> {
  const trimmed = query.trim().toLowerCase();
  const versionId = options?.versionId ?? 'kjv';
  const limit = options?.limit ?? 60;
  const index = await getBookIndex(versionId);
  const filteredIndex =
    options?.testament && options.testament !== 'ALL'
      ? index.filter((b) => b.testament === options.testament)
      : index;

  if (trimmed.length < 2) {
    return {hits: [], searchedBooks: 0, totalBooks: filteredIndex.length};
  }

  const hits: BibleSearchHit[] = [];
  let searchedBooks = 0;

  for (const meta of filteredIndex) {
    const cacheKey = `${versionId}:${meta.slug}`;
    let bookData: BibleBookData | undefined =
      memoryBookCache.get(cacheKey) ??
      (typeof window !== 'undefined'
        ? window.__DAILY_BREAD_EMBEDDED_BIBLES__?.[versionId]?.[meta.slug]
        : undefined);
    if (!bookData) {
      bookData = await idbGet<StoredBookRecord>(BOOK_STORE, cacheKey);
      if (bookData) {
        memoryBookCache.set(cacheKey, bookData);
      } else if (navigator.onLine && !window.__DAILY_BREAD_PORTABLE__) {
        try {
          bookData = await getBibleBook(meta.slug, versionId);
        } catch {
          continue;
        }
      } else {
        continue;
      }
    }

    searchedBooks++;
    for (let cIdx = 0; cIdx < bookData.chapters.length; cIdx++) {
      const verses = bookData.chapters[cIdx];
      for (let vIdx = 0; vIdx < verses.length; vIdx++) {
        const text = verses[vIdx];
        if (text && text.toLowerCase().includes(trimmed)) {
          hits.push({
            book: bookData.name,
            slug: bookData.slug,
            chapter: cIdx + 1,
            verse: vIdx + 1,
            text,
          });
          if (hits.length >= limit) {
            return {hits, searchedBooks, totalBooks: filteredIndex.length};
          }
        }
      }
    }
  }

  return {hits, searchedBooks, totalBooks: filteredIndex.length};
}
