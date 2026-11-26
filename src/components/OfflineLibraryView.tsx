import React, {useEffect, useRef, useState} from 'react';
import {
  Archive,
  CheckCircle2,
  Download,
  FilePlus2,
  HardDrive,
  RefreshCw,
  Trash2,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {useOnlineStatus} from '../hooks/useOnlineStatus';
import {
  cacheAllBooks,
  clearOfflineBookCache,
  getAllVersionCacheCounts,
  importCustomTranslationJson,
  removeCustomTranslation,
} from '../services/offlineBibleDb';
import type {BibleVersionMeta} from '../types/bible';
import {PWAInstallButton} from './PWAInstallButton';

interface OfflineLibraryViewProps {
  activeVersionId: string;
  versions: BibleVersionMeta[];
  onSelectVersion: (versionId: string) => void;
  onRefreshVersions: () => Promise<void>;
  scheduleMode: 'calendar' | 'custom';
  customStartDate: string;
  onChangeScheduleMode: (mode: 'calendar' | 'custom') => void;
  onChangeCustomStartDate: (date: string) => void;
  onExportBackup: () => string;
  onImportBackup: (json: string) => boolean;
  onResetProgress: () => void;
  onOpenExportZip: () => void;
  noteCount: number;
  stats: {
    completedReadings: number;
    completedDays: number;
  };
}

export const OfflineLibraryView: React.FC<OfflineLibraryViewProps> = ({
  activeVersionId,
  versions,
  onSelectVersion,
  onRefreshVersions,
  scheduleMode,
  customStartDate,
  onChangeScheduleMode,
  onChangeCustomStartDate,
  onExportBackup,
  onImportBackup,
  onResetProgress,
  onOpenExportZip,
  noteCount,
  stats,
}) => {
  const isOnline = useOnlineStatus();
  const [cacheCounts, setCacheCounts] = useState<Record<string, number>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [currentBook, setCurrentBook] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const [customShort, setCustomShort] = useState('');
  const [customFull, setCustomFull] = useState('');
  const [importingBible, setImportingBible] = useState(false);

  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const bibleJsonInputRef = useRef<HTMLInputElement | null>(null);

  const refreshCacheCounts = async () => {
    const counts = await getAllVersionCacheCounts();
    setCacheCounts(counts);
  };

  useEffect(() => {
    refreshCacheCounts();
  }, [versions]);

  const handleDownloadVersion = async (versionId: string, shortName: string) => {
    setDownloadingId(versionId);
    setStatusMessage(null);
    try {
      const totalCached = await cacheAllBooks(versionId, (loaded, _total, name) => {
        setCacheCounts((prev) => ({...prev, [versionId]: loaded}));
        setCurrentBook(name);
      });
      setCacheCounts((prev) => ({...prev, [versionId]: totalCached}));
      setStatusMessage(`${shortName} (all 66 books) is now saved locally for offline reading.`);
    } catch {
      setStatusMessage(
        `Could not finish caching ${shortName} while offline. Reconnect briefly to complete.`
      );
    } finally {
      setDownloadingId(null);
      setCurrentBook('');
    }
  };

  const handleClearVersionCache = async (versionId: string, shortName: string) => {
    await clearOfflineBookCache(versionId);
    await refreshCacheCounts();
    setStatusMessage(`Cleared cached books for ${shortName}.`);
  };

  const handleRemoveCustom = async (versionId: string, shortName: string) => {
    await removeCustomTranslation(versionId);
    if (activeVersionId === versionId) {
      onSelectVersion('bsb');
    }
    await onRefreshVersions();
    await refreshCacheCounts();
    setStatusMessage(`Removed custom translation ${shortName}.`);
  };

  const handleBibleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingBible(true);
    setStatusMessage(null);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const derivedShort =
          customShort.trim() || file.name.replace(/\.json$/i, '').slice(0, 10).toUpperCase();
        const derivedFull = customFull.trim() || `${derivedShort} (Personal Offline Import)`;
        const created = await importCustomTranslationJson(
          derivedShort,
          derivedFull,
          String(reader.result || '')
        );
        await onRefreshVersions();
        await refreshCacheCounts();
        onSelectVersion(created.id);
        setCustomShort('');
        setCustomFull('');
        setStatusMessage(`Imported ${created.shortName} locally to IndexedDB and set as active.`);
      } catch (err: unknown) {
        setStatusMessage(
          err instanceof Error ? err.message : 'Failed to parse Bible JSON file.'
        );
      } finally {
        setImportingBible(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    const json = onExportBackup();
    const blob = new Blob([json], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-bread-mcheyne-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Backup exported to your downloads folder.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = onImportBackup(String(reader.result || ''));
      setStatusMessage(
        ok ? 'Progress, highlights, and notes restored.' : 'Invalid backup file format.'
      );
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="border-b border-[#E5DFD5] pb-5 dark:border-[#2C2722]">
        <p className="text-xs font-medium text-[#6B655E] dark:text-[#A39B8F]">
          Offline Translations · Progressive Web App · Plan Settings
        </p>
        <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl dark:text-[#EAE4D9] [text-wrap:balance]">
          Offline Library &amp; Preferences
        </h1>
      </section>

      {statusMessage && (
        <div
          role="status"
          className="rounded-xl border border-[#1E3A5F]/20 bg-[#1E3A5F]/6 px-4 py-3 text-sm text-[#1E3A5F] dark:border-[#D4A373]/30 dark:bg-[#D4A373]/10 dark:text-[#D4A373]"
        >
          {statusMessage}
        </div>
      )}

      {!window.__DAILY_BREAD_PORTABLE__ && (
        <section className="rounded-2xl border border-[#1E3A5F]/25 bg-white p-6 dark:border-[#D4A373]/30 dark:bg-[#1E1B18]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A5A2B] dark:text-[#D4A373]">
                Portable Multi-Device Package
              </p>
              <h2 className="mt-1 font-serif text-xl font-semibold text-[#1C1917] dark:text-[#EAE4D9]">
                Download Entire Offline App (.zip)
              </h2>
              <p className="mt-1 max-w-xl text-sm text-[#6B655E] dark:text-[#A39B8F]">
                Package the entire web app, your chosen Bible translations, and all{' '}
                <strong className="font-semibold text-[#1C1917] dark:text-[#EAE4D9] tabular-nums">
                  {noteCount} reflection {noteCount === 1 ? 'note' : 'notes'}
                </strong>{' '}
                and progress into a ZIP file that works on phones, tablets, and computers with zero
                internet connection.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenExportZip}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#1E3A5F] px-5 py-2.5 text-xs font-medium text-[#FBF9F5] transition-colors hover:bg-[#162C49] dark:bg-[#D4A373] dark:text-[#141210] dark:hover:bg-[#C28F5E] whitespace-nowrap shrink-0"
            >
              <Archive className="h-4 w-4" aria-hidden="true" />
              <span>Download App (.zip)</span>
            </button>
          </div>
        </section>
      )}

      {/* Offline Translations Manager */}
      <section className="rounded-2xl border border-[#E5DFD5] bg-white/80 p-6 dark:border-[#2C2722] dark:bg-[#1A1714]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE4D9] pb-4 dark:border-[#2C2722]">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#6B655E] dark:text-[#A39B8F]">
              {isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-[#14532D] dark:text-[#86EFAC]" aria-hidden="true" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-[#8A5A2B] dark:text-[#D4A373]" aria-hidden="true" />
                  <span>Offline Mode Active</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>IndexedDB &amp; Service Worker Cache</span>
            </div>
            <h2 className="mt-1.5 font-serif text-xl font-semibold text-[#1C1917] dark:text-[#EAE4D9]">
              Bible Translations for Offline Reading
            </h2>
          </div>
        </div>

        <div className="mt-4 divide-y divide-[#EFEAE0] dark:divide-[#26211D]">
          {versions.map((v) => {
            const count = cacheCounts[v.id] ?? 0;
            const pct = Math.round((count / 66) * 100);
            const isBusy = downloadingId === v.id;
            const isActive = activeVersionId === v.id;

            return (
              <div key={v.id} className="py-4 first:pt-1 last:pb-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-sans text-sm font-bold text-[#1E3A5F] dark:text-[#D4A373]">
                        {v.shortName}
                      </span>
                      <span className="font-serif text-base font-semibold text-[#1C1917] dark:text-[#EAE4D9]">
                        {v.fullName}
                      </span>
                      {isActive && (
                        <span className="text-xs font-medium text-[#14532D] dark:text-[#86EFAC]">
                          · Active
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[#6B655E] dark:text-[#A39B8F]">
                      {v.styleNote} · {v.closestModernNote}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => onSelectVersion(v.id)}
                        className="min-h-[38px] rounded-lg border border-[#E2DDD3] px-3 py-1.5 text-xs font-medium text-[#1C1917] hover:bg-[#F3EFE7] dark:border-[#35302A] dark:text-[#EAE4D9] dark:hover:bg-[#24201C]"
                      >
                        Set Active
                      </button>
                    )}

                    {!v.isCustom ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDownloadVersion(v.id, v.shortName)}
                          disabled={isBusy || count === 66}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#1E3A5F] px-3.5 py-1.5 text-xs font-medium text-[#FBF9F5] hover:bg-[#162C49] disabled:opacity-60 dark:bg-[#D4A373] dark:text-[#141210] dark:hover:bg-[#C28F5E] whitespace-nowrap"
                        >
                          {count === 66 ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>66/66 Cached</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw
                                className={`h-3.5 w-3.5 ${isBusy ? 'animate-spin' : ''}`}
                                aria-hidden="true"
                              />
                              <span>
                                {isBusy
                                  ? `${currentBook || '...'} (${count}/66)`
                                  : `Download (${count}/66)`}
                              </span>
                            </>
                          )}
                        </button>

                        {count > 0 && (
                          <button
                            type="button"
                            onClick={() => handleClearVersionCache(v.id, v.shortName)}
                            disabled={isBusy}
                            aria-label={`Clear ${v.shortName} cache`}
                            className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-[#E2DDD3] px-2.5 py-1.5 text-xs text-[#6B655E] hover:bg-[#F3EFE7] dark:border-[#35302A] dark:text-[#A39B8F] dark:hover:bg-[#24201C]"
                          >
                            <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
                            Clear
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemoveCustom(v.id, v.shortName)}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#E2DDD3] px-3 py-1.5 text-xs font-medium text-[#9A3412] hover:bg-[#9A3412]/8 dark:border-[#35302A] dark:text-[#FCA5A5]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#EFEAE0] dark:bg-[#2A2622]">
                  <div
                    className="h-full rounded-full bg-[#1E3A5F] transition-all duration-300 dark:bg-[#D4A373]"
                    style={{width: `${Math.min(100, pct)}%`}}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Local Personal JSON Translation Import */}
        <div className="mt-6 border-t border-[#EAE4D9] pt-5 dark:border-[#2C2722]">
          <h3 className="font-serif text-lg font-semibold text-[#1C1917] dark:text-[#EAE4D9]">
            Import Personal Offline Translation (JSON)
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-[#6B655E] dark:text-[#A39B8F]">
            Copyrighted translations (NKJV, ESV, NASB 1995, NIV) cannot be pre-bundled, but if you
            hold a personal JSON file on your device, you can import it directly into local browser
            storage (never uploaded anywhere).
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={customShort}
              onChange={(e) => setCustomShort(e.target.value)}
              placeholder="Abbreviation (e.g. ESV)"
              maxLength={12}
              className="min-h-[40px] w-full rounded-lg border border-[#E2DDD3] bg-[#FBF9F5] px-3 py-1.5 text-xs text-[#1C1917] sm:w-40 dark:border-[#35302A] dark:bg-[#141210] dark:text-[#EAE4D9]"
            />
            <input
              type="text"
              value={customFull}
              onChange={(e) => setCustomFull(e.target.value)}
              placeholder="Full Name (optional)"
              className="min-h-[40px] flex-1 rounded-lg border border-[#E2DDD3] bg-[#FBF9F5] px-3 py-1.5 text-xs text-[#1C1917] dark:border-[#35302A] dark:bg-[#141210] dark:text-[#EAE4D9]"
            />
            <button
              type="button"
              disabled={importingBible}
              onClick={() => bibleJsonInputRef.current?.click()}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-[#E2DDD3] bg-white px-4 py-2 text-xs font-medium text-[#1C1917] hover:bg-[#F3EFE7] dark:border-[#35302A] dark:bg-[#141210] dark:text-[#EAE4D9] dark:hover:bg-[#24201C] whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" />
              {importingBible ? 'Importing...' : 'Choose Bible JSON'}
            </button>
            <input
              ref={bibleJsonInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleBibleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </section>

      {/* Install App & Plan Schedule Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-[#E5DFD5] bg-white/80 p-6 dark:border-[#2C2722] dark:bg-[#1A1714]">
          <h2 className="font-serif text-xl font-semibold text-[#1C1917] dark:text-[#EAE4D9]">
            Install on Device
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#6B655E] dark:text-[#A39B8F]">
            Install Daily Bread to your phone, tablet, or desktop home screen to launch directly
            into today&apos;s four readings without browser bars.
          </p>
          <div className="mt-4">
            <PWAInstallButton variant="card" />
          </div>
        </section>

        <section className="rounded-2xl border border-[#E5DFD5] bg-white/80 p-6 dark:border-[#2C2722] dark:bg-[#1A1714]">
          <h2 className="font-serif text-xl font-semibold text-[#1C1917] dark:text-[#EAE4D9]">
            Reading Schedule Alignment
          </h2>
          <p className="mt-1 text-sm text-[#6B655E] dark:text-[#A39B8F]">
            Follow M&apos;Cheyne&apos;s classic calendar dates or set your own Day 1 start date.
          </p>

          <div className="mt-4 space-y-3">
            <div className="inline-flex rounded-lg border border-[#E2DDD3] bg-[#F3EFE7] p-0.5 dark:border-[#35302A] dark:bg-[#141210]">
              <button
                type="button"
                onClick={() => onChangeScheduleMode('calendar')}
                className={`min-h-[38px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  scheduleMode === 'calendar'
                    ? 'bg-white text-[#1C1917] shadow-xs dark:bg-[#2C2722] dark:text-[#EAE4D9]'
                    : 'text-[#6B655E] dark:text-[#A39B8F]'
                }`}
              >
                Calendar Year (Jan 1 = Day 1)
              </button>
              <button
                type="button"
                onClick={() => onChangeScheduleMode('custom')}
                className={`min-h-[38px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  scheduleMode === 'custom'
                    ? 'bg-white text-[#1C1917] shadow-xs dark:bg-[#2C2722] dark:text-[#EAE4D9]'
                    : 'text-[#6B655E] dark:text-[#A39B8F]'
                }`}
              >
                Custom Start Date
              </button>
            </div>

            {scheduleMode === 'custom' && (
              <div>
                <label
                  htmlFor="custom-start-date"
                  className="block text-xs font-medium text-[#6B655E] dark:text-[#A39B8F]"
                >
                  Day 1 Start Date
                </label>
                <input
                  id="custom-start-date"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => onChangeCustomStartDate(e.target.value)}
                  className="mt-1.5 min-h-[40px] rounded-lg border border-[#E2DDD3] bg-[#FBF9F5] px-3 py-1.5 text-sm text-[#1C1917] dark:border-[#35302A] dark:bg-[#141210] dark:text-[#EAE4D9]"
                />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Backup, Restore & Reset */}
      <section className="rounded-2xl border border-[#E5DFD5] bg-white/80 p-6 dark:border-[#2C2722] dark:bg-[#1A1714]">
        <h2 className="font-serif text-xl font-semibold text-[#1C1917] dark:text-[#EAE4D9]">
          Local Progress Backup
        </h2>
        <p className="mt-1 text-sm text-[#6B655E] dark:text-[#A39B8F] tabular-nums">
          Currently tracking {stats.completedReadings} completed readings across{' '}
          {stats.completedDays} full days, plus all highlights and reflection notes locally.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#E2DDD3] bg-[#FBF9F5] px-4 py-2 text-xs font-medium text-[#1C1917] hover:bg-[#EFEAE0] dark:border-[#35302A] dark:bg-[#141210] dark:text-[#EAE4D9] dark:hover:bg-[#24201C]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Export Backup JSON
          </button>

          <button
            type="button"
            onClick={() => backupInputRef.current?.click()}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#E2DDD3] bg-[#FBF9F5] px-4 py-2 text-xs font-medium text-[#1C1917] hover:bg-[#EFEAE0] dark:border-[#35302A] dark:bg-[#141210] dark:text-[#EAE4D9] dark:hover:bg-[#24201C]"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            Import Backup JSON
          </button>
          <input
            ref={backupInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFile}
            className="hidden"
          />

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#E2DDD3] px-4 py-2 text-xs font-medium text-[#9A3412] hover:bg-[#9A3412]/8 dark:border-[#35302A] dark:text-[#FCA5A5] dark:hover:bg-[#9A3412]/20"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Reset Reading Progress
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onResetProgress();
                  setConfirmReset(false);
                  setStatusMessage('Reading progress, highlights, and notes have been reset.');
                }}
                className="min-h-[42px] rounded-lg bg-[#9A3412] px-4 py-2 text-xs font-medium text-white hover:bg-[#7C2D12]"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="min-h-[42px] rounded-lg border border-[#E2DDD3] px-3 py-2 text-xs font-medium text-[#6B655E] hover:bg-[#F3EFE7] dark:border-[#35302A] dark:text-[#A39B8F]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
