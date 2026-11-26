import {useCallback, useEffect, useState} from 'react';
import {BibleBrowserView} from './components/BibleBrowserView';
import {BookPlanView} from './components/BookPlanView';
import {CalendarView} from './components/CalendarView';
import {ExportOfflineZipModal} from './components/ExportOfflineZipModal';
import {MobileNav} from './components/MobileNav';
import {OfflineIndicator} from './components/OfflineIndicator';
import {OfflineLibraryView} from './components/OfflineLibraryView';
import {TodayView} from './components/TodayView';
import {TopBar, type AppTab} from './components/TopBar';
import {VersionSelectorModal} from './components/VersionSelectorModal';
import {useReadingStore} from './hooks/useReadingStore';
import {
  BUILT_IN_VERSIONS,
  cacheAllBooks,
  getAvailableVersions,
  getCachedBookSlugs,
} from './services/offlineBibleDb';
import type {BibleVersionMeta} from './types/bible';

export default function App() {
  const {
    state,
    todayDayNumber,
    stats,
    toggleReading,
    markReadingComplete,
    toggleDayAll,
    toggleManyReadings,
    setDayNote,
    toggleVerseHighlight,
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
  } = useReadingStore();

  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [selectedDay, setSelectedDay] = useState<number>(todayDayNumber);
  const [versions, setVersions] = useState<BibleVersionMeta[]>(BUILT_IN_VERSIONS);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [exportZipOpen, setExportZipOpen] = useState(false);

  const noteCount = Object.keys(state.notes).filter((k) => state.notes[Number(k)]?.trim()).length;

  const refreshVersions = useCallback(async () => {
    const list = await getAvailableVersions();
    setVersions(list);
  }, []);

  useEffect(() => {
    refreshVersions();
  }, [refreshVersions]);

  // Silently warm the active translation in IndexedDB when online
  useEffect(() => {
    if (!navigator.onLine) return;
    const isBuiltIn = BUILT_IN_VERSIONS.some((v) => v.id === state.translation);
    if (!isBuiltIn) return;
    const timer = window.setTimeout(async () => {
      try {
        const cached = await getCachedBookSlugs(state.translation);
        if (cached.size < 66) {
          await cacheAllBooks(state.translation);
        }
      } catch {
        // Silent background warmup
      }
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [state.translation]);

  const handleOpenDayFromCalendar = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    setActiveTab('today');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1917] dark:bg-[#141210] dark:text-[#EAE4D9]">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        theme={state.theme}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-12">
        {activeTab === 'today' && (
          <TodayView
            selectedDay={selectedDay}
            todayDayNumber={todayDayNumber}
            onSelectDay={setSelectedDay}
            completedIds={state.completedIds}
            onToggleReading={toggleReading}
            onMarkReadingComplete={markReadingComplete}
            onToggleDayAll={toggleDayAll}
            dayNote={state.notes[selectedDay] ?? ''}
            onChangeDayNote={setDayNote}
            versionId={state.translation}
            compareVersionId={state.compareTranslation}
            versions={versions}
            onOpenVersionModal={() => setVersionModalOpen(true)}
            onOpenExportZip={() => setExportZipOpen(true)}
            fontSize={state.fontSize}
            onChangeFontSize={setFontSize}
            verseNumbers={state.verseNumbers}
            onToggleVerseNumbers={toggleVerseNumbers}
            paragraphMode={state.paragraphMode}
            onToggleParagraphMode={toggleParagraphMode}
            highlights={state.highlights}
            onToggleHighlight={toggleVerseHighlight}
            stats={stats}
          />
        )}

        {activeTab === 'books' && (
          <BookPlanView
            completedIds={state.completedIds}
            onToggleReading={toggleReading}
            onMarkReadingComplete={markReadingComplete}
            onToggleManyReadings={toggleManyReadings}
            versionId={state.translation}
            compareVersionId={state.compareTranslation}
            versions={versions}
            onOpenVersionModal={() => setVersionModalOpen(true)}
            fontSize={state.fontSize}
            onChangeFontSize={setFontSize}
            verseNumbers={state.verseNumbers}
            onToggleVerseNumbers={toggleVerseNumbers}
            paragraphMode={state.paragraphMode}
            onToggleParagraphMode={toggleParagraphMode}
            highlights={state.highlights}
            onToggleHighlight={toggleVerseHighlight}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            todayDayNumber={todayDayNumber}
            selectedDay={selectedDay}
            completedIds={state.completedIds}
            onOpenDay={handleOpenDayFromCalendar}
            onToggleDayAll={toggleDayAll}
            stats={stats}
          />
        )}

        {activeTab === 'bible' && (
          <BibleBrowserView
            versionId={state.translation}
            versions={versions}
            onOpenVersionModal={() => setVersionModalOpen(true)}
            fontSize={state.fontSize}
            verseNumbers={state.verseNumbers}
            paragraphMode={state.paragraphMode}
            highlights={state.highlights}
            onToggleHighlight={toggleVerseHighlight}
          />
        )}

        {activeTab === 'offline' && (
          <OfflineLibraryView
            activeVersionId={state.translation}
            versions={versions}
            onSelectVersion={setTranslation}
            onRefreshVersions={refreshVersions}
            scheduleMode={state.scheduleMode}
            customStartDate={state.customStartDate}
            onChangeScheduleMode={setScheduleMode}
            onChangeCustomStartDate={setCustomStartDate}
            onExportBackup={exportBackupJson}
            onImportBackup={importBackupJson}
            onResetProgress={resetProgress}
            onOpenExportZip={() => setExportZipOpen(true)}
            noteCount={noteCount}
            stats={stats}
          />
        )}
      </main>

      <VersionSelectorModal
        isOpen={versionModalOpen}
        onClose={() => setVersionModalOpen(false)}
        activeVersionId={state.translation}
        compareVersionId={state.compareTranslation}
        onSelectVersion={setTranslation}
        onSelectCompareVersion={setCompareTranslation}
        onOpenOfflineTab={() => setActiveTab('offline')}
      />

      <ExportOfflineZipModal
        isOpen={exportZipOpen}
        onClose={() => setExportZipOpen(false)}
        state={state}
        versions={versions}
      />

      <MobileNav activeTab={activeTab} onSelectTab={setActiveTab} />
      <OfflineIndicator />
    </div>
  );
}
