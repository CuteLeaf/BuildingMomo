import { Data3DTexture, RGBAFormat, LinearFilter, ClampToEdgeWrapping } from 'three'
import { getIconLoader } from './useIconLoader'

/**
 * Three.js 纹理数组管理器（使用 Data3DTexture）
 * 需要 WebGL2 支持
 * 使用动态容量管理，按需扩展以节省内存
 */
export function useThreeTextureArray() {
  const iconLoader = getIconLoader()

  // 配置
  const ICON_SIZE = 256 // 每个图标的尺寸（必须统一）- 优化：从512降到256
  const INITIAL_CAPACITY = 32 // 初始容量（层数）
  const MAX_CAPACITY = 1024 // 最大容量限制

  // 纹理数组（3D 纹理）
  let textureArray: Data3DTexture | null = null

  // 映射：itemId -> 纹理数组索引
  const textureIndexMap = new Map<number, number>()

  // 下一个可用的索引
  let nextIndex = 0

  // 纹理数据缓冲区（动态分配）
  let textureData: Uint8Array | null = null

  // 当前容量（层数）
  let currentCapacity = 0

  /**
   * 初始化纹理数组（按指定容量创建）
   */
  function initTextureArray(capacity: number = INITIAL_CAPACITY): Data3DTexture {
    if (textureArray && currentCapacity >= capacity) {
      return textureArray
    }

    // 释放旧纹理
    if (textureArray) {
      textureArray.dispose()
      textureArray = null
    }

    // 确保容量是2的幂次（GPU友好）
    const alignedCapacity = Math.pow(2, Math.ceil(Math.log2(capacity)))
    currentCapacity = Math.min(alignedCapacity, MAX_CAPACITY)

    // 分配 3D 纹理数据：width × height × depth × 4 (RGBA)
    const size = ICON_SIZE * ICON_SIZE * currentCapacity * 4
    textureData = new Uint8Array(size)

    // 填充默认颜色（深灰色背景）
    for (let i = 0; i < size; i += 4) {
      textureData[i] = 51 // R
      textureData[i + 1] = 51 // G
      textureData[i + 2] = 51 // B
      textureData[i + 3] = 255 // A
    }

    // 创建 Data3DTexture（真正的 3D 纹理）
    textureArray = new Data3DTexture(textureData, ICON_SIZE, ICON_SIZE, currentCapacity)
    textureArray.format = RGBAFormat
    textureArray.minFilter = LinearFilter
    textureArray.magFilter = LinearFilter
    textureArray.wrapS = ClampToEdgeWrapping
    textureArray.wrapT = ClampToEdgeWrapping
    textureArray.wrapR = ClampToEdgeWrapping
    textureArray.needsUpdate = true

    const memoryMB = (size / (1024 * 1024)).toFixed(2)
    console.log(
      `[TextureArray] 初始化完成，纹理尺寸: ${ICON_SIZE}x${ICON_SIZE}x${currentCapacity}，内存占用: ${memoryMB}MB`
    )

    return textureArray
  }

  /**
   * 扩展纹理数组容量
   */
  function expandCapacity(newCapacity: number): boolean {
    if (!textureData || !textureArray) {
      console.error('[TextureArray] 纹理数组未初始化')
      return false
    }

    if (newCapacity <= currentCapacity) {
      return true // 无需扩展
    }

    if (newCapacity > MAX_CAPACITY) {
      console.warn(`[TextureArray] 请求容量 ${newCapacity} 超过最大限制 ${MAX_CAPACITY}`)
      newCapacity = MAX_CAPACITY
      if (currentCapacity >= MAX_CAPACITY) {
        return false
      }
    }

    // 对齐到2的幂次
    const alignedCapacity = Math.pow(2, Math.ceil(Math.log2(newCapacity)))
    const targetCapacity = Math.min(alignedCapacity, MAX_CAPACITY)

    console.log(`[TextureArray] 扩容: ${currentCapacity} -> ${targetCapacity} 层`)

    // 保存旧数据
    const oldData = textureData
    const oldCapacity = currentCapacity

    // 创建新数组
    const newSize = ICON_SIZE * ICON_SIZE * targetCapacity * 4
    textureData = new Uint8Array(newSize)

    // 复制旧数据
    const oldSize = ICON_SIZE * ICON_SIZE * oldCapacity * 4
    textureData.set(oldData.subarray(0, oldSize))

    // 填充新增部分的默认颜色
    for (let i = oldSize; i < newSize; i += 4) {
      textureData[i] = 51 // R
      textureData[i + 1] = 51 // G
      textureData[i + 2] = 51 // B
      textureData[i + 3] = 255 // A
    }

    // 释放旧纹理
    textureArray.dispose()

    // 创建新纹理
    textureArray = new Data3DTexture(textureData, ICON_SIZE, ICON_SIZE, targetCapacity)
    textureArray.format = RGBAFormat
    textureArray.minFilter = LinearFilter
    textureArray.magFilter = LinearFilter
    textureArray.wrapS = ClampToEdgeWrapping
    textureArray.wrapT = ClampToEdgeWrapping
    textureArray.wrapR = ClampToEdgeWrapping
    textureArray.needsUpdate = true

    currentCapacity = targetCapacity

    const memoryMB = (newSize / (1024 * 1024)).toFixed(2)
    console.log(`[TextureArray] 扩容完成，内存占用: ${memoryMB}MB`)

    return true
  }

  /**
   * 确保有足够的容量
   */
  function ensureCapacity(requiredCapacity: number): boolean {
    if (currentCapacity >= requiredCapacity) {
      return true
    }

    // 预留20%余量，避免频繁扩容
    const targetCapacity = Math.ceil(requiredCapacity * 1.2)
    return expandCapacity(targetCapacity)
  }

  /**
   * 将图标添加到纹理数组
   * @param itemId 家具 ItemID
   * @returns Promise<boolean> 成功返回 true
   */
  async function addIconToArray(itemId: number): Promise<boolean> {
    if (!textureData || !textureArray) {
      console.error('[TextureArray] 纹理数组未初始化')
      return false
    }

    // 如果已存在，直接返回
    if (textureIndexMap.has(itemId)) {
      return true
    }

    // 确保有足够容量
    if (nextIndex >= currentCapacity) {
      const success = ensureCapacity(nextIndex + 1)
      if (!success) {
        console.warn(`[TextureArray] 无法扩容，已达最大容量 ${MAX_CAPACITY}，无法添加 ItemID ${itemId}`)
        return false
      }
    }

    // 加载图标
    const icon = await iconLoader.loadIcon(itemId)
    if (!icon || !icon.complete) {
      console.warn(`[TextureArray] 图标加载失败: ItemID ${itemId}`)
      return false
    }

    // 创建临时 Canvas 读取像素数据
    const canvas = document.createElement('canvas')
    canvas.width = ICON_SIZE
    canvas.height = ICON_SIZE
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      console.error('[TextureArray] 无法创建 Canvas 上下文')
      return false
    }

    // 绘制并调整尺寸到统一大小
    ctx.drawImage(icon, 0, 0, ICON_SIZE, ICON_SIZE)

    // 读取像素数据
    const imageData = ctx.getImageData(0, 0, ICON_SIZE, ICON_SIZE)
    const pixels = imageData.data

    // 将像素写入纹理数组的对应层
    const layerOffset = nextIndex * ICON_SIZE * ICON_SIZE * 4

    for (let i = 0; i < pixels.length; i++) {
      textureData[layerOffset + i] = pixels[i] ?? 0
    }

    // 记录映射
    textureIndexMap.set(itemId, nextIndex)
    nextIndex++

    // 标记纹理需要更新
    textureArray.needsUpdate = true

    return true
  }

  /**
   * 批量预加载图标到纹理数组
   * @param itemIds 家具 ItemID 列表
   */
  async function preloadIcons(itemIds: number[]): Promise<void> {
    const uniqueIds = Array.from(new Set(itemIds)) // 去重

    // 过滤出未加载的图标
    const unloadedIds = uniqueIds.filter((id) => !textureIndexMap.has(id))

    if (unloadedIds.length === 0) {
      return // 所有图标已加载
    }

    // 确保有足够容量（一次性扩容，避免多次扩容）
    const requiredCapacity = textureIndexMap.size + unloadedIds.length
    if (!ensureCapacity(requiredCapacity)) {
      console.warn(`[TextureArray] 容量不足，部分图标可能无法加载`)
    }

    const promises = unloadedIds.map((id) => addIconToArray(id))
    const results = await Promise.allSettled(promises)

    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value).length
    console.log(`[TextureArray] 预加载完成: ${successCount}/${unloadedIds.length} 个图标`)
  }

  /**
   * 获取图标的纹理索引
   * @param itemId 家具 ItemID
   * @returns 纹理数组索引，如果不存在返回 0（默认层）
   */
  function getTextureIndex(itemId: number): number {
    return textureIndexMap.get(itemId) ?? 0
  }

  /**
   * 获取当前纹理数组
   */
  function getTextureArray(): Data3DTexture | null {
    return textureArray
  }

  /**
   * 获取当前容量
   */
  function getCurrentCapacity(): number {
    return currentCapacity
  }

  /**
   * 获取统计信息
   */
  function getStats() {
    const memoryMB = currentCapacity > 0 ? (ICON_SIZE * ICON_SIZE * currentCapacity * 4) / (1024 * 1024) : 0
    return {
      currentCapacity,
      maxCapacity: MAX_CAPACITY,
      usedTextures: nextIndex,
      loadedIcons: textureIndexMap.size,
      iconSize: ICON_SIZE,
      memoryMB: memoryMB.toFixed(2),
    }
  }

  /**
   * 清理资源
   */
  function dispose() {
    if (textureArray) {
      textureArray.dispose()
      textureArray = null
    }
    textureData = null
    textureIndexMap.clear()
    nextIndex = 0
    console.log('[TextureArray] 资源已清理')
  }

  return {
    initTextureArray,
    addIconToArray,
    preloadIcons,
    getTextureIndex,
    getTextureArray,
    getCurrentCapacity,
    getStats,
    dispose,
  }
}

