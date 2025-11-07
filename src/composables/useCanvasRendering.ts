import { ref, watch, type Ref } from 'vue'
import type { useEditorStore } from '../stores/editorStore'
import Konva from 'konva'

export function useCanvasRendering(
  editorStore: ReturnType<typeof useEditorStore>,
  scale: Ref<number>
) {
  // Layer 引用
  const mainLayerRef = ref<any>(null)
  const interactionLayerRef = ref<any>(null)

  // 是否隐藏选中物品（拖拽时使用）
  const hideSelectedItems = ref(false)

  // 批量绘制所有物品
  function updateMainLayer() {
    const layer = mainLayerRef.value?.getNode()
    if (!layer) return

    // 清空现有内容
    layer.destroyChildren()

    const visibleItems = editorStore.visibleItems
    if (visibleItems.length === 0) {
      layer.batchDraw()
      return
    }

    // 创建批量绘制的 Shape
    const shape = new Konva.Shape({
      sceneFunc: (context) => {
        const radius = Math.max(4, 6 / scale.value)
        const strokeWidth = Math.max(0.5, 1 / scale.value)

        visibleItems.forEach((item) => {
          const isSelected = editorStore.selectedItemIds.has(item.internalId)
          
          // 拖拽时跳过选中物品的渲染
          if (hideSelectedItems.value && isSelected) return

          context.beginPath()
          context.arc(item.x, item.y, radius, 0, Math.PI * 2, false)
          
          // 选中物品用蓝色，未选中用灰色
          context.fillStyle = isSelected ? '#3b82f6' : '#94a3b8'
          context.fill()
          context.strokeStyle = isSelected ? '#2563eb' : '#475569'
          context.lineWidth = strokeWidth
          context.stroke()
        })
      },
      // 启用碰撞检测
      hitFunc: (context, shape) => {
        const radius = Math.max(4, 6 / scale.value)
        const hitRadius = radius + Math.max(2, 4 / scale.value)

        visibleItems.forEach((item) => {
          // 拖拽时跳过选中物品的碰撞检测
          if (hideSelectedItems.value && editorStore.selectedItemIds.has(item.internalId)) return

          context.beginPath()
          context.arc(item.x, item.y, hitRadius, 0, Math.PI * 2, false)
          context.fillStrokeShape(shape)
        })
      },
    })

    layer.add(shape)
    layer.batchDraw()
  }

  // 设置是否隐藏选中物品
  function setHideSelectedItems(hide: boolean) {
    hideSelectedItems.value = hide
    updateMainLayer()
  }

  // 监听变化，自动更新
  watch(
    () => [
      editorStore.visibleItems.length,
      editorStore.selectedItemIds.size,
      editorStore.heightFilter.currentMin,
      editorStore.heightFilter.currentMax,
      scale.value,
    ],
    () => {
      updateMainLayer()
    },
    { immediate: true }
  )

  return {
    mainLayerRef,
    interactionLayerRef,
    updateMainLayer,
    setHideSelectedItems,
  }
}
