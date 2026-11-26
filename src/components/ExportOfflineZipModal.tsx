import React, {useEffect, useState} from 'react';
import {Archive, Check, CheckCircle2, X} from 'lucide-react';
import {exportOfflineAppZip, type ExportZipResult} from '../services/exportOfflineZip';
import type {BibleVersionMeta, UserReadingState} from '../types/bible';

interface ExportOfflineZipModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: UserReadingState;
  versions: BibleVersionMeta[];
}

export const ExportOfflineZipModal: React.FC<ExportOfflineZipModalProps> = ({
  isOpen,
  onClose,
  state,
  versions,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([state.translation]);
  const [exporting, setExporting] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [progressPct, setProgressPct] = useState(0);
  const [result, setResult] = useState<ExportZipResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const defaults = Array.from(
        new Set(
          [state.translation, state.compareTranslation].filter(
            (v): v is string => !!v
          )
        )
      );
      setSelectedIds(defaults.length > 0 ? defaults : ['bsb']);
      setResult(null);
      setError(null);
      setProgressPct(0);
      setProgressStage('');
    }
  }, [isOpen, state.translation, state.compareTranslation]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !exporting) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, exporting, onClose]);

  if (!isOpen) return null;

  const noteCount = Object.keys(state.notes).filter((k) => state.notes[Number(k)]?.trim()).length;
  const completedCount = Object.keys(state.completedIds).length;
  const highlightCount = Object.keys(state.highlights).length;

  const toggleVersion = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // keep at least 1 translation
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  const handleDownloadZip = async () => {
    setExporting(true);
    setError(null);
    setResult(null);
    try {
      const res = await exportOfflineAppZip({
        state,
        versions,
        versionIdsToBundle: selectedIds,
        onProgress: (stage, pct) => {
          setProgressStage(stage);
          setProgressPct(pct);
        },
      });
      setResult(res);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Unable to build offline ZIP archive.'
      );
    } finally {
      setExporting(false);
    }
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-zip-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !exporting) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-5 shadow-2xl sm:p-6 dark:border-[#35302A] dark:bg-[#1A1714]">
        <div className="flex items-start justify-between gap-4 border-b border-[#EAE4D9] pb-4 dark:border-[#2C2722]">
          <div>
            <h2
              id="export-zip-title"
              className="font-serif text-2xl font-semibold text-[#1C1917] dark:text-[#EAE4D9]"
            >
              Download Offline App (.zip)
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#6B655E] dark:text-[#A39B8F]">
              Creates a standalone <code className="font-mono">Daily-Bread-Offline.html</code>{' '}
              inside a ZIP file that opens on phones, tablets, and computers with zero internet.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            aria-label="Close download modal"
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-[#6B655E] hover:bg-[#EFEAE0] hover:text-[#1C1917] disabled:opacity-40 dark:text-[#A39B8F] dark:hover:bg-[#2A2622] dark:hover:text-[#EAE4D9]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary of User Notes & Progress Included */}
        <div className="mt-4 rounded-xl border border-[#E5DFD5] bg-white/80 p-4 dark:border-[#2C2722] dark:bg-[#141210]">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A5A2B] dark:text-[#D4A373]">
            Included Personal Data
          </p>
          <p className="mt-1.5 text-sm text-[#1C1917] dark:text-[#EAE4D9] tabular-nums">
            {noteCount} reflection {noteCount === 1 ? 'note' : 'notes'} · {completedCount} completed{' '}
            {completedCount === 1 ? 'reading' : 'readings'} · {highlightCount} verse{' '}
            {highlightCount === 1 ? 'highlight' : 'highlights'}
          </p>
          <p className="mt-1 text-xs text-[#6B655E] dark:text-[#A39B8F]">
            All reflection notes, highlights, and plan progress are automatically transferred inside
            the downloaded file.
          </p>
        </div>

        {/* Select Bible Translations to Bundle */}
        <div className="mt-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A5A2B] dark:text-[#D4A373]">
              Choose Bible Translations to Include
            </p>
            <button
              type="button"
              disabled={exporting}
              onClick={() => setSelectedIds(versions.map((v) => v.id))}
              className="text-xs font-medium text-[#1E3A5F] hover:underline dark:text-[#D4A373]"
            >
              Select All ({versions.length})
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {versions.map((v) => {
              const checked = selectedIds.includes(v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={exporting}
                  onClick={() => toggleVersion(v.id)}
                  className={`flex min-h-[48px] items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                    checked
                      ? 'border-[#1E3A5F] bg-[#1E3A5F]/6 dark:border-[#D4A373] dark:bg-[#D4A373]/12'
                      : 'border-[#E2DDD3] bg-white/60 hover:bg-[#F3EFE7] dark:border-[#35302A] dark:bg-[#141210] dark:hover:bg-[#231F1B]'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1E3A5F] dark:text-[#D4A373]">
                      {v.shortName}
                    </p>
                    <p className="truncate text-xs text-[#4A453E] dark:text-[#C8C0B4]">
                      {v.fullName}
                    </p>
                  </div>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      checked
                        ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white dark:border-[#D4A373] dark:bg-[#D4A373] dark:text-[#141210]'
                        : 'border-[#C8C0B4] dark:border-[#4A453E]'
                    }`}
                  >
                    {checked && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-[#6B655E] dark:text-[#A39B8F] tabular-nums">
            Estimated ZIP size: ~{(selectedIds.length * 1.4 + 0.2).toFixed(1)} MB
          </p>
        </div>

        {/* Progress / Status */}
        {exporting && (
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#4A453E] dark:text-[#C8C0B4]">
              <span>{progressStage}</span>
              <span className="tabular-nums font-medium">{progressPct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#EFEAE0] dark:bg-[#2A2622]">
              <div
                className="h-full rounded-full bg-[#1E3A5F] transition-all duration-200 dark:bg-[#D4A373]"
                style={{width: `${progressPct}%`}}
              />
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-[#9A3412]/30 bg-[#9A3412]/8 px-3.5 py-2.5 text-xs text-[#9A3412] dark:text-[#FCA5A5]">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-4 rounded-xl border border-[#14532D]/25 bg-[#14532D]/8 p-4 text-xs leading-relaxed text-[#14532D] dark:border-[#4ADE80]/30 dark:bg-[#4ADE80]/12 dark:text-[#86EFAC]">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Downloaded {result.filename} ({formatSize(result.sizeBytes)})
              </span>
            </div>
            <p className="mt-1.5 text-[#1C1917] dark:text-[#EAE4D9]">
              Transfer this ZIP to your phone or tablet, extract it, and open{' '}
              <strong className="font-semibold">Daily-Bread-Offline.html</strong> — your{' '}
              {result.versionsBundled.join(', ')} Bible text and {result.noteCount} reflection{' '}
              {result.noteCount === 1 ? 'note' : 'notes'} work immediately with no internet.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={exporting}
            onClick={onClose}
            className="min-h-[42px] rounded-lg border border-[#E2DDD3] px-4 py-2 text-xs font-medium text-[#4A453E] hover:bg-[#EFEAE0] disabled:opacity-40 dark:border-[#35302A] dark:text-[#C8C0B4] dark:hover:bg-[#24201C]"
          >
            Close
          </button>
          <button
            type="button"
            disabled={exporting}
            onClick={handleDownloadZip}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#1E3A5F] px-5 py-2 text-xs font-medium text-[#FBF9F5] transition-colors hover:bg-[#162C49] disabled:opacity-60 dark:bg-[#D4A373] dark:text-[#141210] dark:hover:bg-[#C28F5E]"
          >
            <Archive className="h-4 w-4" aria-hidden="true" />
            <span>{exporting ? 'Building ZIP...' : 'Download Offline ZIP'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
