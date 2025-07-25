// Service Worker 管理器
class ServiceWorkerManager {
  private isRegistered = false;
  private registration: ServiceWorkerRegistration | null = null;
  private downloadProgress = new Map<string, number>();

  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ 浏览器不支持 Service Worker');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('✅ Service Worker 注册成功');
      this.isRegistered = true;
      
      // 监听更新
      this.registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker 更新可用');
        this.handleUpdate();
      });
      
      // 监听消息
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleMessage(event);
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Service Worker 注册失败:', error);
      return false;
    }
  }

  private handleUpdate(): void {
    if (!this.registration) return;
    
    const newWorker = this.registration.installing;
    if (!newWorker) return;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // 新版本可用，提示用户刷新
        this.notifyUpdate();
      }
    });
  }

  private handleMessage(event: MessageEvent): void {
    const { type, url, progress, loaded, total } = event.data;
    
    switch (type) {
      case 'DOWNLOAD_PROGRESS':
        this.downloadProgress.set(url, progress);
        this.notifyProgress(url, progress, loaded, total);
        break;
        
      default:
        console.log('收到 SW 消息:', event.data);
    }
  }

  private notifyUpdate(): void {
    // 可以在这里显示更新提示
    console.log('🆕 新版本可用，建议刷新页面');
  }

  private notifyProgress(url: string, progress: number, loaded: number, total: number): void {
    // 发送进度事件
    window.dispatchEvent(new CustomEvent('sw-download-progress', {
      detail: { url, progress, loaded, total }
    }));
  }

  async clearCache(): Promise<boolean> {
    if (!this.isRegistered || !this.registration) {
      return false;
    }
    
    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success || false);
        };
        
        this.registration!.active?.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('清理缓存失败:', error);
      return false;
    }
  }

  async getCacheSize(): Promise<number> {
    if (!this.isRegistered || !this.registration) {
      return 0;
    }
    
    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.size || 0);
        };
        
        this.registration!.active?.postMessage(
          { type: 'GET_CACHE_SIZE' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('获取缓存大小失败:', error);
      return 0;
    }
  }

  async preloadModel(modelUrl: string): Promise<boolean> {
    if (!this.isRegistered || !this.registration) {
      return false;
    }
    
    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success || false);
        };
        
        this.registration!.active?.postMessage(
          { type: 'PRELOAD_MODEL', data: { modelUrl } },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('预加载模型失败:', error);
      return false;
    }
  }

  getDownloadProgress(url: string): number {
    return this.downloadProgress.get(url) || 0;
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }
}

export const swManager = new ServiceWorkerManager();