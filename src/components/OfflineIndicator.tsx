import React from 'react';
import {WifiOff} from 'lucide-react';
import {useOnlineStatus} from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-16 left-4 z-40 flex items-center gap-2 rounded-lg border border-[#D8D1C5] bg-[#1C1917] px-3 py-2 text-xs font-medium text-[#FBF9F5] shadow-lg md:bottom-5 dark:border-[#3E3831] dark:bg-[#2A2622]"
    >
      <WifiOff className="h-3.5 w-3.5 text-[#D4A373] shrink-0" aria-hidden="true" />
      <span>Offline Mode · Reading from local library</span>
    </div>
  );
};