// 创建单例实例（带引用计数）
let arrayInstance: ReturnType<typeof useThreeTextureArray> | null = null
let refCount = 0

/**
 * 获取纹理数组单例（增加引用计数）
 * 每次调用都会增加引用计数，使用完毕后必须调用 releaseThreeTextureArray() 释放
 */
export function getThreeTextureArray(): ReturnType<typeof useThreeTextureArray> {
  if (!arrayInstance) {
    arrayInstance = useThreeTextureArray()
    arrayInstance.initTextureArray() // 立即初始化
    console.log('[TextureArray] 创建新实例')
  }
  refCount++
  console.log(`[TextureArray] 引用计数: ${refCount}`)
  return arrayInstance
}

/**
 * 释放纹理数组单例的引用（减少引用计数）
 * 当引用计数归零时，自动清理资源
 */
export function releaseThreeTextureArray(): void {
  if (refCount <= 0) {
    console.warn('[TextureArray] 引用计数已为0，无需释放')
    return
  }

  refCount--
  console.log(`[TextureArray] 引用计数: ${refCount}`)

  // 当引用计数归零时，清理实例
  if (refCount === 0 && arrayInstance) {
    console.log('[TextureArray] 引用计数归零，清理资源')
    arrayInstance.dispose()
    arrayInstance = null
  }
}
