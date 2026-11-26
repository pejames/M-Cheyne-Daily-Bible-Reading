import React from 'react';
import {BookOpen, CalendarDays, Compass, HardDriveDownload, LibraryBig} from 'lucide-react';
import type {AppTab} from './TopBar';

interface MobileNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

const ITEMS: Array<{id: AppTab; label: string; Icon: React.ComponentType<{className?: string}>}> = [
  {id: 'today', label: 'Today', Icon: Compass},
  {id: 'books', label: 'Books', Icon: LibraryBig},
  {id: 'calendar', label: 'Calendar', Icon: CalendarDays},
  {id: 'bible', label: 'Bible', Icon: BookOpen},
  {id: 'offline', label: 'Offline', Icon: HardDriveDownload},
];

export const MobileNav: React.FC<MobileNavProps> = ({activeTab, onSelectTab}) => {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#E5DFD5] bg-[#FBF9F5]/95 backdrop-blur-md md:hidden dark:border-[#2C2722] dark:bg-[#141210]/95"
    >
      <div className="grid h-14 grid-cols-5 items-center">
        {ITEMS.map(({id, label, Icon}) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex h-full min-h-[44px] flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive
                  ? 'text-[#1E3A5F] dark:text-[#D4A373]'
                  : 'text-[#6B655E] hover:text-[#1C1917] dark:text-[#A39B8F] dark:hover:text-[#EAE4D9]'
              }`}
            >
              <Icon className="h-[19px] w-[19px]" aria-hidden="true" />
              <span className="text-[11px] font-medium tracking-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
