import Logger from '@/utils/Logger';
import { useSettingsStore } from '@/stores/settingsStore';

const logger = Logger.withTag('VideoProxy');

interface ProxyConfig {
  enabled: boolean;
  serverUrl: string;
}

class VideoProxyService {
  private getConfig(): ProxyConfig {
    // Get current state from store
    const state = useSettingsStore.getState();
    return state.videoProxy;
  }

  setConfig(config: Partial<ProxyConfig>) {
    // Update store with new config
    const state = useSettingsStore.getState();
    const current = state.videoProxy;
    state.setVideoProxy({ ...current, ...config });
  }

  /**
   * 生成代理URL
   */
  getProxyUrl(originalUrl: string): string {
    const config = this.getConfig();
    if (!config.enabled) {
      return originalUrl;
    }

    const proxyUrl = `${config.serverUrl}?url=${encodeURIComponent(originalUrl)}`;
    return proxyUrl;
  }

  /**
   * 预缓存视频内容
   */
  async preCacheVideo(url: string): Promise<boolean> {
    try {
      const config = this.getConfig();
      if (!config.enabled) {
        return true;
      }
      const proxyUrl = this.getProxyUrl(url);
      // 发送HEAD请求来触发缓存
      const response = await fetch(proxyUrl, { method: 'HEAD' });
      logger.info(`Pre-cached video: ${url.substring(0, 100)}..., status: ${response.status}`);
      return response.ok;
    } catch (error) {
      logger.error('Failed to pre-cache video:', error);
      return false;
    }
  }
}

// 导出单例
export default new VideoProxyService();
