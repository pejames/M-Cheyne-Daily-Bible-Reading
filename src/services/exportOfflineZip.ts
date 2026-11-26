import JSZip from 'jszip';
import {getBibleBook, getBookIndex} from './offlineBibleDb';
import type {
  BibleBookData,
  BibleVersionMeta,
  EmbeddedPortableState,
  UserReadingState,
} from '../types/bible';

export interface ExportZipResult {
  filename: string;
  sizeBytes: number;
  noteCount: number;
  completedCount: number;
  versionsBundled: string[];
}

function escapeJsonForInlineScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export async function exportOfflineAppZip(options: {
  state: UserReadingState;
  versions: BibleVersionMeta[];
  versionIdsToBundle: string[];
  onProgress?: (stage: string, percent: number) => void;
}): Promise<ExportZipResult> {
  const {state, versions, versionIdsToBundle, onProgress} = options;
  const uniqueVersionIds = Array.from(new Set(versionIdsToBundle));
  if (uniqueVersionIds.length === 0) {
    uniqueVersionIds.push(state.translation);
  }

  onProgress?.('Preparing offline application shell...', 5);

  const [jsRes, cssRes] = await Promise.all([
    fetch('/portable/portable-app.iife.js'),
    fetch('/portable/portable-app.css'),
  ]);

  if (!jsRes.ok || !cssRes.ok) {
    throw new Error(
      'Offline portable bundle assets were not found. Please reload once while connected.'
    );
  }

  const [appJs, appCss] = await Promise.all([jsRes.text(), cssRes.text()]);

  const embeddedBibles: Record<string, Record<string, BibleBookData>> = {};
  const bundledVersionsMeta = versions.filter((v) => uniqueVersionIds.includes(v.id));

  const totalVersions = uniqueVersionIds.length;
  for (let vIdx = 0; vIdx < totalVersions; vIdx++) {
    const vId = uniqueVersionIds[vIdx];
    const meta = versions.find((v) => v.id === vId);
    const label = meta?.shortName ?? vId.toUpperCase();

    const index = await getBookIndex(vId);
    const booksMap: Record<string, BibleBookData> = {};

    const concurrency = 4;
    let cursor = 0;
    let loadedBooks = 0;

    async function worker() {
      while (cursor < index.length) {
        const item = index[cursor++];
        const bookData = await getBibleBook(item.slug, vId);
        booksMap[item.slug] = bookData;
        loadedBooks++;
        const basePct = 10 + (vIdx / totalVersions) * 65;
        const stepPct = (loadedBooks / index.length) * (65 / totalVersions);
        onProgress?.(
          `Packing ${label} (${loadedBooks}/${index.length} books)...`,
          Math.round(basePct + stepPct)
        );
      }
    }

    await Promise.all(Array.from({length: concurrency}, worker));
    embeddedBibles[vId] = booksMap;
  }

  onProgress?.('Embedding reflection notes & reading progress...', 80);

  const safeTranslation = uniqueVersionIds.includes(state.translation)
    ? state.translation
    : uniqueVersionIds[0];

  const safeCompare =
    state.compareTranslation && uniqueVersionIds.includes(state.compareTranslation)
      ? state.compareTranslation
      : null;

  const exportedState: UserReadingState = {
    ...state,
    translation: safeTranslation,
    compareTranslation: safeCompare,
  };

  const embeddedState: EmbeddedPortableState = {
    bundleId: `bundle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    exportedAt: new Date().toISOString(),
    state: exportedState,
  };

  const portableHtml = `<!doctype html>
<html lang="en"${state.theme === 'dark' ? ' class="dark"' : ''}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Daily Bread — M'Cheyne Offline Bible</title>
    <style>${appCss.replace(/<\/style/gi, '<\\/style')}</style>
  </head>
  <body class="bg-[#FBF9F5] text-[#1C1917] antialiased selection:bg-[#1E3A5F]/15 selection:text-[#1E3A5F] dark:bg-[#141210] dark:text-[#EAE4D9] dark:selection:bg-[#D4A373]/25 dark:selection:text-[#EAE4D9]">
    <div id="root"></div>
    <script>
      window.__DAILY_BREAD_PORTABLE__ = true;
      window.__DAILY_BREAD_EMBEDDED_STATE__ = ${escapeJsonForInlineScript(embeddedState)};
      window.__DAILY_BREAD_EMBEDDED_VERSIONS__ = ${escapeJsonForInlineScript(bundledVersionsMeta)};
      window.__DAILY_BREAD_EMBEDDED_BIBLES__ = ${escapeJsonForInlineScript(embeddedBibles)};
    </script>
    <script>${appJs.replace(/<\/script/gi, '<\\/script')}</script>
  </body>
</html>`;

  const noteCount = Object.keys(state.notes).filter((k) => state.notes[Number(k)]?.trim()).length;
  const completedCount = Object.keys(state.completedIds).length;

  const readmeText = [
    "DAILY BREAD — ROBERT MURRAY M'CHEYNE 1-YEAR BIBLE READING PLAN (OFFLINE EDITION)",
    '===============================================================================',
    '',
    `Exported: ${new Date().toLocaleString()}`,
    `Included Translations: ${bundledVersionsMeta.map((v) => `${v.shortName} (${v.fullName})`).join(', ')}`,
    `Transferred Reflection Notes: ${noteCount}`,
    `Transferred Completed Passages: ${completedCount} / 1460`,
    '',
    'HOW TO USE ON ANY DEVICE WITH ZERO INTERNET CONNECTION:',
    '-------------------------------------------------------',
    '1. Unzip this folder on your phone, tablet, or computer.',
    '2. Open "Daily-Bread-Offline.html" directly in your browser or HTML viewer:',
    '   - Android: Extract the ZIP in your Files app, then tap "Daily-Bread-Offline.html"',
    '     and choose Chrome (or your preferred browser).',
    '   - iPhone / iPad: Tap the ZIP in the Files app to extract it, then open',
    '     "Daily-Bread-Offline.html" (or use a local HTML viewer / Safari).',
    '     Note: On iOS, if Safari restricts local storage inside Quick Look preview,',
    '     you can also import "daily-bread-notes-and-progress.json" anytime.',
    '   - Windows / Mac / Linux: Double-click "Daily-Bread-Offline.html" to open',
    '     in Chrome, Safari, Edge, or Firefox.',
    '',
    'All 365 days of M\'Cheyne\'s plan, the complete Bible text for your chosen',
    'translation(s), and all of your reflection notes, verse highlights, and',
    'reading progress are embedded inside Daily-Bread-Offline.html.',
    '',
    'Backup File Included:',
    '"daily-bread-notes-and-progress.json" contains your notes and progress backup',
    'which can also be imported into any installed copy of Daily Bread via the Offline tab.',
    '',
  ].join('\n');

  const backupJson = JSON.stringify(
    {
      version: 1,
      exportedAt: embeddedState.exportedAt,
      state: exportedState,
    },
    null,
    2
  );

  onProgress?.('Compressing ZIP archive...', 92);

  const zip = new JSZip();
  zip.file('Daily-Bread-Offline.html', portableHtml);
  zip.file('daily-bread-notes-and-progress.json', backupJson);
  zip.file('README-OFFLINE.txt', readmeText);

  const blob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {level: 6},
    },
    (meta) => {
      onProgress?.('Compressing ZIP archive...', Math.min(99, Math.round(90 + meta.percent * 0.09)));
    }
  );

  const dateTag = new Date().toISOString().slice(0, 10);
  const filename = `Daily-Bread-Offline-${dateTag}.zip`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);

  onProgress?.('Download ready', 100);

  return {
    filename,
    sizeBytes: blob.size,
    noteCount,
    completedCount,
    versionsBundled: bundledVersionsMeta.map((v) => v.shortName),
  };
}
