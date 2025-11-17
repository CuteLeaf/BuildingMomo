import { Texture, CanvasTexture, LinearFilter } from 'three'
import { getIconLoader } from './useIconLoader'

/**
 * Three.js 图标纹理管理器
 * 负责将 2D 图标转换为 Three.js 纹理
 */
export function useThreeIconTextureManager() {
  // 纹理缓存: itemId -> Texture
  const textureCache = new Map<number, Texture>()

  // 正在加载的纹理 Promise
  const loadingPromises = new Map<number, Promise<Texture>>()

  // 图标加载器（复用 2D 系统）
  const iconLoader = getIconLoader()

  // 占位符纹理（用于没有图标或加载失败的情况）
  let placeholderTexture: Texture | null = null

  /**
   * 创建占位符纹理
   * 生成一个简单的渐变图案
   */
  function createPlaceholderTexture(): Texture {
    if (placeholderTexture) {
      return placeholderTexture
    }

    // 创建 Canvas 绘制占位符图案
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')

    if (ctx) {
      // 绘制渐变背景
      const gradient = ctx.createLinearGradient(0, 0, 128, 128)
      gradient.addColorStop(0, '#94a3b8') // slate-400
      gradient.addColorStop(1, '#64748b') // slate-500
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 128, 128)

      // 绘制边框
      ctx.strokeStyle = '#475569' // slate-600
      ctx.lineWidth = 4
      ctx.strokeRect(2, 2, 124, 124)

      // 绘制问号（表示未知图标）
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 64px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('?', 64, 64)
    }

    placeholderTexture = new CanvasTexture(canvas)
    placeholderTexture.minFilter = LinearFilter
    placeholderTexture.magFilter = LinearFilter

    return placeholderTexture
  }

  /**
   * 将 HTMLImageElement 转换为 Three.js Texture
   */
  function imageToTexture(image: HTMLImageElement): Texture {
    const texture = new Texture(image)
    texture.needsUpdate = true

    // 设置纹理过滤，防止缩放时模糊
    texture.minFilter = LinearFilter
    texture.magFilter = LinearFilter

    return texture
  }

  /**
   * 异步加载纹理
   * @param itemId 家具 ItemID
   * @returns Promise<Texture>
   */
  async function loadTexture(itemId: number): Promise<Texture> {
    // 1. 检查缓存
    if (textureCache.has(itemId)) {
      return textureCache.get(itemId)!
    }

    // 2. 检查是否正在加载
    if (loadingPromises.has(itemId)) {
      return loadingPromises.get(itemId)!
    }

    // 3. 开始加载
    const promise = (async () => {
      try {
        // 从图标加载器获取图片
        const image = await iconLoader.loadIcon(itemId)

        if (image && image.complete) {
          // 成功加载，转换为纹理
          const texture = imageToTexture(image)
          textureCache.set(itemId, texture)
          loadingPromises.delete(itemId)
          return texture
        } else {
          // 加载失败，使用占位符
          console.warn(`[ThreeIconTextureManager] No icon for ItemID ${itemId}, using placeholder`)
          const placeholder = createPlaceholderTexture()
          textureCache.set(itemId, placeholder)
          loadingPromises.delete(itemId)
          return placeholder
        }
      } catch (error) {
        console.error(
          `[ThreeIconTextureManager] Failed to load texture for ItemID ${itemId}:`,
          error
        )
        const placeholder = createPlaceholderTexture()
        textureCache.set(itemId, placeholder)
        loadingPromises.delete(itemId)
        return placeholder
      }
    })()

    loadingPromises.set(itemId, promise)
    return promise
  }

  /**
   * 批量预加载纹理
   * @param itemIds 家具 ItemID 列表
   */
  async function preloadTextures(itemIds: number[]): Promise<void> {
    const promises = itemIds.map((id) => loadTexture(id))
    await Promise.allSettled(promises)
  }

  /**
   * 同步获取纹理（仅返回已缓存的）
   * @param itemId 家具 ItemID
   * @returns Texture（如果未加载，返回占位符）
   */
  function getTexture(itemId: number): Texture {
    // 如果有缓存，直接返回
    if (textureCache.has(itemId)) {
      return textureCache.get(itemId)!
    }

    // 否则返回占位符（并异步加载真实纹理）
    loadTexture(itemId).catch((err) => {
      console.warn(`[ThreeIconTextureManager] Background load failed for ${itemId}:`, err)
    })

    return createPlaceholderTexture()
  }

  /**
   * 清理所有纹理资源
   */
  function dispose(): void {
    textureCache.forEach((texture) => {
      texture.dispose()
    })
    textureCache.clear()
    loadingPromises.clear()

    if (placeholderTexture) {
      placeholderTexture.dispose()
      placeholderTexture = null
    }
  }

  /**
   * 获取缓存统计信息
   */
  function getCacheStats() {
    return {
      cachedCount: textureCache.size,
      loadingCount: loadingPromises.size,
    }
  }

  return {
    loadTexture,
    preloadTextures,
    getTexture,
    createPlaceholderTexture,
    dispose,
    getCacheStats,
  }
}

// 创建单例实例
let textureManagerInstance: ReturnType<typeof useThreeIconTextureManager> | null = null

/**
 * 获取纹理管理器单例
 */
export function getThreeIconTextureManager(): ReturnType<typeof useThreeIconTextureManager> {
  if (!textureManagerInstance) {
    textureManagerInstance = useThreeIconTextureManager()
  }
  return textureManagerInstance
}
