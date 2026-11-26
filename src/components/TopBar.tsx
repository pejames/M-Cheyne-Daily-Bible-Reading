import React from 'react';
import {Moon, Sun} from 'lucide-react';

export type AppTab = 'today' | 'books' | 'calendar' | 'bible' | 'offline';

interface TopBarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const NAV_ITEMS: Array<{id: AppTab; label: string}> = [
  {id: 'today', label: 'Today'},
  {id: 'books', label: 'Books'},
  {id: 'calendar', label: 'Calendar'},
  {id: 'bible', label: 'Bible'},
  {id: 'offline', label: 'Offline'},
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-[#E5DFD5] bg-[#FBF9F5]/95 backdrop-blur-md dark:border-[#2C2722] dark:bg-[#141210]/95">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single-line Brand Title */}
        <button
          type="button"
          onClick={() => onSelectTab('today')}
          className="font-serif text-xl font-semibold tracking-tight text-[#1C1917] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F] dark:text-[#EAE4D9] whitespace-nowrap shrink-0"
        >
          Daily Bread
        </button>

        {/* Zone 2: Clean Typography Nav Links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-1 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1E3A5F] whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-[#1E3A5F] dark:text-[#D4A373]'
                    : 'text-[#6B655E] hover:text-[#1C1917] dark:text-[#A39B8F] dark:hover:text-[#EAE4D9]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[17px] h-[2px] bg-[#1E3A5F] dark:bg-[#D4A373]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to daylight theme' : 'Switch to night reading theme'}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[#E2DDD3] bg-[#F5F1EA] px-3.5 py-2 text-xs font-medium text-[#1C1917] transition-colors hover:bg-[#EBE5DA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A5F] dark:border-[#35302A] dark:bg-[#1E1B18] dark:text-[#EAE4D9] dark:hover:bg-[#2A2622] whitespace-nowrap shrink-0"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-3.5 w-3.5 text-[#D4A373]" aria-hidden="true" />
                <span>Daylight</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-[#1E3A5F]" aria-hidden="true" />
                <span>Night Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
