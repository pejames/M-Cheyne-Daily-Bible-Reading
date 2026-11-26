import React, {useEffect, useState} from 'react';
import {
  Archive,
  BookOpenText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
} from 'lucide-react';
import {getDayByNumber} from '../data/planHelpers';
import {PWAInstallButton} from './PWAInstallButton';
import {ScriptureReader} from './ScriptureReader';
import type {BibleVersionMeta, PlanReading} from '../types/bible';

interface TodayViewProps {
  selectedDay: number;
  todayDayNumber: number;
  onSelectDay: (day: number) => void;
  completedIds: Record<string, string>;
  onToggleReading: (readingId: string) => void;
  onMarkReadingComplete: (readingId: string) => void;
  onToggleDayAll: (day: number) => void;
  dayNote: string;
  onChangeDayNote: (day: number, note: string) => void;
  versionId: string;
  compareVersionId: string | null;
  versions: BibleVersionMeta[];
  onOpenVersionModal: () => void;
  onOpenExportZip: () => void;
  fontSize: 0 | 1 | 2 | 3;
  onChangeFontSize: (size: 0 | 1 | 2 | 3) => void;
  verseNumbers: boolean;
  onToggleVerseNumbers: () => void;
  paragraphMode: boolean;
  onToggleParagraphMode: () => void;
  highlights: Record<string, boolean>;
  onToggleHighlight: (slug: string, chapter: number, verse: number) => void;
  stats: {
    completedReadings: number;
    totalReadings: number;
    completedDays: number;
    streak: number;
    percentYear: number;
  };
}

