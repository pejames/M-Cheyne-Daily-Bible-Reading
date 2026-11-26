import React, {useEffect, useMemo, useState} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Minus,
  Plus,
} from 'lucide-react';
import {extractPassageChapters, getBibleBook} from '../services/offlineBibleDb';
import type {
  BibleBookData,
  BibleVersionMeta,
  ExtractedChapter,
  PlanReading,
} from '../types/bible';

interface ScriptureReaderProps {
  reading: PlanReading;
  dayNumber?: number;
  dateLabel?: string;
  contextLabel?: string;
  backLabel?: string;
  finishLabel?: string;
  completedLabel?: string;
  readingIndex: number;
  totalReadingsInDay: number;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onCompleteAndNext?: () => void;
  onPrevReading?: () => void;
  onNextReading?: () => void;
  onBackMobile?: () => void;
  versionId: string;
  compareVersionId: string | null;
  versions: BibleVersionMeta[];
  onOpenVersionModal: () => void;
  fontSize: 0 | 1 | 2 | 3;
  onChangeFontSize: (size: 0 | 1 | 2 | 3) => void;
  verseNumbers: boolean;
  onToggleVerseNumbers: () => void;
  paragraphMode: boolean;
  onToggleParagraphMode: () => void;
  highlights: Record<string, boolean>;
  onToggleHighlight: (slug: string, chapter: number, verse: number) => void;
}

const FONT_SIZE_CLASSES: Record<0 | 1 | 2 | 3, string> = {
  0: 'text-[15px] leading-[1.78]',
  1: 'text-[17px] leading-[1.82]',
  2: 'text-[19px] leading-[1.85]',
  3: 'text-[21px] leading-[1.88]',
};

