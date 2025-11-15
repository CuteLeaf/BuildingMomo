import { ref, watch, markRaw, type Ref } from 'vue'
import {
  BoxGeometry,
  Color,
  DynamicDrawUsage,
  Euler,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three'
import type { useEditorStore } from '@/stores/editorStore'
import type { AppItem } from '@/types/editor'
import { coordinates3D } from '@/lib/coordinates'
import type { useFurnitureStore } from '@/stores/furnitureStore'

const MAX_INSTANCES = 10000

// 当缺少尺寸信息时使用的默认尺寸（游戏坐标：X=长, Y=宽, Z=高）
const DEFAULT_FURNITURE_SIZE: [number, number, number] = [100, 100, 150]

export function useThreeInstancedRenderer(
  editorStore: ReturnType<typeof useEditorStore>,
  furnitureStore: ReturnType<typeof useFurnitureStore>,
  isTransformDragging?: Ref<boolean>
) {
  const baseGeometry = new BoxGeometry(1, 1, 1)
  const material = new MeshStandardMaterial({
    transparent: true,
    opacity: 0.7,
  })

  const instancedMesh = ref<InstancedMesh | null>(null)

  const indexToIdMap = ref(new Map<number, string>())
  const idToIndexMap = ref(new Map<string, number>())

  // 当前 hover 的物品（仅 3D 视图内部使用，不改变全局选中状态）
  const hoveredItemId = ref<string | null>(null)

  // 初始化主体实例
  const mesh = new InstancedMesh(baseGeometry, material, MAX_INSTANCES)
  mesh.instanceMatrix.setUsage(DynamicDrawUsage)
  mesh.count = 0

  instancedMesh.value = markRaw(mesh)

  const scratchMatrix = markRaw(new Matrix4())
  const scratchPosition = markRaw(new Vector3())
  const scratchEuler = markRaw(new Euler())
  const scratchQuaternion = markRaw(new Quaternion())
  const scratchScale = markRaw(new Vector3())
  const scratchColor = markRaw(new Color())

  function convertColorToHex(colorStr: string | undefined): number {
    if (!colorStr) return 0x94a3b8
    const matches = colorStr.match(/\d+/g)
    if (!matches || matches.length < 3) return 0x94a3b8
    const r = parseInt(matches[0] ?? '148', 10)
    const g = parseInt(matches[1] ?? '163', 10)
    const b = parseInt(matches[2] ?? '184', 10)
    return (r << 16) | (g << 8) | b
  }

  function getItemColor(item: AppItem): number {
    // hover 高亮优先级最高（即使物品已被选中，hover 时也显示为橙色）
    if (hoveredItemId.value === item.internalId) {
      return 0xf97316
    }

    // 其次是选中高亮
    if (editorStore.selectedItemIds.has(item.internalId)) {
      return 0x3b82f6
    }

    const groupId = item.originalData.GroupID
    if (groupId > 0) {
      return convertColorToHex(editorStore.getGroupColor(groupId))
    }

    return 0x94a3b8
  }

  // 仅更新实例颜色（用于选中状态变化或 hover 变化时的刷新）
  function updateInstancesColor() {
    const meshTarget = instancedMesh.value
    if (!meshTarget) return

    const items = editorStore.visibleItems
    const map = indexToIdMap.value

    if (!map || map.size === 0) return

    const itemById = new Map<string, AppItem>()
    for (const item of items) {
      itemById.set(item.internalId, item)
    }

    for (const [index, id] of map.entries()) {
      const item = itemById.get(id)
      if (!item) continue

      const colorHex = getItemColor(item)
      scratchColor.setHex(colorHex)
      meshTarget.setColorAt(index, scratchColor)
    }

    if (meshTarget.instanceColor) {
      meshTarget.instanceColor.needsUpdate = true
    }
  }

  // 局部更新单个物品的颜色（用于 hover 状态变化）
  function updateInstanceColorById(id: string) {
    const meshTarget = instancedMesh.value
    if (!meshTarget) return

    const index = idToIndexMap.value.get(id)
    if (index === undefined) return

    const item = editorStore.visibleItems.find((it) => it.internalId === id)
    if (!item) return

    const colorHex = getItemColor(item)
    scratchColor.setHex(colorHex)
    meshTarget.setColorAt(index, scratchColor)

    if (meshTarget.instanceColor) {
      meshTarget.instanceColor.needsUpdate = true
    }
  }

  // 设置 hover 物品并局部刷新对应实例颜色
  function setHoveredItemId(id: string | null) {
    const prevId = hoveredItemId.value
    hoveredItemId.value = id

    // 先恢复上一个 hover 的颜色，再应用新的 hover 颜色
    if (prevId && prevId !== id) {
      updateInstanceColorById(prevId)
    }

    if (id) {
      updateInstanceColorById(id)
    }
  }

  // 完整重建实例几何和索引映射（用于物品集合变化时）
  function rebuildInstances() {
    const meshTarget = instancedMesh.value
    if (!meshTarget) return

    const items = editorStore.visibleItems
    const instanceCount = Math.min(items.length, MAX_INSTANCES)
    if (items.length > MAX_INSTANCES) {
      console.warn(
        `[ThreeInstancedRenderer] 当前可见物品数量 (${items.length}) 超过上限 ${MAX_INSTANCES}，仅渲染前 ${MAX_INSTANCES} 个`
      )
    }

    meshTarget.count = instanceCount

    const map = new Map<number, string>()

    for (let index = 0; index < instanceCount; index++) {
      const item = items[index]
      if (!item) {
        continue
      }
      map.set(index, item.internalId)

      coordinates3D.setThreeFromGame(scratchPosition, { x: item.x, y: item.y, z: item.z })

      const { Rotation, Scale } = item.originalData
      // 旋转轴从游戏坐标系映射到 Three.js：
      // 游戏 Roll(X) -> Three.js X
      // 游戏 Yaw(Z，高度轴) -> Three.js Y
      // 游戏 Pitch(Y，前后轴) -> Three.js Z
      scratchEuler.set(
        (Rotation.Roll * Math.PI) / 180,
        (Rotation.Yaw * Math.PI) / 180,
        (Rotation.Pitch * Math.PI) / 180,
        'XYZ'
      )
      scratchQuaternion.setFromEuler(scratchEuler)

      // 从家具元数据获取真实尺寸（游戏坐标：X=长, Y=宽, Z=高）
      const furnitureSize = furnitureStore.getFurnitureSize(item.gameId) ?? DEFAULT_FURNITURE_SIZE
      const [sizeX, sizeY, sizeZ] = furnitureSize

      // 应用游戏内缩放并映射到 Three.js 坐标系：
      // 游戏 X -> Three.js X，游戏 Z(高度) -> Three.js Y，游戏 Y -> Three.js Z
      scratchScale.set((Scale.X || 1) * sizeX, (Scale.Z || 1) * sizeZ, (Scale.Y || 1) * sizeY)

      scratchMatrix.compose(scratchPosition, scratchQuaternion, scratchScale)

      meshTarget.setMatrixAt(index, scratchMatrix)
    }

    meshTarget.instanceMatrix.needsUpdate = true

    indexToIdMap.value = map
    // 同时维护反向映射
    const reverseMap = new Map<string, number>()
    for (const [index, id] of map.entries()) {
      reverseMap.set(id, index)
    }
    idToIndexMap.value = reverseMap

    // 几何更新后刷新一次颜色，确保选中高亮正确
    updateInstancesColor()
  }

  // 局部更新选中物品的矩阵（用于拖拽时的视觉更新）
  function updateSelectedInstancesMatrix(selectedIds: Set<string>, deltaPosition: Vector3) {
    const meshTarget = instancedMesh.value
    if (!meshTarget) {
      return
    }

    const reverseMap = idToIndexMap.value

    for (const id of selectedIds) {
      const index = reverseMap.get(id)
      if (index === undefined) continue

      // 读取当前矩阵
      meshTarget.getMatrixAt(index, scratchMatrix)

      // 分解矩阵
      scratchMatrix.decompose(scratchPosition, scratchQuaternion, scratchScale)

      // 应用位置增量
      scratchPosition.add(deltaPosition)

      // 重新组合矩阵
      scratchMatrix.compose(scratchPosition, scratchQuaternion, scratchScale)

      // 更新实例
      meshTarget.setMatrixAt(index, scratchMatrix)
    }

    // 只标记矩阵需要更新，不触发颜色更新
    meshTarget.instanceMatrix.needsUpdate = true
  }

  // 物品集合变化时重建实例；选中状态变化时仅刷新颜色
  watch(
    () => editorStore.visibleItems,
    () => {
      // 拖拽时不触发全量更新，由 handleGizmoChange 直接更新实例矩阵
      if (isTransformDragging?.value) {
        return
      }

      rebuildInstances()
    },
    { deep: true, immediate: true }
  )

  watch(
    () => Array.from(editorStore.selectedItemIds),
    () => {
      if (isTransformDragging?.value) {
        return
      }

      updateInstancesColor()
    }
  )

  return {
    instancedMesh,
    indexToIdMap,
    idToIndexMap,
    updateSelectedInstancesMatrix,
    setHoveredItemId,
  }
}
