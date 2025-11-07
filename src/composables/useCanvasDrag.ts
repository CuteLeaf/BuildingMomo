import { ref, computed, type Ref } from 'vue'
import type { useEditorStore } from '../stores/editorStore'
import type { AppItem } from '../types/editor'

export function useCanvasDrag(
  editorStore: ReturnType<typeof useEditorStore>,
  selectedLayerRef: Ref<any>
) {
  // 拖拽状态
  const dragStartPositions = ref<Map<string, { x: number; y: number }>>(new Map())
  const isDragging = ref(false)
  const isAltPressed = ref(false)

  // 计算属性：选中的物品
  const selectedItems = computed(() => {
    return editorStore.visibleItems.filter((item) =>
      editorStore.selectedItemIds.has(item.internalId)
    )
  })

  // 拖拽功能
  function handleDragStart(_draggedItem: AppItem, e: any) {
    isDragging.value = true
    isAltPressed.value = e.evt.altKey

    if (isAltPressed.value) {
      // Alt 复制：复制选中物品并开始拖拽副本
      editorStore.duplicateSelected(0, 0)
      // 注意：复制后 selectedItems 会更新为新副本
    }

    // 记录所有选中圆点的初始位置
    dragStartPositions.value.clear()
    selectedItems.value.forEach((item) => {
      dragStartPositions.value.set(item.internalId, { x: item.x, y: item.y })
    })
  }

  function handleDragMove(draggedItem: AppItem, e: any) {
    const node = e.target
    const newX = node.x()
    const newY = node.y()

    // 计算偏移量
    const startPos = dragStartPositions.value.get(draggedItem.internalId)
    if (!startPos) return

    const dx = newX - startPos.x
    const dy = newY - startPos.y

    // 同步移动其他选中圆点
    const layer = selectedLayerRef.value?.getNode()
    if (!layer) return

    selectedItems.value.forEach((item) => {
      if (item.internalId === draggedItem.internalId) return

      const itemStartPos = dragStartPositions.value.get(item.internalId)
      if (itemStartPos) {
        const circles = layer.find('.selectedCircle')
        const circle = circles?.find((c: any) => c.attrs.itemId === item.internalId)
        if (circle) {
          circle.x(itemStartPos.x + dx)
          circle.y(itemStartPos.y + dy)
        }
      }
    })

    layer.batchDraw()
  }

  function handleDragEnd(draggedItem: AppItem, e: any) {
    if (!isDragging.value) return

    const node = e.target
    const newX = node.x()
    const newY = node.y()

    const startPos = dragStartPositions.value.get(draggedItem.internalId)
    if (!startPos) return

    const dx = newX - startPos.x
    const dy = newY - startPos.y

    // 更新 store 中所有选中物品的位置
    editorStore.moveSelectedItems(dx, dy)

    // 清空拖拽状态
    dragStartPositions.value.clear()
    isDragging.value = false
    isAltPressed.value = false
  }

  return {
    isDragging,
    selectedItems,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
  }
}
