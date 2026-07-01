'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOffline: boolean;
  hasUpdate: boolean;
}

/**
 * Service Worker 管理 Hook
 * 处理注册、更新检测和离线状态监听
 *
 * 注意：所有浏览器 API 访问都在 useEffect 中进行，避免 SSR 水合问题
 */
export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isOffline: false, // SSR 安全默认值，客户端在 effect 中更新
    hasUpdate: false,
  });

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // 注册 Service Worker + 监听离线状态
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // 开发环境可通过 localStorage 禁用 SW
    if (localStorage.getItem('disable-sw') === 'true') {
      return;
    }

    // 初始化离线状态
    setState((prev) => ({ ...prev, isOffline: !navigator.onLine }));

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
        });

        setRegistration(reg);
        setState((prev) => ({ ...prev, isSupported: true, isRegistered: true }));

        // 检测更新
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState((prev) => ({ ...prev, hasUpdate: true }));
              toast.info('发现新版本', {
                description: '点击更新以获取最新功能',
                duration: 10000,
                action: {
                  label: '更新',
                  onClick: () => {
                    newWorker.postMessage('skipWaiting');
                  },
                },
              });
            }
          });
        });
      } catch (error) {
        console.error('[SW] Registration failed:', error);
      }
    };

    registerSW();

    // 监听在线/离线状态
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOffline: false }));
      toast.success('网络已恢复', { duration: 2000 });
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOffline: true }));
      toast.warning('网络已断开', {
        description: '离线时仍可查看已缓存的内容',
        duration: 4000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 监听 controllerchange，刷新页面以加载新版本
  useEffect(() => {
    if (!state.isSupported) return;

    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [state.isSupported]);

  // 手动检查更新
  const checkForUpdate = useCallback(async () => {
    if (!registration) return;
    try {
      await registration.update();
    } catch (error) {
      console.error('[SW] Update check failed:', error);
    }
  }, [registration]);

  return {
    ...state,
    checkForUpdate,
  };
}
