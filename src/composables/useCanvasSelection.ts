import { ref, type Ref } from 'vue'
import type { useEditorStore } from '../stores/editorStore'
import type { AppItem } from '../types/editor'

export function useCanvasSelection(
  editorStore: ReturnType<typeof useEditorStore>,
  _stageRef: Ref<any>,
  scale: Ref<number>,
  isSpacePressed: Ref<boolean>
) {
  // 框选状态
  const selectionRect = ref<{ x: number; y: number; width: number; height: number } | null>(null)
  const isSelecting = ref(false)
  const selectionStart = ref<{ x: number; y: number } | null>(null)

  // 点选功能：手动碰撞检测
  function handleStageClick(e: any) {
    const stage = e.target.getStage()
    const pointerPos = stage.getPointerPosition()

    if (!pointerPos) return

    // 转换为世界坐标
    const worldPos = {
      x: (pointerPos.x - stage.x()) / stage.scaleX(),
      y: (pointerPos.y - stage.y()) / stage.scaleY(),
    }

    // 计算点击半径（考虑缩放补偿 + 容差）
    const clickRadius = Math.max(4, 6 / scale.value) + 2

    // 遍历可见物品，找到最近的圆点
    let clickedItem: AppItem | null = null
    let minDistance = clickRadius

    for (const item of editorStore.visibleItems) {
      const distance = Math.sqrt(
        Math.pow(item.x - worldPos.x, 2) + Math.pow(item.y - worldPos.y, 2)
      )
      if (distance < minDistance) {
        minDistance = distance
        clickedItem = item
      }
    }

    if (clickedItem) {
      // 检测 Shift 键
      const shiftPressed = e.evt.shiftKey
      editorStore.toggleSelection(clickedItem.internalId, shiftPressed)
    } else {
      // 点击空白处，清空选中
      if (!e.evt.shiftKey) {
        editorStore.clearSelection()
      }
    }
  }

  // 框选功能
  function handleMouseDown(e: any) {
    // 如果按住空格键，不触发框选（此时是画布拖拽模式）
    if (isSpacePressed.value) return

    // 只在点击 Stage 背景时触发框选
    if (e.target !== e.target.getStage()) return

    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()

    if (!pos) return

    // 转换为世界坐标
    const worldPos = {
      x: (pos.x - stage.x()) / stage.scaleX(),
      y: (pos.y - stage.y()) / stage.scaleY(),
    }

    isSelecting.value = true
    selectionStart.value = worldPos
    selectionRect.value = { x: worldPos.x, y: worldPos.y, width: 0, height: 0 }
  }

  function handleMouseMove(e: any) {
    if (!isSelecting.value || !selectionStart.value) return

    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()

    if (!pos) return

    const worldPos = {
      x: (pos.x - stage.x()) / stage.scaleX(),
      y: (pos.y - stage.y()) / stage.scaleY(),
    }

    // 更新框选矩形
    selectionRect.value = {
      x: Math.min(selectionStart.value.x, worldPos.x),
      y: Math.min(selectionStart.value.y, worldPos.y),
      width: Math.abs(worldPos.x - selectionStart.value.x),
      height: Math.abs(worldPos.y - selectionStart.value.y),
    }
  }

  function handleMouseUp(e: any) {
    // 如果正在框选，处理框选逻辑
    if (isSelecting.value && selectionRect.value) {
      // 检测矩形内的圆点
      const rect = selectionRect.value
      const selectedIds = editorStore.visibleItems
        .filter(
          (item) =>
            item.x >= rect.x &&
            item.x <= rect.x + rect.width &&
            item.y >= rect.y &&
            item.y <= rect.y + rect.height
        )
        .map((item) => item.internalId)

      // 更新选中状态
      const shiftPressed = e.evt.shiftKey
      editorStore.updateSelection(selectedIds, shiftPressed)
    } else {
      // 否则当作点击处理
      handleStageClick(e)
    }

    // 清除框选状态
    isSelecting.value = false
    selectionRect.value = null
    selectionStart.value = null
  }

  return {
    selectionRect,
    isSelecting,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  }
}
