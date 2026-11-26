import React, {useState} from 'react';
import {Download, Share, Smartphone, X} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({variant = 'compact'}) => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="flex items-center gap-3 text-sm text-[#4A453E] dark:text-[#C8C0B4]">
          <Smartphone className="h-4 w-4 text-[#1E3A5F] dark:text-[#D4A373] shrink-0" />
          <span>Installed as a standalone offline application.</span>
        </div>
      );
    }
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#1E3A5F] px-4 py-2 text-xs font-medium text-[#FBF9F5] transition-colors hover:bg-[#162C49] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F] dark:bg-[#D4A373] dark:text-[#141210] dark:hover:bg-[#C28F5E] whitespace-nowrap shrink-0"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Install App
      </button>
    );
  }

  if (isIOS || variant === 'card') {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[#D8D1C5] bg-white/70 px-4 py-2 text-xs font-medium text-[#1C1917] transition-colors hover:bg-[#F3EFE7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F] dark:border-[#35302A] dark:bg-[#1E1B18] dark:text-[#EAE4D9] dark:hover:bg-[#2A2622] whitespace-nowrap shrink-0"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          {isIOS ? 'Install on iOS' : 'How to Install App'}
        </button>

        {showGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-guide-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-[#E2DDD3] bg-[#FBF9F5] p-6 shadow-xl dark:border-[#35302A] dark:bg-[#1E1B18]">
              <div className="flex items-start justify-between gap-4">
                <h3
                  id="install-guide-title"
                  className="font-serif text-xl font-semibold text-[#1C1917] dark:text-[#EAE4D9]"
                >
                  Install Daily Bread Offline
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  aria-label="Close installation guide"
                  className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-[#6B655E] hover:bg-[#EFEAE0] hover:text-[#1C1917] dark:text-[#A39B8F] dark:hover:bg-[#2A2622] dark:hover:text-[#EAE4D9]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {isIOS ? (
                <ol className="mt-4 space-y-3 text-sm leading-relaxed text-[#4A453E] dark:text-[#C8C0B4]">
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-xs font-semibold text-[#1E3A5F] dark:text-[#D4A373] mt-0.5 tabular-nums">
                      01.
                    </span>
                    <span>
                      Tap the <strong className="inline-flex items-center gap-1 font-semibold text-[#1C1917] dark:text-[#EAE4D9]"><Share className="h-3.5 w-3.5" /> Share</strong> icon in the Safari toolbar.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-xs font-semibold text-[#1E3A5F] dark:text-[#D4A373] mt-0.5 tabular-nums">
                      02.
                    </span>
                    <span>
                      Scroll down and tap <strong className="font-semibold text-[#1C1917] dark:text-[#EAE4D9]">Add to Home Screen</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="font-mono text-xs font-semibold text-[#1E3A5F] dark:text-[#D4A373] mt-0.5 tabular-nums">
                      03.
                    </span>
                    <span>
                      Open Daily Bread from your Home Screen anytime, even in airplane mode.
                    </span>
                  </li>
                </ol>
              ) : (
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#4A453E] dark:text-[#C8C0B4]">
                  <p>
                    Use your browser&apos;s address bar install icon or open the browser menu and select{' '}
                    <strong className="font-semibold text-[#1C1917] dark:text-[#EAE4D9]">
                      Install Daily Bread
                    </strong>{' '}
                    (or <strong className="font-semibold text-[#1C1917] dark:text-[#EAE4D9]">Add to Home Screen</strong>).
                  </p>
                  <p className="text-xs text-[#6B655E] dark:text-[#A39B8F]">
                    All 66 KJV books and the 365-day M&apos;Cheyne plan are cached locally via Service Worker and IndexedDB.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="mt-6 w-full min-h-[44px] rounded-lg bg-[#1E3A5F] px-4 py-2 text-sm font-medium text-[#FBF9F5] transition-colors hover:bg-[#162C49] dark:bg-[#D4A373] dark:text-[#141210] dark:hover:bg-[#C28F5E]"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
