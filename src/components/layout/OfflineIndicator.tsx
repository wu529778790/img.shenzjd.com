'use client';

import { useServiceWorker } from '@/hooks/useServiceWorker';
import { WifiOff } from 'lucide-react';

/**
 * 离线状态指示器
 * 当网络断开时显示顶部横幅
 */
export function OfflineIndicator() {
  const { isOffline } = useServiceWorker();

  if (!isOffline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-2"
      role="alert"
      aria-live="polite"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      <span>当前处于离线状态，部分功能可能不可用</span>
    </div>
  );
}