export const ScriptureReader: React.FC<ScriptureReaderProps> = ({
  reading,
  dayNumber,
  dateLabel,
  contextLabel,
  backLabel = 'Readings',
  finishLabel = 'Finish Day Reading',
  completedLabel = 'Completed for Today',
  readingIndex,
  totalReadingsInDay,
  isCompleted,
  onToggleComplete,
  onCompleteAndNext,
  onPrevReading,
  onNextReading,
  onBackMobile,
  versionId,
  compareVersionId,
  versions,
  onOpenVersionModal,
  fontSize,
  onChangeFontSize,
  verseNumbers,
  onToggleVerseNumbers,
  paragraphMode,
  onToggleParagraphMode,
  highlights,
  onToggleHighlight,
}) => {
  const [bookData, setBookData] = useState<BibleBookData | null>(null);
  const [compareData, setCompareData] = useState<BibleBookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeMeta = useMemo(
    () => versions.find((v) => v.id === versionId),
    [versions, versionId]
  );
  const compareMeta = useMemo(
    () => (compareVersionId ? versions.find((v) => v.id === compareVersionId) ?? null : null),
    [versions, compareVersionId]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const primaryPromise = getBibleBook(reading.slug, versionId);
    const secondaryPromise =
      compareVersionId && compareVersionId !== versionId
        ? getBibleBook(reading.slug, compareVersionId).catch(() => null)
        : Promise.resolve(null);

    Promise.all([primaryPromise, secondaryPromise])
      .then(([primary, secondary]) => {
        if (!active) return;
        setBookData(primary);
        setCompareData(secondary);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load passage offline.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reading.slug, versionId, compareVersionId]);

  const chapters: ExtractedChapter[] = useMemo(() => {
    if (!bookData) return [];
    return extractPassageChapters(bookData, reading.segments);
  }, [bookData, reading.segments]);

  const compareChapters: ExtractedChapter[] = useMemo(() => {
    if (!compareData) return [];
    return extractPassageChapters(compareData, reading.segments);
  }, [compareData, reading.segments]);

  const isParallel = !!compareMeta && compareChapters.length === chapters.length;

  return (
    <article className="rounded-2xl border border-[#E5DFD5] bg-white/80 dark:border-[#2C2722] dark:bg-[#1A1714]">
      {/* Reader Header & Typographic Controls */}
      <div className="border-b border-[#EAE4D9] px-5 py-4 sm:px-8 sm:py-5 dark:border-[#2C2722]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBackMobile && (
              <button
                type="button"
                onClick={onBackMobile}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#E2DDD3] px-3 py-1.5 text-xs font-medium text-[#4A453E] hover:bg-[#F3EFE7] lg:hidden dark:border-[#35302A] dark:text-[#C8C0B4] dark:hover:bg-[#24201C]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                {backLabel}
              </button>
            )}
            <p className="text-xs font-medium text-[#6B655E] dark:text-[#A39B8F] tabular-nums">
              {contextLabel ??
                (dayNumber !== undefined && dateLabel
                  ? `Day ${dayNumber} · ${dateLabel} · ${reading.slotLabel} · ${readingIndex + 1} of ${totalReadingsInDay}`
                  : `${reading.slotLabel} · ${readingIndex + 1} of ${totalReadingsInDay}`)}
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleComplete}
            className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              isCompleted
                ? 'bg-[#14532D]/10 text-[#14532D] hover:bg-[#14532D]/15 dark:bg-[#4ADE80]/15 dark:text-[#86EFAC]'
                : 'bg-[#1E3A5F] text-[#FBF9F5] hover:bg-[#162C49] dark:bg-[#D4A373] dark:text-[#141210] dark:hover:bg-[#C28F5E]'
            }`}
          >
            {isCompleted ? (
              <>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Completed</span>
              </>
            ) : (
              <>
                <Circle className="h-4 w-4" aria-hidden="true" />
                <span>Mark Read</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl dark:text-[#EAE4D9] [text-wrap:balance]">
              {reading.label}
            </h2>
            <p className="mt-1 text-xs text-[#6B655E] dark:text-[#A39B8F]">
              {activeMeta?.fullName ?? versionId.toUpperCase()}
              {compareMeta ? ` · Comparing with ${compareMeta.shortName}` : ''} · Tap any verse to
              highlight
            </p>
          </div>

          {/* Typographic & Version Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenVersionModal}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#1E3A5F]/30 bg-[#1E3A5F]/8 px-3 py-1.5 text-xs font-semibold text-[#1E3A5F] transition-colors hover:bg-[#1E3A5F]/14 dark:border-[#D4A373]/40 dark:bg-[#D4A373]/15 dark:text-[#D4A373] dark:hover:bg-[#D4A373]/22 whitespace-nowrap shrink-0"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {activeMeta?.shortName ?? versionId.toUpperCase()}
                {compareMeta ? ` / ${compareMeta.shortName}` : ''}
              </span>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>

            <div
              className="inline-flex items-center rounded-lg border border-[#E5DFD5] bg-[#FBF9F5] p-0.5 dark:border-[#35302A] dark:bg-[#141210]"
              role="group"
              aria-label="Text size"
            >
              <button
                type="button"
                onClick={() => onChangeFontSize(Math.max(0, fontSize - 1) as 0 | 1 | 2 | 3)}
                disabled={fontSize === 0}
                aria-label="Decrease font size"
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md text-[#4A453E] transition-colors hover:bg-[#EFEAE0] disabled:opacity-40 dark:text-[#C8C0B4] dark:hover:bg-[#24201C]"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="px-2 text-xs font-medium text-[#6B655E] dark:text-[#A39B8F] tabular-nums">
                Aa
              </span>
              <button
                type="button"
                onClick={() => onChangeFontSize(Math.min(3, fontSize + 1) as 0 | 1 | 2 | 3)}
                disabled={fontSize === 3}
                aria-label="Increase font size"
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md text-[#4A453E] transition-colors hover:bg-[#EFEAE0] disabled:opacity-40 dark:text-[#C8C0B4] dark:hover:bg-[#24201C]"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onToggleVerseNumbers}
              className={`min-h-[38px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                verseNumbers
                  ? 'border-[#1E3A5F]/30 bg-[#1E3A5F]/8 text-[#1E3A5F] dark:border-[#D4A373]/40 dark:bg-[#D4A373]/15 dark:text-[#D4A373]'
                  : 'border-[#E5DFD5] bg-[#FBF9F5] text-[#6B655E] hover:text-[#1C1917] dark:border-[#35302A] dark:bg-[#141210] dark:text-[#A39B8F]'
              }`}
            >
              Verses
            </button>

            {!isParallel && (
              <button
                type="button"
                onClick={onToggleParagraphMode}
                className={`min-h-[38px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  paragraphMode
                    ? 'border-[#1E3A5F]/30 bg-[#1E3A5F]/8 text-[#1E3A5F] dark:border-[#D4A373]/40 dark:bg-[#D4A373]/15 dark:text-[#D4A373]'
                    : 'border-[#E5DFD5] bg-[#FBF9F5] text-[#6B655E] hover:text-[#1C1917] dark:border-[#35302A] dark:bg-[#141210] dark:text-[#A39B8F]'
                }`}
              >
                {paragraphMode ? 'Prose Flow' : 'Verse Lines'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scripture Body */}
      <div className="px-5 py-6 sm:px-10 sm:py-9">
        {loading ? (
          <div className="mx-auto max-w-prose space-y-4 py-4">
            <div className="h-6 w-36 animate-pulse rounded bg-[#EBE5DA] dark:bg-[#2A2622]" />
            <div className="h-4 w-full animate-pulse rounded bg-[#F3EFE7] dark:bg-[#24201C]" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-[#F3EFE7] dark:bg-[#24201C]" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-[#F3EFE7] dark:bg-[#24201C]" />
            <div className="h-4 w-full animate-pulse rounded bg-[#F3EFE7] dark:bg-[#24201C]" />
          </div>
        ) : error ? (
          <div className="mx-auto max-w-prose rounded-xl border border-[#E5DFD5] bg-[#FBF9F5] p-6 text-center dark:border-[#35302A] dark:bg-[#141210]">
            <p className="font-serif text-lg font-medium text-[#1C1917] dark:text-[#EAE4D9]">
              Passage Not Cached Offline
            </p>
            <p className="mt-2 text-sm text-[#6B655E] dark:text-[#A39B8F]">{error}</p>
            <p className="mt-2 text-xs text-[#6B655E] dark:text-[#A39B8F]">
              Connect briefly and save this translation in the Version Picker or Offline tab, or
              switch to KJV which is pre-cached.
            </p>
          </div>
        ) : isParallel ? (
          <div className={`mx-auto max-w-4xl font-serif text-[#1C1917] dark:text-[#EAE4D9] ${FONT_SIZE_CLASSES[fontSize]}`}>
            {chapters.map((chapter, cIdx) => {
              const secChapter = compareChapters[cIdx];
              return (
                <section
                  key={chapter.chapterNumber}
                  className={cIdx > 0 ? 'mt-10 border-t border-[#EAE4D9] pt-8 dark:border-[#2C2722]' : ''}
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#8A5A2B] dark:text-[#D4A373] tabular-nums">
                      {reading.book} · Chapter {chapter.chapterNumber}
                    </h3>
                    <div className="hidden md:grid md:grid-cols-2 md:gap-6 text-[11px] font-sans font-semibold uppercase tracking-[0.12em] text-[#6B655E] dark:text-[#A39B8F]">
                      <span>{activeMeta?.shortName ?? versionId.toUpperCase()}</span>
                      <span>{compareMeta?.shortName}</span>
                    </div>
                  </div>

                  <div className="divide-y divide-[#EFEAE0] dark:divide-[#26211D]">
                    {chapter.verses.map((v, vIdx) => {
                      const secVerse = secChapter?.verses[vIdx];
                      const isHighlighted = !!highlights[`${reading.slug}:${chapter.chapterNumber}:${v.verseNumber}`];
                      return (
                        <div
                          key={v.verseNumber}
                          onClick={() =>
                            onToggleHighlight(reading.slug, chapter.chapterNumber, v.verseNumber)
                          }
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onToggleHighlight(reading.slug, chapter.chapterNumber, v.verseNumber);
                            }
                          }}
                          className={`grid grid-cols-1 gap-3 py-3 cursor-pointer rounded-md px-2 -mx-2 transition-colors md:grid-cols-2 md:gap-6 ${
                            isHighlighted
                              ? 'bg-[#D4A373]/22 dark:bg-[#D4A373]/18'
                              : 'hover:bg-[#F7F3EB] dark:hover:bg-[#231F1B]'
                          }`}
                        >
                          <p>
                            {verseNumbers && (
                              <sup className="mr-2 font-sans text-[11px] font-semibold text-[#8A5A2B] dark:text-[#D4A373] tabular-nums select-none">
                                {v.verseNumber}
                              </sup>
                            )}
                            {v.text ? (
                              <span>{v.text}</span>
                            ) : (
                              <span className="italic text-sm text-[#8C8479]">
                                [Omitted in earliest manuscripts]
                              </span>
                            )}
                          </p>
                          <p className="text-[#4A453E] dark:text-[#C8C0B4]">
                            <span className="mr-2 font-sans text-[10px] font-semibold uppercase tracking-wider text-[#6B655E] md:hidden dark:text-[#A39B8F]">
                              {compareMeta?.shortName}
                            </span>
                            {secVerse?.text ? (
                              <span>{secVerse.text}</span>
                            ) : (
                              <span className="italic text-sm text-[#8C8479]">
                                [Omitted in earliest manuscripts]
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className={`mx-auto max-w-prose font-serif text-[#1C1917] dark:text-[#EAE4D9] ${FONT_SIZE_CLASSES[fontSize]}`}>
            {chapters.map((chapter, cIdx) => (
              <section
                key={chapter.chapterNumber}
                className={cIdx > 0 ? 'mt-10 border-t border-[#EAE4D9] pt-8 dark:border-[#2C2722]' : ''}
              >
                <h3 className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-[#8A5A2B] dark:text-[#D4A373] tabular-nums">
                  {reading.book} · Chapter {chapter.chapterNumber}
                </h3>

                {paragraphMode ? (
                  <p className="text-pretty">
                    {chapter.verses.map((v) => {
                      if (!v.text) return null;
                      const isHighlighted = !!highlights[`${reading.slug}:${chapter.chapterNumber}:${v.verseNumber}`];
                      return (
                        <span
                          key={v.verseNumber}
                          onClick={() =>
                            onToggleHighlight(reading.slug, chapter.chapterNumber, v.verseNumber)
                          }
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onToggleHighlight(reading.slug, chapter.chapterNumber, v.verseNumber);
                            }
                          }}
                          className={`cursor-pointer rounded transition-colors ${
                            isHighlighted
                              ? 'bg-[#D4A373]/28 px-0.5 dark:bg-[#D4A373]/22'
                              : 'hover:bg-[#F3EFE7] dark:hover:bg-[#26211D]'
                          }`}
                        >
                          {verseNumbers && (
                            <sup className="mr-1 font-sans text-[11px] font-semibold text-[#8A5A2B] dark:text-[#D4A373] tabular-nums select-none">
                              {v.verseNumber}
                            </sup>
                          )}
                          {v.text}{' '}
                        </span>
                      );
                    })}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {chapter.verses.map((v, vIdx) => {
                      const isHighlighted = !!highlights[`${reading.slug}:${chapter.chapterNumber}:${v.verseNumber}`];
                      const isFirstVerse = cIdx === 0 && vIdx === 0;
                      return (
                        <p
                          key={v.verseNumber}
                          onClick={() =>
                            onToggleHighlight(reading.slug, chapter.chapterNumber, v.verseNumber)
                          }
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onToggleHighlight(reading.slug, chapter.chapterNumber, v.verseNumber);
                            }
                          }}
                          className={`cursor-pointer rounded-md px-2 py-1 -mx-2 transition-colors ${
                            isHighlighted
                              ? 'bg-[#D4A373]/25 dark:bg-[#D4A373]/20'
                              : 'hover:bg-[#F7F3EB] dark:hover:bg-[#231F1B]'
                          } ${
                            isFirstVerse && !verseNumbers
                              ? 'first-letter:float-left first-letter:mr-2.5 first-letter:mt-1 first-letter:font-serif first-letter:text-5xl first-letter:font-semibold first-letter:leading-none first-letter:text-[#1E3A5F] dark:first-letter:text-[#D4A373]'
                              : ''
                          }`}
                        >
                          {verseNumbers && (
                            <sup className="mr-2 font-sans text-[11px] font-semibold text-[#8A5A2B] dark:text-[#D4A373] tabular-nums select-none">
                              {v.verseNumber}
                            </sup>
                          )}
                          {v.text ? (
                            <span>{v.text}</span>
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
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation & Complete Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EAE4D9] px-5 py-4 sm:px-8 dark:border-[#2C2722]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevReading}
            disabled={!onPrevReading}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-[#E2DDD3] px-3.5 py-2 text-xs font-medium text-[#4A453E] transition-colors hover:bg-[#F3EFE7] disabled:opacity-40 dark:border-[#35302A] dark:text-[#C8C0B4] dark:hover:bg-[#24201C] whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Previous
          </button>
          <button
            type="button"
            onClick={onNextReading}
            disabled={!onNextReading}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-[#E2DDD3] px-3.5 py-2 text-xs font-medium text-[#4A453E] transition-colors hover:bg-[#F3EFE7] disabled:opacity-40 dark:border-[#35302A] dark:text-[#C8C0B4] dark:hover:bg-[#24201C] whitespace-nowrap shrink-0"
          >
            Next
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        {onCompleteAndNext ? (
          <button
            type="button"
            onClick={onCompleteAndNext}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#1E3A5F] px-5 py-2.5 text-xs font-medium text-[#FBF9F5] transition-colors hover:bg-[#162C49] dark:bg-[#D4A373] dark:text-[#141210] dark:hover:bg-[#C28F5E] whitespace-nowrap shrink-0"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            <span>Complete &amp; Next Reading</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleComplete}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              isCompleted
                ? 'border border-[#14532D]/30 bg-[#14532D]/10 text-[#14532D] dark:border-[#4ADE80]/30 dark:bg-[#4ADE80]/15 dark:text-[#86EFAC]'
                : 'bg-[#1E3A5F] text-[#FBF9F5] hover:bg-[#162C49] dark:bg-[#D4A373] dark:text-[#141210] dark:hover:bg-[#C28F5E]'
            }`}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            <span>{isCompleted ? completedLabel : finishLabel}</span>
          </button>
        )}
      </div>
    </article>
  );
};
