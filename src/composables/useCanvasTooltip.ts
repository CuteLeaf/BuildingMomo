import { ref, type Ref } from 'vue'
import type { useFurnitureStore } from '../stores/furnitureStore'
import type { AppItem } from '../types/editor'
import { createCanvas2DCoordinates, type Position2D } from '@/lib/coordinates'
import { useSettingsStore } from '../stores/settingsStore'

export interface TooltipData {
  name: string
  icon: string
  position: { x: number; y: number } // 屏幕坐标
}

export function useCanvasTooltip(
  furnitureStore: ReturnType<typeof useFurnitureStore>,
  findItemAtPosition: (pos: Position2D) => AppItem | null,
  isEnabled: Ref<boolean>,
  stageRef: Ref<any>
) {
  // ========== 状态 ==========
  const tooltipVisible = ref(false)
  const tooltipData = ref<TooltipData | null>(null)
  const settingsStore = useSettingsStore()

  // ========== 坐标转换 ==========
  const { screenToWorld } = createCanvas2DCoordinates(stageRef)

  // ========== 方法 ==========

  // 处理鼠标移动
  function handleStageMouseMove(e: any, isDragging: boolean, isSelecting: boolean) {
    // 如果功能未启用，隐藏 tooltip
    if (!isEnabled.value) {
      hideTooltip()
      return
    }

    // 如果正在拖拽或框选，隐藏 tooltip
    if (isDragging || isSelecting) {
      hideTooltip()
      return
    }

    const stage = e.target.getStage()
    const pointerPos = stage?.getPointerPosition()
    if (!pointerPos) return

    // 转世界坐标
    const worldPos = screenToWorld(pointerPos)

    // 碰撞检测
    const hoveredItem = findItemAtPosition(worldPos)

    if (hoveredItem) {
      // 立即显示 tooltip
      const furnitureInfo = furnitureStore.getFurniture(hoveredItem.gameId)

      // 获取当前缩放级别，当画布图标不显示时，tooltip 显示图标
      const currentScale = stage?.scaleX() || 1
      const shouldShowIcon = currentScale <= settingsStore.settings.iconShowThreshold

      tooltipData.value = {
        name: furnitureInfo?.name_cn || `物品 ${hoveredItem.gameId}`,
        icon: shouldShowIcon && furnitureInfo ? furnitureStore.getIconUrl(hoveredItem.gameId) : '',
        position: { x: pointerPos.x, y: pointerPos.y },
      }
      tooltipVisible.value = true
    } else {
      hideTooltip()
    }
  }

  // 隐藏 tooltip
  function hideTooltip() {
    tooltipVisible.value = false
    tooltipData.value = null
  }

  return {
    tooltipVisible,
    tooltipData,
    handleStageMouseMove,
    hideTooltip,
  }
}
