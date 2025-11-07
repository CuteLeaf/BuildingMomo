import { ref, type Ref } from 'vue'
import type { useEditorStore } from '../stores/editorStore'
import Konva from 'konva'

export function useCanvasDrag(
  editorStore: ReturnType<typeof useEditorStore>,
  stageRef: Ref<any>,
  scale: Ref<number>,
  setHideSelectedItems: (hide: boolean) => void
) {
  // 拖拽状态
  const isDragging = ref(false)
  const ghostLayer = ref<Konva.Layer | null>(null)
  const dragStartPos = ref({ x: 0, y: 0 })

  // 创建 Ghost Layer
  function createGhostLayer() {
    const stage = stageRef.value?.getNode()
    if (!stage) return null

    const layer = new Konva.Layer()
    
    // 获取选中物品
    const selectedItems = editorStore.visibleItems.filter((item) =>
      editorStore.selectedItemIds.has(item.internalId)
    )

    // 批量绘制选中物品
    const ghostShape = new Konva.Shape({
      sceneFunc: (context) => {
        const radius = Math.max(4, 6 / scale.value)
        const strokeWidth = Math.max(0.5, 1 / scale.value)

        selectedItems.forEach((item) => {
          context.beginPath()
          context.arc(item.x, item.y, radius, 0, Math.PI * 2, false)
          context.fillStyle = '#3b82f6'
          context.fill()
          context.strokeStyle = '#2563eb'
          context.lineWidth = strokeWidth
          context.stroke()
        })
      },
      listening: false, // Ghost Layer 不需要事件监听
    })

    layer.add(ghostShape)
    stage.add(layer)
    layer.moveToTop() // 确保在最上层
    layer.batchDraw()

    return layer
  }

  // 开始拖拽
  function startDrag(worldPos: { x: number; y: number }, isAltPressed: boolean) {
    // Alt 复制：立即复制选中物品
    if (isAltPressed) {
      editorStore.duplicateSelected(0, 0)
    }

    isDragging.value = true
    dragStartPos.value = { x: worldPos.x, y: worldPos.y }

    // 创建 Ghost Layer
    ghostLayer.value = createGhostLayer()

    // 隐藏主 Layer 上的选中物品
    setHideSelectedItems(true)
  }

  // 拖拽移动
  function moveDrag(worldPos: { x: number; y: number }) {
    if (!isDragging.value || !ghostLayer.value) return

    const dx = worldPos.x - dragStartPos.value.x
    const dy = worldPos.y - dragStartPos.value.y

    // 只移动整个 Ghost Layer
    ghostLayer.value.position({ x: dx, y: dy })
    ghostLayer.value.batchDraw()
  }

  // 结束拖拽
  function endDrag(worldPos: { x: number; y: number }) {
    if (!isDragging.value || !ghostLayer.value) return

    const dx = worldPos.x - dragStartPos.value.x
    const dy = worldPos.y - dragStartPos.value.y

    // 更新 store 中所有选中物品的位置
    editorStore.moveSelectedItems(dx, dy)

    // 清理 Ghost Layer
    ghostLayer.value.destroy()
    ghostLayer.value = null
    isDragging.value = false

    // 恢复主 Layer 上的选中物品显示
    setHideSelectedItems(false)
  }

  // 取消拖拽
  function cancelDrag() {
    if (!isDragging.value) return

    // 清理 Ghost Layer
    if (ghostLayer.value) {
      ghostLayer.value.destroy()
      ghostLayer.value = null
    }

    isDragging.value = false

    // 恢复主 Layer 上的选中物品显示
    setHideSelectedItems(false)
  }

  return {
    isDragging,
    startDrag,
    moveDrag,
    endDrag,
    cancelDrag,
  }
}
