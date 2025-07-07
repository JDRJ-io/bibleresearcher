import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useServiceWorkerStatus } from '@/hooks/useServiceWorkerStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { isActivated } = useServiceWorkerStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded-lg p-3 shadow-lg max-w-sm">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
        <div className="text-sm">
          <div className="font-medium text-amber-800 dark:text-amber-200">
            You're offline
          </div>
          <div className="text-amber-600 dark:text-amber-300">
            {isActivated 
              ? "Changes will sync when you reconnect" 
              : "Data may not be saved offline"
            }
          </div>
        </div>
      </div>
    </div>
  );
}