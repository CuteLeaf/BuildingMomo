import { computed, ref, watchEffect, markRaw, type Ref } from 'vue'
import { Object3D, Vector3 } from 'three'
import type { useEditorStore } from '@/stores/editorStore'
import { coordinates3D } from '@/lib/coordinates'

export function useThreeTransformGizmo(
  editorStore: ReturnType<typeof useEditorStore>,
  pivotRef: Ref<Object3D | null>
) {
  const isTransformDragging = ref(false)
  const dragStartWorld = ref<Vector3 | null>(null)
  const lastApplied = ref({ x: 0, y: 0, z: 0 })
  const hasStartedTransform = ref(false)

  const shouldShowGizmo = computed(() => editorStore.selectedItemIds.size > 0)

  // 跟随选中物品中心更新 gizmo 位置（非拖拽时）
  watchEffect(() => {
    if (isTransformDragging.value) return

    const center = editorStore.getSelectedItemsCenter?.()
    const pivot = pivotRef.value

    if (!center || !pivot) return

    // 使用坐标转换工具
    coordinates3D.setThreeFromGame(pivot.position, center)
  })

  function handleGizmoDragging(isDragging: boolean) {
    isTransformDragging.value = isDragging

    if (isDragging) {
      // 开始拖拽时记录初始状态
      const pivot = pivotRef.value
      if (!pivot) return
      dragStartWorld.value = markRaw(pivot.position.clone())
      lastApplied.value = { x: 0, y: 0, z: 0 }
      hasStartedTransform.value = false
    } else {
      // 结束拖拽时清理
      dragStartWorld.value = null
      lastApplied.value = { x: 0, y: 0, z: 0 }
      hasStartedTransform.value = false
    }
  }

  function handleGizmoMouseDown() {
    const pivot = pivotRef.value
    if (!pivot) return

    isTransformDragging.value = true
    dragStartWorld.value = markRaw(pivot.position.clone())
    lastApplied.value = { x: 0, y: 0, z: 0 }
    hasStartedTransform.value = false
  }

  function handleGizmoMouseUp() {
    isTransformDragging.value = false
    dragStartWorld.value = null
    lastApplied.value = { x: 0, y: 0, z: 0 }
    hasStartedTransform.value = false
  }

  function handleGizmoChange() {
    if (!isTransformDragging.value) return

    const pivot = pivotRef.value
    const start = dragStartWorld.value
    if (!pivot || !start) return

    const current = pivot.position

    const threeDelta = {
      x: current.x - start.x,
      y: current.y - start.y,
      z: current.z - start.z,
    }

    // Three 世界坐标增量 -> 游戏坐标增量
    const gameDelta = coordinates3D.threeDeltaToGameDelta(threeDelta)

    // 增量应用到选中物品
    const last = lastApplied.value
    const deltaX = gameDelta.x - last.x
    const deltaY = gameDelta.y - last.y
    const deltaZ = gameDelta.z - last.z

    if (deltaX === 0 && deltaY === 0 && deltaZ === 0) return

    // 第一次真正发生位移时保存历史
    if (!hasStartedTransform.value) {
      editorStore.saveHistory?.('edit')
      hasStartedTransform.value = true
    }

    if (editorStore.moveSelectedItems3D) {
      editorStore.moveSelectedItems3D(deltaX, deltaY, deltaZ)
    }

    lastApplied.value = { x: gameDelta.x, y: gameDelta.y, z: gameDelta.z }
  }

  return {
    shouldShowGizmo,
    isTransformDragging,
    handleGizmoDragging,
    handleGizmoMouseDown,
    handleGizmoMouseUp,
    handleGizmoChange,
  }
}
