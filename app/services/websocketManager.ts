/**
 * WebSocket连接管理模块
 * 提供WebSocket连接的创建、维护和关闭功能
 */

// 全局单例WebSocket管理器实例映射
const wsManagerInstances: Map<string, WebSocketManager> = new Map();

/**
 * WebSocket连接管理类
 * 负责创建、维护和关闭WebSocket连接
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private isClosing = false;
  private connectionId: string;

  /**
   * 获取WebSocket管理器实例（单例模式）
   * @param url WebSocket连接地址
   * @returns WebSocket管理器实例
   */
  static getInstance(url: string): WebSocketManager {
    if (!wsManagerInstances.has(url)) {
      wsManagerInstances.set(url, new WebSocketManager(url));
    }
    return wsManagerInstances.get(url)!;
  }

  /**
   * 构造函数
   * @param url WebSocket连接地址
   */
  private constructor(url: string) {
    this.url = url;
    this.connectionId = `ws-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    console.log(`创建WebSocket管理器: ${this.connectionId}, URL: ${url}`);
  }

  /**
   * 添加消息处理器
   * @param type 消息类型
   * @param handler 处理函数
   */
  addMessageHandler(type: string, handler: (data: any) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    // 如果WebSocket尚未连接，则连接
    if (
      !this.ws ||
      (this.ws.readyState !== WebSocket.OPEN &&
        this.ws.readyState !== WebSocket.CONNECTING)
    ) {
      this.connect();
    }
  }

  /**
   * 移除消息处理器
   * @param type 消息类型
   * @param handler 处理函数
   */
  removeMessageHandler(type: string, handler: (data: any) => void): void {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type)!;
      handlers.delete(handler);

      // 如果没有处理器了，关闭连接
      if (this.getHandlerCount() === 0) {
        this.close();
      }
    }
  }

  /**
   * 获取处理器总数
   */
  private getHandlerCount(): number {
    let count = 0;
    this.messageHandlers.forEach((handlers) => {
      count += handlers.size;
    });
    return count;
  }

  /**
   * 连接WebSocket
   */
  private connect(): void {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      console.log(`WebSocket已连接或正在连接中: ${this.connectionId}`);
      return;
    }

    console.log(`开始连接WebSocket: ${this.connectionId}`);
    this.isClosing = false;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error(`创建WebSocket连接失败: ${error}`);
      // 如果创建失败，尝试重连
      this.handleReconnect();
    }
  }

  /**
   * 处理重连
   */
  private handleReconnect(): void {
    if (
      !this.isClosing &&
      this.getHandlerCount() > 0 &&
      this.reconnectAttempts < this.maxReconnectAttempts
    ) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(
        `${delay}ms后尝试重连 ${this.connectionId}，尝试次数: ${
          this.reconnectAttempts + 1
        }`
      );

      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
  }

  /**
   * 关闭WebSocket连接
   */
  close(): void {
    console.log(`关闭WebSocket连接: ${this.connectionId}`);
    this.isClosing = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      this.ws.close();
    }

    this.ws = null;

    // 从全局实例映射中移除
    wsManagerInstances.delete(this.url);
  }

  /**
   * 处理连接打开事件
   */
  private handleOpen(): void {
    console.log(`WebSocket连接已建立: ${this.connectionId}`);
    this.reconnectAttempts = 0;
  }

  /**
   * 处理接收消息事件
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log(`收到WebSocket消息类型: ${data.e || "未知"}`);

      // 根据消息类型调用对应的处理函数
      if (data.e && this.messageHandlers.has(data.e)) {
        const handlers = this.messageHandlers.get(data.e)!;
        handlers.forEach((handler) => {
          try {
            handler(data);
          } catch (error) {
            console.error(`处理WebSocket消息时出错: ${error}`);
          }
        });
      }
    } catch (error) {
      console.error("处理WebSocket消息失败:", error);
    }
  }

  /**
   * 处理错误事件
   */
  private handleError(error: Event): void {
    console.error(`WebSocket错误 ${this.connectionId}:`, error);
  }

  /**
   * 处理连接关闭事件
   */
  private handleClose(event: CloseEvent): void {
    console.log(
      `WebSocket连接已关闭 ${this.connectionId}，代码: ${event.code}, 原因: ${
        event.reason || "未知"
      }`
    );

    // 如果不是主动关闭且还有处理器，尝试重连
    if (
      !this.isClosing &&
      this.getHandlerCount() > 0 &&
      this.reconnectAttempts < this.maxReconnectAttempts &&
      event.code !== 1000 // 正常关闭不重连
    ) {
      this.handleReconnect();
    } else if (this.getHandlerCount() === 0) {
      // 如果没有处理器了，从全局实例映射中移除
      wsManagerInstances.delete(this.url);
    }
  }
}
