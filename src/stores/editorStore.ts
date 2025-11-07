import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AppItem, GameItem, GameDataFile, HeightFilter } from '../types/editor'

// 生成简单的UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export const useEditorStore = defineStore('editor', () => {
  // 状态
  const items = ref<AppItem[]>([])
  const heightFilter = ref<HeightFilter>({
    min: 0,
    max: 0,
    currentMin: 0,
    currentMax: 0
  })
  
  // 初始视图配置（用于重置视图）
  const initialViewConfig = ref<{scale: number, x: number, y: number} | null>(null)

  // 计算属性：边界框
  const bounds = computed(() => {
    if (items.value.length === 0) return null
    
    const xs = items.value.map(i => i.x)
    const ys = items.value.map(i => i.y)
    
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    
    return {
      minX,
      maxX,
      minY,
      maxY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY
    }
  })
  
  // 计算属性：可见物品（经过高度过滤）
  const visibleItems = computed(() => {
    return items.value.filter(item => 
      item.z >= heightFilter.value.currentMin && 
      item.z <= heightFilter.value.currentMax
    )
  })

  // 计算属性：统计信息
  const stats = computed(() => ({
    totalItems: items.value.length,
    visibleItems: visibleItems.value.length,
    zRange: {
      min: heightFilter.value.min,
      max: heightFilter.value.max
    }
  }))

  // 导入JSON数据
  function importJSON(fileContent: string) {
    try {
      const data: GameDataFile = JSON.parse(fileContent)
      
      if (!data.PlaceInfo || !Array.isArray(data.PlaceInfo)) {
        throw new Error('Invalid JSON format: PlaceInfo array not found')
      }

      // 转换为内部数据格式
      const newItems: AppItem[] = data.PlaceInfo.map((gameItem: GameItem) => ({
        internalId: generateUUID(),
        gameId: gameItem.ItemID,
        instanceId: gameItem.InstanceID,
        x: gameItem.Location.X,
        y: gameItem.Location.Y,
        z: gameItem.Location.Z,
        originalData: gameItem
      }))

      items.value = newItems

      // 自动计算Z轴范围
      if (newItems.length > 0) {
        const zValues = newItems.map(item => item.z)
        const minZ = Math.min(...zValues)
        const maxZ = Math.max(...zValues)
        
        heightFilter.value = {
          min: minZ,
          max: maxZ,
          currentMin: minZ,
          currentMax: maxZ
        }
      }

      return { success: true, itemCount: newItems.length }
    } catch (error) {
      console.error('Failed to import JSON:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // 更新高度过滤器
  function updateHeightFilter(newMin: number, newMax: number) {
    heightFilter.value.currentMin = newMin
    heightFilter.value.currentMax = newMax
  }

  // 清空数据
  function clearData() {
    items.value = []
    heightFilter.value = {
      min: 0,
      max: 0,
      currentMin: 0,
      currentMax: 0
    }
  }

  return {
    items,
    heightFilter,
    bounds,
    visibleItems,
    stats,
    initialViewConfig,
    importJSON,
    updateHeightFilter,
    clearData
  }
})
