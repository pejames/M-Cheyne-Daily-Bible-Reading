import React, {useEffect, useMemo, useState} from 'react';
import {CheckCircle2, Circle} from 'lucide-react';
import {
  getMCheyneOrderedBooks,
  type MCheyneOrderedBook,
} from '../data/planHelpers';
import {ScriptureReader} from './ScriptureReader';
import type {BibleVersionMeta} from '../types/bible';

interface BookPlanViewProps {
  completedIds: Record<string, string>;
  onToggleReading: (readingId: string) => void;
  onMarkReadingComplete: (readingId: string) => void;
  onToggleManyReadings: (readingIds: string[], markComplete: boolean) => void;
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

export const BookPlanView: React.FC<BookPlanViewProps> = ({
  completedIds,
  onToggleReading,
  onMarkReadingComplete,
  onToggleManyReadings,
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
  const orderedBooks = useMemo(() => getMCheyneOrderedBooks(), []);

  const [onlyRemaining, setOnlyRemaining] = useState(false);
  const [selectedBookKey, setSelectedBookKey] = useState<string>(
    orderedBooks[0]?.key ?? 'family-1:genesis'
  );
  const [activePortionIdx, setActivePortionIdx] = useState<number>(0);
  const [mobileReaderOpen, setMobileReaderOpen] = useState(false);

  const visibleBooks = useMemo(() => {
    if (!onlyRemaining) return orderedBooks;
    return orderedBooks.filter((b) =>
      b.portions.some((p) => !completedIds[p.reading.id])
    );
  }, [orderedBooks, onlyRemaining, completedIds]);

  const selectedBookIndex = useMemo(() => {
    const idx = orderedBooks.findIndex((b) => b.key === selectedBookKey);
    return idx >= 0 ? idx : 0;
  }, [orderedBooks, selectedBookKey]);

  const selectedBook: MCheyneOrderedBook = orderedBooks[selectedBookIndex];

  useEffect(() => {
    const firstUnread = selectedBook.portions.findIndex(
      (p) => !completedIds[p.reading.id]
    );
    setActivePortionIdx(firstUnread >= 0 ? firstUnread : 0);
  }, [selectedBookKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const activePortion =
    selectedBook.portions[activePortionIdx] ?? selectedBook.portions[0];

  const completedBooksCount = useMemo(() => {
    return orderedBooks.filter((b) =>
      b.portions.every((p) => !!completedIds[p.reading.id])
    ).length;
  }, [orderedBooks, completedIds]);

  const bookCompletedCount = useMemo(() => {
    return selectedBook.portions.filter((p) => !!completedIds[p.reading.id]).length;
  }, [selectedBook, completedIds]);

  const isBookAllDone =
    selectedBook.portions.length > 0 &&
    bookCompletedCount === selectedBook.portions.length;

  const handleSelectBook = (bookKey: string) => {
    setSelectedBookKey(bookKey);
    setMobileReaderOpen(true);
  };

  const handlePrevPortion = () => {
    if (activePortionIdx > 0) {
      setActivePortionIdx(activePortionIdx - 1);
      window.scrollTo({top: 0, behavior: 'smooth'});
      return;
    }
    if (selectedBookIndex > 0) {
      const prevBook = orderedBooks[selectedBookIndex - 1];
      setSelectedBookKey(prevBook.key);
      setActivePortionIdx(Math.max(0, prevBook.portions.length - 1));
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  };

  const handleNextPortion = () => {
    if (activePortionIdx < selectedBook.portions.length - 1) {
      setActivePortionIdx(activePortionIdx + 1);
      window.scrollTo({top: 0, behavior: 'smooth'});
      return;
    }
    if (selectedBookIndex < orderedBooks.length - 1) {
      const nextBook = orderedBooks[selectedBookIndex + 1];
      setSelectedBookKey(nextBook.key);
      setActivePortionIdx(0);
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  };

  const handleCompleteAndNext = () => {
    if (!activePortion) return;
    onMarkReadingComplete(activePortion.reading.id);
    if (activePortionIdx < selectedBook.portions.length - 1) {
      setActivePortionIdx(activePortionIdx + 1);
      window.scrollTo({top: 0, behavior: 'smooth'});
    } else if (selectedBookIndex < orderedBooks.length - 1) {
      const nextBook = orderedBooks[selectedBookIndex + 1];
      setSelectedBookKey(nextBook.key);
      setActivePortionIdx(0);
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  };

  const hasPrev = activePortionIdx > 0 || selectedBookIndex > 0;
  const hasNext =
    activePortionIdx < selectedBook.portions.length - 1 ||
    selectedBookIndex < orderedBooks.length - 1;

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <section className="flex flex-col gap-3 border-b border-[#E5DFD5] pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-[#2C2722]">
        <div>
          <p className="text-xs font-medium text-[#6B655E] dark:text-[#A39B8F] tabular-nums">
            M&apos;Cheyne Book-by-Book Order · Genesis, Matthew, Ezra, Acts ·{' '}
            {completedBooksCount} of {orderedBooks.length} books completed
          </p>
          <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl dark:text-[#EAE4D9] [text-wrap:balance]">
            Book-by-Book Reading
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setOnlyRemaining((v) => !v)}
          className={`self-start min-h-[38px] rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            onlyRemaining
              ? 'border-[#1E3A5F] bg-[#1E3A5F] text-[#FBF9F5] dark:border-[#D4A373] dark:bg-[#D4A373] dark:text-[#141210]'
              : 'border-[#E2DDD3] bg-white/80 text-[#4A453E] hover:bg-[#F3EFE7] dark:border-[#35302A] dark:bg-[#1E1B18] dark:text-[#C8C0B4] dark:hover:bg-[#2A2622]'
          }`}
        >
          {onlyRemaining ? 'Showing Remaining Only' : 'Show All Books'}
        </button>
      </section>

      {/* Simple 2-Column Workspace: Ordered Book List + Reader */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Simple Ordered Books List */}
        <aside
          className={`lg:col-span-4 ${mobileReaderOpen ? 'hidden lg:block' : 'block'}`}
        >
          <div className="rounded-2xl border border-[#E5DFD5] bg-white/80 p-3 dark:border-[#2C2722] dark:bg-[#1A1714]">
            {visibleBooks.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#6B655E] dark:text-[#A39B8F]">
                All books in the M&apos;Cheyne plan are completed.
              </p>
            ) : (
              <div className="max-h-[72vh] divide-y divide-[#EFEAE0] overflow-y-auto pr-1 dark:divide-[#26211D]">
                {visibleBooks.map((b) => {
                  const done = b.portions.filter((p) => !!completedIds[p.reading.id]).length;
                  const total = b.portions.length;
                  const isFinished = done === total;
                  const isActive = b.key === selectedBook.key;

                  return (
                    <div
                      key={b.key}
                      className={`flex items-center gap-2 py-1.5 px-1.5 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-[#1E3A5F]/10 dark:bg-[#D4A373]/15'
                          : 'hover:bg-[#F7F3EB] dark:hover:bg-[#231F1B]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onToggleManyReadings(
                            b.portions.map((p) => p.reading.id),
                            !isFinished
                          )
                        }
                        aria-label={
                          isFinished
                            ? `Unmark ${b.book} (${b.trackGroup})`
                            : `Mark ${b.book} (${b.trackGroup}) completed`
                        }
                        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg transition-transform active:scale-95 shrink-0"
                      >
                        {isFinished ? (
                          <CheckCircle2 className="h-5 w-5 text-[#14532D] dark:text-[#86EFAC]" />
                        ) : (
                          <Circle className="h-5 w-5 text-[#B5ADA2] dark:text-[#665E54]" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectBook(b.key)}
                        className="flex min-h-[40px] flex-1 items-center justify-between gap-2 text-left"
                      >
                        <div className="min-w-0">
                          <p
                            className={`truncate font-serif text-sm font-semibold ${
                              isFinished
                                ? 'text-[#6B655E] line-through decoration-[#B5ADA2] dark:text-[#8C8479]'
                                : isActive
                                  ? 'text-[#1E3A5F] dark:text-[#D4A373]'
                                  : 'text-[#1C1917] dark:text-[#EAE4D9]'
                            }`}
                          >
                            {b.globalOrder}. {b.book}
                          </p>
                          <p className="text-[11px] text-[#6B655E] dark:text-[#A39B8F]">
                            {b.trackGroup}
                          </p>
                        </div>

                        <span
                          className={`text-[11px] tabular-nums shrink-0 ${
                            isFinished
                              ? 'font-semibold text-[#14532D] dark:text-[#86EFAC]'
                              : 'text-[#6B655E] dark:text-[#A39B8F]'
                          }`}
                        >
                          {done}/{total}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Right Column: Scripture Reader for Selected Book */}
        <div
          className={`space-y-3 lg:col-span-8 ${
            mobileReaderOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E5DFD5] bg-white/80 px-5 py-3.5 dark:border-[#2C2722] dark:bg-[#1A1714]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A5A2B] dark:text-[#D4A373] tabular-nums">
                Book {selectedBook.globalOrder} of {orderedBooks.length} ·{' '}
                {selectedBook.trackGroup}
              </p>
              <h2 className="font-serif text-xl font-semibold text-[#1C1917] dark:text-[#EAE4D9]">
                {selectedBook.book}
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                onToggleManyReadings(
                  selectedBook.portions.map((p) => p.reading.id),
                  !isBookAllDone
                )
              }
              className={`min-h-[38px] rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                isBookAllDone
                  ? 'border-[#14532D]/30 bg-[#14532D]/10 text-[#14532D] dark:border-[#4ADE80]/30 dark:bg-[#4ADE80]/15 dark:text-[#86EFAC]'
                  : 'border-[#E2DDD3] bg-[#FBF9F5] text-[#4A453E] hover:bg-[#F3EFE7] dark:border-[#35302A] dark:bg-[#141210] dark:text-[#C8C0B4] dark:hover:bg-[#24201C]'
              }`}
            >
              {isBookAllDone ? 'Book Completed' : 'Complete Book'}
            </button>
          </div>

          {activePortion && (
            <ScriptureReader
              reading={activePortion.reading}
              contextLabel={`${selectedBook.trackGroup} · Section ${activePortionIdx + 1} of ${selectedBook.portions.length}`}
              backLabel="Books"
              finishLabel="Finish Plan"
              completedLabel="Plan Completed"
              readingIndex={activePortionIdx}
              totalReadingsInDay={selectedBook.portions.length}
              isCompleted={!!completedIds[activePortion.reading.id]}
              onToggleComplete={() => onToggleReading(activePortion.reading.id)}
              onCompleteAndNext={hasNext ? handleCompleteAndNext : undefined}
              onPrevReading={hasPrev ? handlePrevPortion : undefined}
              onNextReading={hasNext ? handleNextPortion : undefined}
              onBackMobile={() => setMobileReaderOpen(false)}
              versionId={versionId}
              compareVersionId={compareVersionId}
              versions={versions}
              onOpenVersionModal={onOpenVersionModal}
              fontSize={fontSize}
              onChangeFontSize={onChangeFontSize}
              verseNumbers={verseNumbers}
              onToggleVerseNumbers={onToggleVerseNumbers}
              paragraphMode={paragraphMode}
              onToggleParagraphMode={onToggleParagraphMode}
              highlights={highlights}
              onToggleHighlight={onToggleHighlight}
            />
          )}
        </div>
      </div>
    </div>
  );
};
