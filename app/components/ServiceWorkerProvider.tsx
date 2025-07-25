'use client';

import { useEffect } from 'react';
import { swManager } from '../services/swManager';

export default function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 注册 Service Worker
    const initServiceWorker = async () => {
      const success = await swManager.register();
      if (success) {
        console.log('🎉 Service Worker 初始化成功');

        // 监听下载进度
        window.addEventListener('sw-download-progress', (event: any) => {
          const { url, progress, loaded, total } = event.detail;
          console.log(`📥 下载进度: ${progress}% (${loaded}/${total})`);
        });
      }
    };

    initServiceWorker();
  }, []);

  return <>{children}</>;
}