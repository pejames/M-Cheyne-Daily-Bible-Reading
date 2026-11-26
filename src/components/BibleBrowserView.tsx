import React, {useEffect, useMemo, useState} from 'react';
import {BookOpen, ChevronDown, ChevronLeft, ChevronRight, Search, X} from 'lucide-react';
import {
  getBibleBook,
  getBookIndex,
  searchOfflineBible,
} from '../services/offlineBibleDb';
import type {
  BibleBookData,
  BibleBookIndex,
  BibleSearchHit,
  BibleVersionMeta,
} from '../types/bible';

interface BibleBrowserViewProps {
  versionId: string;
  versions: BibleVersionMeta[];
  onOpenVersionModal: () => void;
  fontSize: 0 | 1 | 2 | 3;
  verseNumbers: boolean;
  paragraphMode: boolean;
  highlights: Record<string, boolean>;
  onToggleHighlight: (slug: string, chapter: number, verse: number) => void;
}

const FONT_SIZE_CLASSES: Record<0 | 1 | 2 | 3, string> = {
  0: 'text-[15px] leading-[1.78]',
  1: 'text-[17px] leading-[1.82]',
  2: 'text-[19px] leading-[1.85]',
  3: 'text-[21px] leading-[1.88]',
};

export const BibleBrowserView: React.FC<BibleBrowserViewProps> = ({
  versionId,
  versions,
  onOpenVersionModal,
  fontSize,
  verseNumbers,
  paragraphMode,
  highlights,
  onToggleHighlight,
}) => {
  const [books, setBooks] = useState<BibleBookIndex[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('psalms');
  const [selectedChapter, setSelectedChapter] = useState<number>(23);
  const [bookData, setBookData] = useState<BibleBookData | null>(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [bookError, setBookError] = useState<string | null>(null);
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'OT' | 'NT'>('ALL');

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<BibleSearchHit[] | null>(null);
  const [searchMeta, setSearchMeta] = useState<{searchedBooks: number; totalBooks: number} | null>(
    null
  );

  const activeMeta = useMemo(
    () => versions.find((v) => v.id === versionId),
    [versions, versionId]
  );

  useEffect(() => {
    getBookIndex(versionId)
      .then((idx) => setBooks(idx))
      .catch(() => setBooks([]));
  }, [versionId]);

  useEffect(() => {
    let active = true;
    setLoadingBook(true);
    setBookError(null);
    getBibleBook(selectedSlug, versionId)
      .then((data) => {
        if (!active) return;
        setBookData(data);
        setLoadingBook(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setBookData(null);
        setBookError(err instanceof Error ? err.message : 'Unable to load book offline.');
        setLoadingBook(false);
      });
    return () => {
      active = false;
    };
  }, [selectedSlug, versionId]);

  const filteredBooks = useMemo(() => {
    if (testamentFilter === 'ALL') return books;
    return books.filter((b) => b.testament === testamentFilter);
  }, [books, testamentFilter]);

  const activeBookMeta = useMemo(
    () => books.find((b) => b.slug === selectedSlug),
    [books, selectedSlug]
  );

  const chapterVerses = useMemo(() => {
    if (!bookData) return [];
    return bookData.chapters[selectedChapter - 1] ?? [];
  }, [bookData, selectedChapter]);

  const handleSelectBook = (slug: string) => {
    setSelectedSlug(slug);
    setSelectedChapter(1);
    setSearchResults(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      const res = await searchOfflineBible(query, {
        versionId,
        testament: testamentFilter,
        limit: 60,
      });
      setSearchResults(res.hits);
      setSearchMeta({searchedBooks: res.searchedBooks, totalBooks: res.totalBooks});
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults(null);
    setSearchMeta(null);
  };

  return (
    <div className="space-y-6">
      {/* Header + Offline Search Bar */}
      <section className="flex flex-col gap-4 border-b border-[#E5DFD5] pb-5 lg:flex-row lg:items-end lg:justify-between dark:border-[#2C2722]">
        <div>
          <p className="text-xs font-medium text-[#6B655E] dark:text-[#A39B8F]">
            {activeMeta?.fullName ?? versionId.toUpperCase()} · 66 Books · Offline Index
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl dark:text-[#EAE4D9] [text-wrap:balance]">
              Scripture Library
            </h1>
            <button
              type="button"
              onClick={onOpenVersionModal}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#1E3A5F]/30 bg-[#1E3A5F]/8 px-3 py-1.5 text-xs font-semibold text-[#1E3A5F] transition-colors hover:bg-[#1E3A5F]/14 dark:border-[#D4A373]/40 dark:bg-[#D4A373]/15 dark:text-[#D4A373] dark:hover:bg-[#D4A373]/22 whitespace-nowrap shrink-0"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{activeMeta?.shortName ?? versionId.toUpperCase()}</span>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex w-full max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B655E] dark:text-[#A39B8F]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${activeMeta?.shortName ?? versionId.toUpperCase()} offline...`}
              className="min-h-[42px] w-full rounded-lg border border-[#E2DDD3] bg-white pl-9 pr-9 text-sm text-[#1C1917] placeholder:text-[#9A9288] focus:border-[#1E3A5F] focus:outline-none dark:border-[#35302A] dark:bg-[#1A1714] dark:text-[#EAE4D9] dark:placeholder:text-[#665E54] dark:focus:border-[#D4A373]"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#6B655E] hover:text-[#1C1917] dark:text-[#A39B8F] dark:hover:text-[#EAE4D9]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={searching || query.trim().length < 2}
            className="min-h-[42px] rounded-lg bg-[#1E3A5F] px-4 py-2 text-xs font-medium text-[#FBF9F5] transition-colors hover:bg-[#162C49] disabled:opacity-50 dark:bg-[#D4A373] dark:text-[#141210] dark:hover:bg-[#C28F5E] whitespace-nowrap shrink-0"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </section>

      {/* Search Results Overlay View */}
      {searchResults !== null ? (
        <section className="rounded-2xl border border-[#E5DFD5] bg-white/80 p-5 sm:p-6 dark:border-[#2C2722] dark:bg-[#1A1714]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE4D9] pb-4 dark:border-[#2C2722]">
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#1C1917] dark:text-[#EAE4D9]">
                Search Results for &ldquo;{query.trim()}&rdquo;
              </h2>
              {searchMeta && (
                <p className="mt-0.5 text-xs text-[#6B655E] dark:text-[#A39B8F] tabular-nums">
                  {searchResults.length} matches in {activeMeta?.shortName ?? versionId.toUpperCase()} across{' '}
                  {searchMeta.searchedBooks} of {searchMeta.totalBooks} books
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={clearSearch}
              className="min-h-[38px] rounded-lg border border-[#E2DDD3] px-3.5 py-1.5 text-xs font-medium text-[#1C1917] hover:bg-[#F3EFE7] dark:border-[#35302A] dark:text-[#EAE4D9] dark:hover:bg-[#24201C]"
            >
              Back to Chapter
            </button>
          </div>

          {searchResults.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#6B655E] dark:text-[#A39B8F]">
              No matching verses found in the searched books.
            </p>
          ) : (
            <div className="divide-y divide-[#EFEAE0] dark:divide-[#26211D]">
              {searchResults.map((hit) => (
                <button
                  key={`${hit.slug}-${hit.chapter}-${hit.verse}`}
                  type="button"
                  onClick={() => {
                    setSelectedSlug(hit.slug);
                    setSelectedChapter(hit.chapter);
                    setSearchResults(null);
                  }}
                  className="block w-full py-3.5 text-left transition-colors hover:bg-[#F7F3EB] px-2 -mx-2 rounded-lg dark:hover:bg-[#231F1B]"
                >
                  <p className="text-xs font-semibold text-[#8A5A2B] dark:text-[#D4A373] tabular-nums">
                    {hit.book} {hit.chapter}:{hit.verse}
                  </p>
                  <p className="mt-1 font-serif text-base leading-relaxed text-[#1C1917] dark:text-[#EAE4D9]">
                    {hit.text}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          {/* Left Book & Chapter Index */}
          <aside className="space-y-4 lg:col-span-4">
            <div className="rounded-2xl border border-[#E5DFD5] bg-white/80 p-4 dark:border-[#2C2722] dark:bg-[#1A1714]">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EAE4D9] dark:border-[#2C2722]">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A5A2B] dark:text-[#D4A373]">
                  Books
                </span>
                <div className="inline-flex rounded-lg border border-[#E2DDD3] bg-[#F3EFE7] p-0.5 dark:border-[#35302A] dark:bg-[#141210]">
                  {(['ALL', 'OT', 'NT'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTestamentFilter(t)}
                      className={`min-h-[30px] rounded-md px-2.5 text-xs font-medium transition-colors ${
                        testamentFilter === t
                          ? 'bg-white text-[#1C1917] shadow-xs dark:bg-[#2C2722] dark:text-[#EAE4D9]'
                          : 'text-[#6B655E] dark:text-[#A39B8F]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid max-h-72 grid-cols-2 gap-1 overflow-y-auto pr-1">
                {filteredBooks.map((b) => {
                  const active = b.slug === selectedSlug;
                  return (
                    <button
                      key={b.slug}
                      type="button"
                      onClick={() => handleSelectBook(b.slug)}
                      className={`min-h-[36px] truncate rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#1E3A5F] text-[#FBF9F5] dark:bg-[#D4A373] dark:text-[#141210]'
                          : 'text-[#292524] hover:bg-[#F3EFE7] dark:text-[#D6CFC5] dark:hover:bg-[#24201C]'
                      }`}
                    >
                      {b.name}
                    </button>
                  );
                })}
              </div>

              {activeBookMeta && (
                <div className="mt-4 border-t border-[#EAE4D9] pt-3 dark:border-[#2C2722]">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8A5A2B] dark:text-[#D4A373]">
                    {activeBookMeta.name} · Chapters
                  </p>
                  <div className="grid max-h-48 grid-cols-6 gap-1 overflow-y-auto pr-1">
                    {Array.from({length: activeBookMeta.chapterCount}, (_, i) => i + 1).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setSelectedChapter(ch)}
                        className={`min-h-[36px] rounded-md text-xs font-medium tabular-nums transition-colors ${
                          selectedChapter === ch
                            ? 'bg-[#1E3A5F] text-[#FBF9F5] dark:bg-[#D4A373] dark:text-[#141210]'
                            : 'bg-[#F7F3EB] text-[#4A453E] hover:bg-[#EAE4D9] dark:bg-[#24201C] dark:text-[#C8C0B4] dark:hover:bg-[#2E2924]'
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Right Chapter Reader */}
          <article className="rounded-2xl border border-[#E5DFD5] bg-white/80 lg:col-span-8 dark:border-[#2C2722] dark:bg-[#1A1714]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE4D9] px-5 py-4 sm:px-8 dark:border-[#2C2722]">
              <div>
                <p className="text-xs text-[#6B655E] dark:text-[#A39B8F]">
                  {activeBookMeta?.testament === 'OT' ? 'Old Testament' : 'New Testament'} ·{' '}
                  {activeMeta?.shortName ?? versionId.toUpperCase()}
                </p>
                <h2 className="font-serif text-2xl font-semibold text-[#1C1917] sm:text-3xl dark:text-[#EAE4D9]">
                  {bookData?.name ?? activeBookMeta?.name} {selectedChapter}
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={selectedChapter <= 1}
                  onClick={() => setSelectedChapter((c) => Math.max(1, c - 1))}
                  className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-[#E2DDD3] px-3 py-1.5 text-xs font-medium text-[#4A453E] hover:bg-[#F3EFE7] disabled:opacity-40 dark:border-[#35302A] dark:text-[#C8C0B4] dark:hover:bg-[#24201C]"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </button>
                <button
                  type="button"
                  disabled={!activeBookMeta || selectedChapter >= activeBookMeta.chapterCount}
                  onClick={() =>
                    setSelectedChapter((c) =>
                      activeBookMeta ? Math.min(activeBookMeta.chapterCount, c + 1) : c + 1
                    )
                  }
                  className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-[#E2DDD3] px-3 py-1.5 text-xs font-medium text-[#4A453E] hover:bg-[#F3EFE7] disabled:opacity-40 dark:border-[#35302A] dark:text-[#C8C0B4] dark:hover:bg-[#24201C]"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="px-5 py-6 sm:px-10 sm:py-8">
              {loadingBook ? (
                <div className="mx-auto max-w-prose space-y-3 py-4">
                  <div className="h-4 w-full animate-pulse rounded bg-[#F3EFE7] dark:bg-[#24201C]" />
                  <div className="h-4 w-11/12 animate-pulse rounded bg-[#F3EFE7] dark:bg-[#24201C]" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-[#F3EFE7] dark:bg-[#24201C]" />
                </div>
              ) : bookError ? (
                <div className="mx-auto max-w-prose rounded-xl border border-[#E5DFD5] bg-[#FBF9F5] p-6 text-center dark:border-[#35302A] dark:bg-[#141210]">
                  <p className="font-serif text-lg font-medium text-[#1C1917] dark:text-[#EAE4D9]">
                    Book Not Cached Offline
                  </p>
                  <p className="mt-2 text-sm text-[#6B655E] dark:text-[#A39B8F]">{bookError}</p>
                </div>
              ) : (
                <div
                  className={`mx-auto max-w-prose font-serif text-[#1C1917] dark:text-[#EAE4D9] ${FONT_SIZE_CLASSES[fontSize]}`}
                >
                  {paragraphMode ? (
                    <p>
                      {chapterVerses.map((text, idx) => {
                        if (!text) return null;
                        const vNum = idx + 1;
                        const hl = !!highlights[`${selectedSlug}:${selectedChapter}:${vNum}`];
                        return (
                          <span
                            key={vNum}
                            onClick={() => onToggleHighlight(selectedSlug, selectedChapter, vNum)}
                            className={`cursor-pointer rounded transition-colors ${
                              hl
                                ? 'bg-[#D4A373]/28 px-0.5 dark:bg-[#D4A373]/22'
                                : 'hover:bg-[#F3EFE7] dark:hover:bg-[#26211D]'
                            }`}
                          >
                            {verseNumbers && (
                              <sup className="mr-1 font-sans text-[11px] font-semibold text-[#8A5A2B] dark:text-[#D4A373] tabular-nums select-none">
                                {vNum}
                              </sup>
                            )}
                            {text}{' '}
                          </span>
                        );
                      })}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {chapterVerses.map((text, idx) => {
                        const vNum = idx + 1;
                        const hl = !!highlights[`${selectedSlug}:${selectedChapter}:${vNum}`];
                        return (
                          <p
                            key={vNum}
                            onClick={() => onToggleHighlight(selectedSlug, selectedChapter, vNum)}
                            className={`cursor-pointer rounded-md px-2 py-1 -mx-2 transition-colors ${
                              hl
                                ? 'bg-[#D4A373]/25 dark:bg-[#D4A373]/20'
                                : 'hover:bg-[#F7F3EB] dark:hover:bg-[#231F1B]'
                            }`}
                          >
                            {verseNumbers && (
                              <sup className="mr-2 font-sans text-[11px] font-semibold text-[#8A5A2B] dark:text-[#D4A373] tabular-nums select-none">
                                {vNum}
                              </sup>
                            )}
                            {text ? (
                              <span>{text}</span>
                            ) : (
                              <span className="italic text-sm text-[#8C8479]">
                                [Omitted in earliest manuscripts]
                              </span>
                            )}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </article>
        </div>
      )}
    </div>
  );
};
