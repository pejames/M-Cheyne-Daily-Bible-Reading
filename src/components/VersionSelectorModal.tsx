import React, {useEffect, useState} from 'react';
import {Check, Columns2, Download, Info, X} from 'lucide-react';
import {
  cacheAllBooks,
  getAllVersionCacheCounts,
  getAvailableVersions,
} from '../services/offlineBibleDb';
import type {BibleVersionMeta} from '../types/bible';

interface VersionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeVersionId: string;
  compareVersionId: string | null;
  onSelectVersion: (versionId: string) => void;
  onSelectCompareVersion: (versionId: string | null) => void;
  onOpenOfflineTab?: () => void;
}

export const VersionSelectorModal: React.FC<VersionSelectorModalProps> = ({
  isOpen,
  onClose,
  activeVersionId,
  compareVersionId,
  onSelectVersion,
  onSelectCompareVersion,
  onOpenOfflineTab,
}) => {
  const [versions, setVersions] = useState<BibleVersionMeta[]>([]);
  const [cacheCounts, setCacheCounts] = useState<Record<string, number>>({});
  const [cachingId, setCachingId] = useState<string | null>(null);
  const [cachingProgress, setCachingProgress] = useState<number>(0);

  const refreshData = async () => {
    const [list, counts] = await Promise.all([
      getAvailableVersions(),
      getAllVersionCacheCounts(),
    ]);
    setVersions(list);
    setCacheCounts(counts);
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCacheVersion = async (versionId: string) => {
    setCachingId(versionId);
    setCachingProgress(cacheCounts[versionId] ?? 0);
    try {
      const count = await cacheAllBooks(versionId, (loaded) => {
        setCachingProgress(loaded);
      });
      setCacheCounts((prev) => ({...prev, [versionId]: count}));
    } finally {
      setCachingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-selector-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-5 shadow-2xl sm:p-6 dark:border-[#35302A] dark:bg-[#1A1714]">
        <div className="flex items-start justify-between gap-4 border-b border-[#EAE4D9] pb-4 dark:border-[#2C2722]">
          <div>
            <h2
              id="version-selector-title"
              className="font-serif text-2xl font-semibold text-[#1C1917] dark:text-[#EAE4D9]"
            >
              Bible Translations
            </h2>
            <p className="mt-0.5 text-xs text-[#6B655E] dark:text-[#A39B8F]">
              Switch primary translation or enable parallel verse-by-verse comparison offline
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close translation selector"
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-[#6B655E] hover:bg-[#EFEAE0] hover:text-[#1C1917] dark:text-[#A39B8F] dark:hover:bg-[#2A2622] dark:hover:text-[#EAE4D9]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Version List */}
        <div className="mt-4 divide-y divide-[#EFEAE0] dark:divide-[#26211D]">
          {versions.map((v) => {
            const isActive = activeVersionId === v.id;
            const isComparing = compareVersionId === v.id;
            const cached = cacheCounts[v.id] ?? 0;
            const isCaching = cachingId === v.id;

            return (
              <div
                key={v.id}
                className={`flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between ${
                  isActive ? 'bg-[#1E3A5F]/4 -mx-3 px-3 rounded-xl dark:bg-[#D4A373]/8' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-sans text-sm font-bold tracking-wide text-[#1E3A5F] dark:text-[#D4A373]">
                      {v.shortName}
                    </span>
                    <span className="font-serif text-base font-semibold text-[#1C1917] dark:text-[#EAE4D9]">
                      {v.fullName}
                    </span>
                    <span className="text-xs text-[#6B655E] dark:text-[#A39B8F] tabular-nums">
                      ({v.year})
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#6B655E] dark:text-[#A39B8F]">
                    {v.closestModernNote} ·{' '}
                    <span className="tabular-nums">{cached}/66 books cached</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {cached < 66 && !v.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleCacheVersion(v.id)}
                      disabled={isCaching}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#E2DDD3] px-3 py-1.5 text-xs font-medium text-[#4A453E] hover:bg-[#EFEAE0] disabled:opacity-60 dark:border-[#35302A] dark:text-[#C8C0B4] dark:hover:bg-[#24201C] whitespace-nowrap"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      {isCaching ? `${cachingProgress}/66` : 'Save Offline'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      onSelectCompareVersion(isComparing ? null : isActive ? null : v.id)
                    }
                    disabled={isActive}
                    title={
                      isActive
                        ? 'Already selected as primary version'
                        : 'Compare side-by-side with primary version'
                    }
                    className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      isComparing
                        ? 'border-[#8A5A2B] bg-[#8A5A2B]/12 text-[#8A5A2B] dark:border-[#D4A373] dark:bg-[#D4A373]/18 dark:text-[#D4A373]'
                        : 'border-[#E2DDD3] text-[#4A453E] hover:bg-[#EFEAE0] disabled:opacity-35 dark:border-[#35302A] dark:text-[#C8C0B4] dark:hover:bg-[#24201C]'
                    }`}
                  >
                    <Columns2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {isComparing ? 'Comparing' : 'Compare'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (compareVersionId === v.id) {
                        onSelectCompareVersion(null);
                      }
                      onSelectVersion(v.id);
                    }}
                    className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-[#1E3A5F] text-[#FBF9F5] dark:bg-[#D4A373] dark:text-[#141210]'
                        : 'border border-[#E2DDD3] bg-white text-[#1C1917] hover:bg-[#EFEAE0] dark:border-[#35302A] dark:bg-[#141210] dark:text-[#EAE4D9] dark:hover:bg-[#24201C]'
                    }`}
                  >
                    {isActive && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                    {isActive ? 'Active' : 'Use'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Honest Copyright & Style Equivalent Note */}
        <div className="mt-5 rounded-xl border border-[#E2DDD3] bg-[#F3EFE7]/75 p-4 dark:border-[#35302A] dark:bg-[#141210]">
          <div className="flex items-start gap-2.5">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-[#8A5A2B] dark:text-[#D4A373]"
              aria-hidden="true"
            />
            <div className="space-y-1.5 text-xs leading-relaxed text-[#4A453E] dark:text-[#C8C0B4]">
              <p className="font-semibold text-[#1C1917] dark:text-[#EAE4D9]">
                About NKJV, ESV, NASB 1995, and NIV
              </p>
              <p>
                NKJV, ESV, NASB 1995, and NIV are copyrighted by their publishers (Thomas Nelson,
                Crossway, The Lockman Foundation, and Biblica), who prohibit bundling full-text
                databases into open offline apps without commercial licensing.
              </p>
              <p>
                All five built-in translations above are 100% public domain for unrestricted
                offline reading: <strong className="font-semibold">BSB</strong> mirrors ESV/NIV
                clarity, <strong className="font-semibold">UKJV</strong> mirrors NKJV updates, and{' '}
                <strong className="font-semibold">ASV</strong> is the direct formal-equivalence
                predecessor to NASB 1995. If you have your own personal Bible JSON file, you can
                import it locally in the{' '}
                {onOpenOfflineTab ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenOfflineTab();
                    }}
                    className="font-semibold text-[#1E3A5F] underline underline-offset-2 dark:text-[#D4A373]"
                  >
                    Offline Library
                  </button>
                ) : (
                  'Offline Library'
                )}
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
