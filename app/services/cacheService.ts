// IndexedDB 缓存管理服务
interface ModelCacheData {
  id: string;
  name: string;
  state: any;
  lastUsed: number;
  size: number;
  version: string;
}

interface ResponseCacheData {
  id: string;
  question: string;
  response: string;
  modelId: string;
  timestamp: number;
  hash: string;
}

class ModelCacheService {
  private dbName = 'AIModelCache';
  private dbVersion = 2;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('❌ IndexedDB 打开失败:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB 初始化成功');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建模型存储
        if (!db.objectStoreNames.contains('models')) {
          const modelStore = db.createObjectStore('models', { keyPath: 'id' });
          modelStore.createIndex('name', 'name', { unique: false });
          modelStore.createIndex('lastUsed', 'lastUsed', { unique: false });
          modelStore.createIndex('version', 'version', { unique: false });
          console.log('📦 创建模型存储');
        }
        
        // 创建响应缓存存储
        if (!db.objectStoreNames.contains('responses')) {
          const responseStore = db.createObjectStore('responses', { keyPath: 'id' });
          responseStore.createIndex('question', 'question', { unique: false });
          responseStore.createIndex('timestamp', 'timestamp', { unique: false });
          responseStore.createIndex('modelId', 'modelId', { unique: false });
          responseStore.createIndex('hash', 'hash', { unique: false });
          console.log('💬 创建响应存储');
        }
        