export const TodayView: React.FC<TodayViewProps> = ({
  selectedDay,
  todayDayNumber,
  onSelectDay,
  completedIds,
  onToggleReading,
  onMarkReadingComplete,
  onToggleDayAll,
  dayNote,
  onChangeDayNote,
  versionId,
  compareVersionId,
  versions,
  onOpenVersionModal,
  onOpenExportZip,
  fontSize,
  onChangeFontSize,
  verseNumbers,
  onToggleVerseNumbers,
  paragraphMode,
  onToggleParagraphMode,
  highlights,
  onToggleHighlight,
  stats,
}) => {
  const dayPlan = getDayByNumber(selectedDay);
  const [activeReadingIdx, setActiveReadingIdx] = useState(0);
  const [mobileReaderOpen, setMobileReaderOpen] = useState(false);

  // Reset to first unread reading when changing days
  useEffect(() => {
    const firstUnread = dayPlan.readings.findIndex((r) => !completedIds[r.id]);
    setActiveReadingIdx(firstUnread >= 0 ? firstUnread : 0);
  }, [selectedDay]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeReading: PlanReading = dayPlan.readings[activeReadingIdx] ?? dayPlan.readings[0];
  const dayCompletedCount = dayPlan.readings.filter((r) => !!completedIds[r.id]).length;
  const isDayDone = dayCompletedCount === dayPlan.readings.length;

  const familyReadings = dayPlan.readings.filter((r) => r.track === 'family');
  const secretReadings = dayPlan.readings.filter((r) => r.track === 'secret');

  const handleOpenReading = (idx: number) => {
    setActiveReadingIdx(idx);
    setMobileReaderOpen(true);
  };

  const handleCompleteAndNext = () => {
    onMarkReadingComplete(activeReading.id);
    if (activeReadingIdx < dayPlan.readings.length - 1) {
      setActiveReadingIdx(activeReadingIdx + 1);
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Day Header & Workspace Bar */}
      <section className="flex flex-col gap-4 border-b border-[#E5DFD5] pb-5 lg:flex-row lg:items-end lg:justify-between dark:border-[#2C2722]">
        <div>
          <p className="text-xs font-medium text-[#6B655E] dark:text-[#A39B8F] tabular-nums">
            Robert Murray M&apos;Cheyne 1-Year Plan · Day {dayPlan.day} of 365 ·{' '}
            {stats.completedReadings} of {stats.totalReadings} passages read ({stats.percentYear}%)
            {stats.streak > 0 ? ` · ${stats.streak}-day streak` : ''}
          </p>
          <h1 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl dark:text-[#EAE4D9] [text-wrap:balance]">
            {dayPlan.dateLabel}
            {selectedDay === todayDayNumber && (
              <span className="ml-3 font-sans text-sm font-medium text-[#8A5A2B] dark:text-[#D4A373]">
                Today
              </span>
            )}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PWAInstallButton variant="compact" />
          {!window.__DAILY_BREAD_PORTABLE__ && (
            <button
              type="button"
              onClick={onOpenExportZip}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[#D8D1C5] bg-white/80 px-3.5 py-2 text-xs font-medium text-[#1C1917] transition-colors hover:bg-[#F3EFE7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F] dark:border-[#35302A] dark:bg-[#1E1B18] dark:text-[#EAE4D9] dark:hover:bg-[#2A2622] whitespace-nowrap shrink-0"
            >
              <Archive className="h-3.5 w-3.5 text-[#1E3A5F] dark:text-[#D4A373]" aria-hidden="true" />
              <span>Download App (.zip)</span>
            </button>
          )}

          <div className="inline-flex items-center rounded-lg border border-[#E2DDD3] bg-white/70 p-0.5 dark:border-[#35302A] dark:bg-[#1E1B18]">
            <button
              type="button"
              onClick={() => onSelectDay(Math.max(1, selectedDay - 1))}
              disabled={selectedDay <= 1}
              aria-label="Previous day"
              className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-md text-[#4A453E] transition-colors hover:bg-[#F3EFE7] disabled:opacity-40 dark:text-[#C8C0B4] dark:hover:bg-[#2A2622]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onSelectDay(todayDayNumber)}
              disabled={selectedDay === todayDayNumber}
              className="min-h-[38px] px-3 text-xs font-medium text-[#1C1917] transition-colors hover:bg-[#F3EFE7] disabled:text-[#8A5A2B] dark:text-[#EAE4D9] dark:hover:bg-[#2A2622] dark:disabled:text-[#D4A373] whitespace-nowrap shrink-0"
            >
              {selectedDay === todayDayNumber ? `Day ${selectedDay}` : 'Jump to Today'}
            </button>

            <button
              type="button"
              onClick={() => onSelectDay(Math.min(365, selectedDay + 1))}
              disabled={selectedDay >= 365}
              aria-label="Next day"
              className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-md text-[#4A453E] transition-colors hover:bg-[#F3EFE7] disabled:opacity-40 dark:text-[#C8C0B4] dark:hover:bg-[#2A2622]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Main 2-Column Editorial Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Ledger: 4 Daily Passages + Notes */}
        <aside
          className={`space-y-6 lg:col-span-4 lg:sticky lg:top-20 ${
            mobileReaderOpen ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="rounded-2xl border border-[#E5DFD5] bg-white/80 p-5 dark:border-[#2C2722] dark:bg-[#1A1714]">
            <div className="flex items-center justify-between border-b border-[#EAE4D9] pb-3 dark:border-[#2C2722]">
              <div>
                <h2 className="font-serif text-lg font-semibold text-[#1C1917] dark:text-[#EAE4D9]">
                  Daily Readings
                </h2>
                <p className="text-xs text-[#6B655E] dark:text-[#A39B8F] tabular-nums">
                  {dayCompletedCount} of {dayPlan.readings.length} completed
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggleDayAll(selectedDay)}
                className="min-h-[36px] rounded-lg border border-[#E2DDD3] px-3 py-1.5 text-xs font-medium text-[#4A453E] transition-colors hover:bg-[#F3EFE7] dark:border-[#35302A] dark:text-[#C8C0B4] dark:hover:bg-[#24201C] whitespace-nowrap shrink-0"
              >
                {isDayDone ? 'Unmark All' : 'Complete All'}
              </button>
            </div>

            {/* Family Track */}
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A5A2B] dark:text-[#D4A373]">
                Family Devotions
              </p>
              <div className="divide-y divide-[#EFEAE0] dark:divide-[#26211D]">
                {familyReadings.map((reading) => {
                  const idx = dayPlan.readings.findIndex((r) => r.id === reading.id);
                  const isDone = !!completedIds[reading.id];
                  const isSelected = activeReading.id === reading.id;
                  return (
                    <div
                      key={reading.id}
                      className={`flex items-center justify-between gap-2 py-2.5 transition-colors rounded-lg px-2 -mx-2 ${
                        isSelected
                          ? 'bg-[#1E3A5F]/6 dark:bg-[#D4A373]/10'
                          : 'hover:bg-[#F7F3EB] dark:hover:bg-[#231F1B]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleReading(reading.id)}
                        aria-label={isDone ? `Mark ${reading.label} unread` : `Mark ${reading.label} read`}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#1E3A5F] transition-transform active:scale-95 dark:text-[#D4A373] shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 text-[#14532D] dark:text-[#86EFAC]" />
                        ) : (
                          <Circle className="h-5 w-5 text-[#B5ADA2] dark:text-[#665E54]" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenReading(idx)}
                        className="flex min-h-[44px] flex-1 items-center justify-between gap-2 text-left"
                      >
                        <div>
                          <p
                            className={`font-serif text-base font-medium ${
                              isDone
                                ? 'text-[#6B655E] line-through decoration-[#B5ADA2] dark:text-[#8C8479]'
                                : 'text-[#1C1917] dark:text-[#EAE4D9]'
                            }`}
                          >
                            {reading.label}
                          </p>
                          <p className="text-xs text-[#6B655E] dark:text-[#A39B8F]">
                            {idx === 0 ? 'Old Testament' : 'New Testament'}
                          </p>
                        </div>
                        <BookOpenText
                          className={`h-4 w-4 shrink-0 ${
                            isSelected
                              ? 'text-[#1E3A5F] dark:text-[#D4A373]'
                              : 'text-[#A39B8F] dark:text-[#665E54]'
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Secret Track */}
            <div className="mt-5 border-t border-[#EAE4D9] pt-4 dark:border-[#2C2722]">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A5A2B] dark:text-[#D4A373]">
                Secret Devotions
              </p>
              <div className="divide-y divide-[#EFEAE0] dark:divide-[#26211D]">
                {secretReadings.map((reading) => {
                  const idx = dayPlan.readings.findIndex((r) => r.id === reading.id);
                  const isDone = !!completedIds[reading.id];
                  const isSelected = activeReading.id === reading.id;
                  return (
                    <div
                      key={reading.id}
                      className={`flex items-center justify-between gap-2 py-2.5 transition-colors rounded-lg px-2 -mx-2 ${
                        isSelected
                          ? 'bg-[#1E3A5F]/6 dark:bg-[#D4A373]/10'
                          : 'hover:bg-[#F7F3EB] dark:hover:bg-[#231F1B]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onToggleReading(reading.id)}
                        aria-label={isDone ? `Mark ${reading.label} unread` : `Mark ${reading.label} read`}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#1E3A5F] transition-transform active:scale-95 dark:text-[#D4A373] shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-5 w-5 text-[#14532D] dark:text-[#86EFAC]" />
                        ) : (
                          <Circle className="h-5 w-5 text-[#B5ADA2] dark:text-[#665E54]" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenReading(idx)}
                        className="flex min-h-[44px] flex-1 items-center justify-between gap-2 text-left"
                      >
                        <div>
                          <p
                            className={`font-serif text-base font-medium ${
                              isDone
                                ? 'text-[#6B655E] line-through decoration-[#B5ADA2] dark:text-[#8C8479]'
                                : 'text-[#1C1917] dark:text-[#EAE4D9]'
                            }`}
                          >
                            {reading.label}
                          </p>
                          <p className="text-xs text-[#6B655E] dark:text-[#A39B8F]">
                            {idx === 2 ? 'Chronicles & Prophets' : 'Psalms & Gospels'}
                          </p>
                        </div>
                        <BookOpenText
                          className={`h-4 w-4 shrink-0 ${
                            isSelected
                              ? 'text-[#1E3A5F] dark:text-[#D4A373]'
                              : 'text-[#A39B8F] dark:text-[#665E54]'
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile quick CTA to start reading */}
            <button
              type="button"
              onClick={() => setMobileReaderOpen(true)}
              className="mt-4 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#1E3A5F] px-4 py-2.5 text-xs font-medium text-[#FBF9F5] lg:hidden dark:bg-[#D4A373] dark:text-[#141210]"
            >
              <BookOpenText className="h-4 w-4" aria-hidden="true" />
              <span>Read {activeReading.label}</span>
            </button>
          </div>

          {/* Daily Reflection Notes (Saved Offline) */}
          <div className="rounded-2xl border border-[#E5DFD5] bg-white/80 p-5 dark:border-[#2C2722] dark:bg-[#1A1714]">
            <label
              htmlFor="daily-reflection-note"
              className="block font-serif text-base font-semibold text-[#1C1917] dark:text-[#EAE4D9]"
            >
              Reflection Notes · {dayPlan.shortDate}
            </label>
            <p className="mt-0.5 text-xs text-[#6B655E] dark:text-[#A39B8F]">
              Stored locally on your device for offline study
            </p>
            <textarea
              id="daily-reflection-note"
              rows={4}
              value={dayNote}
              onChange={(e) => onChangeDayNote(selectedDay, e.target.value)}
              placeholder="Write a prayer, cross-reference, or observation from today's four chapters..."
              className="mt-3 w-full rounded-xl border border-[#E2DDD3] bg-[#FBF9F5] px-3.5 py-2.5 text-sm leading-relaxed text-[#1C1917] placeholder:text-[#9A9288] focus:border-[#1E3A5F] focus:outline-none dark:border-[#35302A] dark:bg-[#141210] dark:text-[#EAE4D9] dark:placeholder:text-[#665E54] dark:focus:border-[#D4A373]"
            />
          </div>
        </aside>

        {/* Right Pane: Full Scripture Reader */}
        <div className={`lg:col-span-8 ${mobileReaderOpen ? 'block' : 'hidden lg:block'}`}>
          <ScriptureReader
            reading={activeReading}
            dayNumber={dayPlan.day}
            dateLabel={dayPlan.dateLabel}
            readingIndex={activeReadingIdx}
            totalReadingsInDay={dayPlan.readings.length}
            isCompleted={!!completedIds[activeReading.id]}
            onToggleComplete={() => onToggleReading(activeReading.id)}
            onCompleteAndNext={
              activeReadingIdx < dayPlan.readings.length - 1 ? handleCompleteAndNext : undefined
            }
            onPrevReading={
              activeReadingIdx > 0 ? () => setActiveReadingIdx(activeReadingIdx - 1) : undefined
            }
            onNextReading={
              activeReadingIdx < dayPlan.readings.length - 1
                ? () => setActiveReadingIdx(activeReadingIdx + 1)
                : undefined
            }
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
        </div>
      </div>
    </div>
  );
};
