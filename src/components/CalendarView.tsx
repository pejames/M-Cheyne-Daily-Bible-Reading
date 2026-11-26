import React, {useMemo, useState} from 'react';
import {Check, CheckCircle2, Circle} from 'lucide-react';
import {MCHEYNE_PLAN, MONTH_NAMES, getDayByNumber} from '../data/planHelpers';

interface CalendarViewProps {
  todayDayNumber: number;
  selectedDay: number;
  completedIds: Record<string, string>;
  onOpenDay: (dayNumber: number) => void;
  onToggleDayAll: (dayNumber: number) => void;
  stats: {
    completedReadings: number;
    totalReadings: number;
    completedDays: number;
    familyCompleted: number;
    secretCompleted: number;
    streak: number;
    percentYear: number;
  };
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  todayDayNumber,
  selectedDay,
  completedIds,
  onOpenDay,
  onToggleDayAll,
  stats,
}) => {
  const initialMonth = useMemo(() => {
    const dayObj = getDayByNumber(selectedDay);
    return Math.max(0, parseInt(dayObj.mmdd.slice(0, 2), 10) - 1);
  }, [selectedDay]);

  const [monthIdx, setMonthIdx] = useState(initialMonth);
  const [filter, setFilter] = useState<'all' | 'remaining' | 'completed'>('all');

  const monthPrefix = String(monthIdx + 1).padStart(2, '0');

  const monthDays = useMemo(() => {
    return MCHEYNE_PLAN.filter((d) => d.mmdd.startsWith(monthPrefix)).filter((d) => {
      const doneCount = d.readings.filter((r) => !!completedIds[r.id]).length;
      if (filter === 'completed') return doneCount === d.readings.length;
      if (filter === 'remaining') return doneCount < d.readings.length;
      return true;
    });
  }, [monthPrefix, filter, completedIds]);

  return (
    <div className="space-y-6">
      {/* Header & Annual Progress Summary */}
      <section className="border-b border-[#E5DFD5] pb-6 dark:border-[#2C2722]">
        <p className="text-xs font-medium text-[#6B655E] dark:text-[#A39B8F]">
          365-Day Schedule · Old Testament once · New Testament &amp; Psalms twice
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl dark:text-[#EAE4D9] [text-wrap:balance]">
          Annual Reading Calendar
        </h1>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-[#E5DFD5] bg-white/80 p-4 dark:border-[#2C2722] dark:bg-[#1A1714]">
            <p className="text-xs text-[#6B655E] dark:text-[#A39B8F]">Year Progress</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-[#1C1917] dark:text-[#EAE4D9] tabular-nums">
              {stats.percentYear}%
            </p>
            <p className="mt-0.5 text-xs text-[#6B655E] dark:text-[#A39B8F] tabular-nums">
              {stats.completedReadings} / {stats.totalReadings} chapters
            </p>
          </div>

          <div className="rounded-xl border border-[#E5DFD5] bg-white/80 p-4 dark:border-[#2C2722] dark:bg-[#1A1714]">
            <p className="text-xs text-[#6B655E] dark:text-[#A39B8F]">Completed Days</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-[#1C1917] dark:text-[#EAE4D9] tabular-nums">
              {stats.completedDays} <span className="text-base font-normal text-[#6B655E]">/ 365</span>
            </p>
            <p className="mt-0.5 text-xs text-[#6B655E] dark:text-[#A39B8F] tabular-nums">
              {stats.streak}-day active streak
            </p>
          </div>

          <div className="rounded-xl border border-[#E5DFD5] bg-white/80 p-4 dark:border-[#2C2722] dark:bg-[#1A1714]">
            <p className="text-xs text-[#6B655E] dark:text-[#A39B8F]">Family Track</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-[#1C1917] dark:text-[#EAE4D9] tabular-nums">
              {stats.familyCompleted} <span className="text-base font-normal text-[#6B655E]">/ 730</span>
            </p>
            <p className="mt-0.5 text-xs text-[#6B655E] dark:text-[#A39B8F]">Gen–2 Chr &amp; NT</p>
          </div>

          <div className="rounded-xl border border-[#E5DFD5] bg-white/80 p-4 dark:border-[#2C2722] dark:bg-[#1A1714]">
            <p className="text-xs text-[#6B655E] dark:text-[#A39B8F]">Secret Track</p>
            <p className="mt-1 font-serif text-2xl font-semibold text-[#1C1917] dark:text-[#EAE4D9] tabular-nums">
              {stats.secretCompleted} <span className="text-base font-normal text-[#6B655E]">/ 730</span>
            </p>
            <p className="mt-0.5 text-xs text-[#6B655E] dark:text-[#A39B8F]">Prophets, Psalms &amp; Gospels</p>
          </div>
        </div>
      </section>

      {/* Month Switcher & Filter Bar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="Select month">
          {MONTH_NAMES.map((name, idx) => {
            const active = monthIdx === idx;
            return (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMonthIdx(idx)}
                className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#1E3A5F] text-[#FBF9F5] dark:bg-[#D4A373] dark:text-[#141210]'
                    : 'text-[#6B655E] hover:bg-[#EFEAE0] hover:text-[#1C1917] dark:text-[#A39B8F] dark:hover:bg-[#24201C] dark:hover:text-[#EAE4D9]'
                }`}
              >
                {name.slice(0, 3)}
              </button>
            );
          })}
        </div>

        <div className="inline-flex self-start rounded-lg border border-[#E2DDD3] bg-[#F3EFE7] p-0.5 dark:border-[#35302A] dark:bg-[#1E1B18]">
          {(['all', 'remaining', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap shrink-0 ${
                filter === tab
                  ? 'bg-white text-[#1C1917] shadow-xs dark:bg-[#2C2722] dark:text-[#EAE4D9]'
                  : 'text-[#6B655E] hover:text-[#1C1917] dark:text-[#A39B8F] dark:hover:text-[#EAE4D9]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Month Days Grid */}
      {monthDays.length === 0 ? (
        <div className="rounded-2xl border border-[#E5DFD5] bg-white/80 p-10 text-center dark:border-[#2C2722] dark:bg-[#1A1714]">
          <p className="font-serif text-lg font-medium text-[#1C1917] dark:text-[#EAE4D9]">
            No {filter} days in {MONTH_NAMES[monthIdx]}
          </p>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className="mt-3 min-h-[40px] rounded-lg border border-[#E2DDD3] px-4 py-2 text-xs font-medium text-[#1C1917] hover:bg-[#F3EFE7] dark:border-[#35302A] dark:text-[#EAE4D9] dark:hover:bg-[#24201C]"
          >
            Show All Days
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {monthDays.map((dayObj) => {
            const doneCount = dayObj.readings.filter((r) => !!completedIds[r.id]).length;
            const isComplete = doneCount === dayObj.readings.length;
            const isToday = dayObj.day === todayDayNumber;

            return (
              <div
                key={dayObj.day}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                  isToday
                    ? 'border-[#1E3A5F] bg-white dark:border-[#D4A373] dark:bg-[#1E1B18]'
                    : 'border-[#E5DFD5] bg-white/80 dark:border-[#2C2722] dark:bg-[#1A1714]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-[#EFEAE0] pb-2.5 dark:border-[#26211D]">
                    <button
                      type="button"
                      onClick={() => onOpenDay(dayObj.day)}
                      className="text-left group"
                    >
                      <span className="font-serif text-base font-semibold text-[#1C1917] group-hover:text-[#1E3A5F] dark:text-[#EAE4D9] dark:group-hover:text-[#D4A373]">
                        {dayObj.dateLabel}
                      </span>
                      <span className="ml-2 text-xs text-[#6B655E] dark:text-[#A39B8F] tabular-nums">
                        Day {dayObj.day}
                        {isToday ? ' · Today' : ''}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleDayAll(dayObj.day)}
                      aria-label={
                        isComplete
                          ? `Unmark Day ${dayObj.day}`
                          : `Mark all 4 readings for Day ${dayObj.day} complete`
                      }
                      className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg hover:bg-[#F3EFE7] dark:hover:bg-[#2A2622]"
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-[#14532D] dark:text-[#86EFAC]" />
                      ) : (
                        <Circle className="h-4.5 w-4.5 text-[#B5ADA2] dark:text-[#665E54]" />
                      )}
                    </button>
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    {dayObj.readings.map((r) => {
                      const rDone = !!completedIds[r.id];
                      return (
                        <li
                          key={r.id}
                          className={`flex items-center justify-between gap-2 text-xs ${
                            rDone
                              ? 'text-[#6B655E] line-through decoration-[#B5ADA2] dark:text-[#8C8479]'
                              : 'text-[#292524] dark:text-[#D6CFC5]'
                          }`}
                        >
                          <span className="truncate">{r.label}</span>
                          {rDone && (
                            <Check
                              className="h-3 w-3 shrink-0 text-[#14532D] dark:text-[#86EFAC]"
                              aria-label="Read"
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#EFEAE0] pt-2.5 dark:border-[#26211D]">
                  <span className="text-xs text-[#6B655E] dark:text-[#A39B8F] tabular-nums">
                    {doneCount} / 4 read
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenDay(dayObj.day)}
                    className="min-h-[36px] rounded-md px-2.5 py-1 text-xs font-medium text-[#1E3A5F] hover:bg-[#1E3A5F]/8 dark:text-[#D4A373] dark:hover:bg-[#D4A373]/12 whitespace-nowrap shrink-0"
                  >
                    Open Reading
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