        // 创建配置存储
        if (!db.objectStoreNames.contains('config')) {
          const configStore = db.createObjectStore('config', { keyPath: 'key' });
          console.log('⚙️ 创建配置存储');
        }
      };
    });

    return this.initPromise;
  }

  // 缓存模型状态
  async cacheModelState(modelId: string, state: any, version: string = '1.0'): Promise<void> {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db!.transaction(['models'], 'readwrite');
      const store = transaction.objectStore('models');
      
      const modelData: ModelCacheData = {
        id: modelId,
        name: modelId,
        state: state,
        lastUsed: Date.now(),
        size: JSON.stringify(state).length,
        version: version
      };
      
      await this.promisifyRequest(store.put(modelData));
      console.log('💾 模型状态已缓存:', modelId);
    } catch (error) {
      console.error('❌ 缓存模型状态失败:', error);
    }
  }

  // 获取缓存的模型状态
  async getCachedModelState(modelId: string): Promise<any | null> {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db!.transaction(['models'], 'readonly');
      const store = transaction.objectStore('models');
      const result = await this.promisifyRequest(store.get(modelId));
      
      if (result) {
        // 更新最后使用时间
        this.updateLastUsed(modelId);
        console.log('📖 从缓存加载模型状态:', modelId);
        return result.state;
      }
      
      return null;
    } catch (error) {
      console.error('❌ 获取缓存模型状态失败:', error);
      return null;
    }
  }

  // 缓存AI响应
  // 缓存响应
  async cacheResponse(question: string, response: string, modelId: string): Promise<void> {
    await this.ensureInitialized();
    
    try {
      // 先完成所有异步操作，再创建事务
      const hash = await this.generateHash(question);
      const id = `${modelId}_${hash}`;
      
      const responseData: ResponseCacheData = {
        id,
        question: question.toLowerCase().trim(),
        response,
        modelId,
        timestamp: Date.now(),
        hash
      };
      
      // 现在创建事务并立即使用
      const transaction = this.db!.transaction(['responses'], 'readwrite');
      const store = transaction.objectStore('responses');
      
      await this.promisifyRequest(store.put(responseData));
      console.log('💬 响应已缓存:', question.slice(0, 20) + '...');
    } catch (error) {
      console.error('❌ 缓存响应失败:', error);
    }
  }

  // 获取缓存的响应
  async getCachedResponse(question: string, modelId: string): Promise<string | null> {
    await this.ensureInitialized();
    
    try {
      // 先完成异步操作，再创建事务
      const hash = await this.generateHash(question);
      const id = `${modelId}_${hash}`;
      
      // 现在创建事务并立即使用
      const transaction = this.db!.transaction(['responses'], 'readonly');
      const store = transaction.objectStore('responses');
      
      const result = await this.promisifyRequest(store.get(id));
      
      if (result) {
        console.log('⚡ 从缓存返回响应:', question.slice(0, 20) + '...');
        return result.response;
      }
      
      return null;
    } catch (error) {
      console.error('❌ 获取缓存响应失败:', error);
      return null;
    }
  }

  // 搜索相似问题
  async searchSimilarResponses(question: string, modelId: string, limit: number = 5): Promise<ResponseCacheData[]> {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db!.transaction(['responses'], 'readonly');
      const store = transaction.objectStore('responses');
      const index = store.index('modelId');
      
      const results: ResponseCacheData[] = [];
      const request = index.openCursor(IDBKeyRange.only(modelId));
      
      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor && results.length < limit) {
            const data = cursor.value as ResponseCacheData;
            const similarity = this.calculateSimilarity(question, data.question);
            
            if (similarity > 0.7) { // 70% 相似度阈值
              results.push(data);
            }
            
            cursor.continue();
          } else {
            resolve(results.sort((a, b) => b.timestamp - a.timestamp));
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('❌ 搜索相似响应失败:', error);
      return [];
    }
  }

  // 获取缓存统计
  async getCacheStats(): Promise<{
    modelCount: number;
    responseCount: number;
    totalSize: number;
    oldestEntry: number;
    newestEntry: number;
  }> {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db!.transaction(['models', 'responses'], 'readonly');
      const modelStore = transaction.objectStore('models');
      const responseStore = transaction.objectStore('responses');
      
      const [modelCount, responseCount] = await Promise.all([
        this.promisifyRequest(modelStore.count()),
        this.promisifyRequest(responseStore.count())
      ]);
      
      // 计算总大小和时间范围
      let totalSize = 0;
      let oldestEntry = Date.now();
      let newestEntry = 0;
      
      // 遍历模型
      const modelCursor = modelStore.openCursor();
      await new Promise<void>((resolve) => {
        modelCursor.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const data = cursor.value as ModelCacheData;
            totalSize += data.size;
            oldestEntry = Math.min(oldestEntry, data.lastUsed);
            newestEntry = Math.max(newestEntry, data.lastUsed);
            cursor.continue();
          } else {
            resolve();
          }
        };
      });
      
      // 遍历响应
      const responseCursor = responseStore.openCursor();
      await new Promise<void>((resolve) => {
        responseCursor.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const data = cursor.value as ResponseCacheData;
            totalSize += data.response.length * 2; // 估算字符串大小
            oldestEntry = Math.min(oldestEntry, data.timestamp);
            newestEntry = Math.max(newestEntry, data.timestamp);
            cursor.continue();
          } else {
            resolve();
          }
        };
      });
      
      return {
        modelCount,
        responseCount,
        totalSize,
        oldestEntry,
        newestEntry
      };
    } catch (error) {
      console.error('❌ 获取缓存统计失败:', error);
      return {
        modelCount: 0,
        responseCount: 0,
        totalSize: 0,
        oldestEntry: 0,
        newestEntry: 0
      };
    }
  }

  // 清理旧缓存
  async cleanOldCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    await this.ensureInitialized();
    
    try {
      const cutoff = Date.now() - maxAge;
      const transaction = this.db!.transaction(['responses'], 'readwrite');
      const store = transaction.objectStore('responses');
      const index = store.index('timestamp');
      
      let deletedCount = 0;
      const request = index.openCursor(IDBKeyRange.upperBound(cutoff));
      
      return new Promise((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            console.log(`🧹 清理了 ${deletedCount} 个旧响应`);
            resolve(deletedCount);
          }
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('❌ 清理旧缓存失败:', error);
      return 0;
    }
  }

  // 清空所有缓存
  async clearAllCache(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      const transaction = this.db!.transaction(['models', 'responses'], 'readwrite');
      
      await Promise.all([
        this.promisifyRequest(transaction.objectStore('models').clear()),
        this.promisifyRequest(transaction.objectStore('responses').clear())
      ]);
      
      console.log('🗑️ 所有缓存已清空');
    } catch (error) {
      console.error('❌ 清空缓存失败:', error);
    }
  }

  // 导出缓存数据
  async exportCache(): Promise<string> {
    await this.ensureInitialized();
    
    try {
      const stats = await this.getCacheStats();
      const transaction = this.db!.transaction(['models', 'responses'], 'readonly');
      
      const models: ModelCacheData[] = [];
      const responses: ResponseCacheData[] = [];
      
      // 导出模型
      const modelCursor = transaction.objectStore('models').openCursor();
      await new Promise<void>((resolve) => {
        modelCursor.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            models.push(cursor.value);
            cursor.continue();
          } else {
            resolve();
          }
        };
      });
      
      // 导出响应
      const responseCursor = transaction.objectStore('responses').openCursor();
      await new Promise<void>((resolve) => {
        responseCursor.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            responses.push(cursor.value);
            cursor.continue();
          } else {
            resolve();
          }
        };
      });
      
      const exportData = {
        version: this.dbVersion,
        timestamp: Date.now(),
        stats,
        models,
        responses
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('❌ 导出缓存失败:', error);
      return '{}';
    }
  }

  // 私有方法
  private async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }

  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async updateLastUsed(modelId: string): Promise<void> {
    try {
      const transaction = this.db!.transaction(['models'], 'readwrite');
      const store = transaction.objectStore('models');
      const result = await this.promisifyRequest(store.get(modelId));
      
      if (result) {
        result.lastUsed = Date.now();
        await this.promisifyRequest(store.put(result));
      }
    } catch (error) {
      console.error('❌ 更新最后使用时间失败:', error);
    }
  }

  private async generateHash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

export const modelCacheService = new ModelCacheService();