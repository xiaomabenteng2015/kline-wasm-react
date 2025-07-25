// AI 模型缓存 Service Worker
const CACHE_NAME = 'ai-models-v1';
const MODEL_CACHE_NAME = 'model-files-v1';
const RESPONSE_CACHE_NAME = 'ai-responses-v1';

// 需要缓存的模型文件模式
const MODEL_PATTERNS = [
  /\/models\//,
  /huggingface\.co/,
  /\.bin$/,
  /\.json$/,
  /\.safetensors$/,
  /tokenizer/,
  /config\.json$/,
  /pytorch_model/,
  /onnx/
];

// 安装事件
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker 正在安装...');
  self.skipWaiting();
});

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker 已激活');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      cleanupOldCaches()
    ])
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 检查是否是模型文件请求
  const isModelFile = MODEL_PATTERNS.some(pattern => 
    pattern.test(url.pathname) || pattern.test(url.hostname)
  );
  
  if (isModelFile) {
    console.log('🎯 拦截模型文件请求:', url.pathname);
    event.respondWith(handleModelRequest(event.request));
  }
});

// 处理模型文件请求
async function handleModelRequest(request) {
  const cache = await caches.open(MODEL_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('⚡ 从缓存加载模型文件:', request.url);
    // 添加缓存标识头
    const response = cachedResponse.clone();
    response.headers.set('X-Cache-Status', 'HIT');
    return response;
  }
  
  try {
    console.log('📥 下载并缓存模型文件:', request.url);
    
    // 显示下载进度
    const response = await fetchWithProgress(request);
    
    // 只缓存成功的响应
    if (response.status === 200) {
      const responseClone = response.clone();
      await cache.put(request, responseClone);
      console.log('💾 模型文件已缓存:', request.url);
    }
    
    return response;
  } catch (error) {
    console.error('❌ 模型文件加载失败:', error);
    
    // 返回离线提示
    return new Response(
      JSON.stringify({ error: '模型文件加载失败，请检查网络连接' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 带进度的下载
async function fetchWithProgress(request) {
  const response = await fetch(request);
  
  if (!response.body) {
    return response;
  }
  
  const contentLength = response.headers.get('Content-Length');
  if (!contentLength) {
    return response;
  }
  
  const total = parseInt(contentLength, 10);
  let loaded = 0;
  
  const stream = new ReadableStream({
    start(controller) {
      const reader = response.body.getReader();
      
      function pump() {
        return reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }
          
          loaded += value.length;
          const progress = Math.round((loaded / total) * 100);
          
          // 发送进度到主线程
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'DOWNLOAD_PROGRESS',
                url: request.url,
                progress,
                loaded,
                total
              });
            });
          });
          
          controller.enqueue(value);
          return pump();
        });
      }
      
      return pump();
    }
  });
  
  return new Response(stream, {
    headers: response.headers
  });
}

// 清理旧缓存
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('ai-models-') && name !== CACHE_NAME
  );
  
  await Promise.all(
    oldCaches.map(name => caches.delete(name))
  );
  
  console.log('🧹 清理了', oldCaches.length, '个旧缓存');
}

// 监听消息
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CLEAR_CACHE':
      await clearAllCaches();
      event.ports[0]?.postMessage({ success: true });
      break;
      
    case 'GET_CACHE_SIZE':
      const size = await getCacheSize();
      event.ports[0]?.postMessage({ size });
      break;
      
    case 'PRELOAD_MODEL':
      await preloadModel(data.modelUrl);
      event.ports[0]?.postMessage({ success: true });
      break;
      
    default:
      console.log('未知消息类型:', type);
  }
});

// 清理所有缓存
async function clearAllCaches() {
  const cacheNames = [MODEL_CACHE_NAME, RESPONSE_CACHE_NAME];
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    await Promise.all(keys.map(key => cache.delete(key)));
  }
  
  console.log('🗑️ 所有缓存已清理');
}

// 获取缓存大小
async function getCacheSize() {
  let totalSize = 0;
  const cacheNames = [MODEL_CACHE_NAME, RESPONSE_CACHE_NAME];
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

// 预加载模型
async function preloadModel(modelUrl) {
  try {
    console.log('🔄 预加载模型:', modelUrl);
    const request = new Request(modelUrl);
    await handleModelRequest(request);
    console.log('✅ 模型预加载完成:', modelUrl);
  } catch (error) {
    console.error('❌ 模型预加载失败:', error);
  }
}