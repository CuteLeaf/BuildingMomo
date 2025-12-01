import { storeToRefs } from 'pinia'
import { Vector3, Quaternion, Euler, MathUtils, Matrix4 } from 'three'
import { useEditorStore } from '../../stores/editorStore'
import { useEditorHistory } from './useEditorHistory'
import type { TransformParams } from '../../types/editor'
import type { AppItem } from '../../types/editor'

/**
 * 计算物品在群组旋转后的新位置和姿态
 * 核心原则：模拟渲染管线进行正向构建，应用变换后再逆向还原。
 *
 * 渲染管线:
 * 1. Data Space: (x, y, z, Roll, Pitch, Yaw)
 * 2. Visual Euler: (-Roll, -Pitch, Yaw)  // 关键修正
 * 3. Render Matrix: compose(Visual Pos, Visual Euler, Scale)
 * 4. World Matrix: Scale(1, -1, 1) * Render Matrix
 *
 * 变换操作: World Matrix' = Delta Rotation * World Matrix
 *
 * 逆向还原:
 * 1. Render Matrix' = Scale(1, -1, 1) * World Matrix'
 * 2. 提取 Visual Euler
 * 3. Data Rotation: (-ex, -ey, ez) // 关键还原
 */
function calculateNewTransform(
  item: AppItem,
  center: { x: number; y: number; z: number },
  rotationDelta: { x?: number; y?: number; z?: number },
  positionOffset: { x: number; y: number; z: number }
) {
  // 1. 定义父级镜像变换矩阵 S (Scale 1, -1, 1)
  const S = new Matrix4().makeScale(1, -1, 1)

  // 2. 构建"渲染矩阵" (模拟 useThreeInstancedRenderer.ts 逻辑)
  const localPos = new Vector3(item.x, item.y, item.z)

  // 关键：渲染器使用了 Roll/Pitch 取反
  const localEuler = new Euler(
    MathUtils.degToRad(-(item.rotation.x ?? 0)),
    MathUtils.degToRad(-(item.rotation.y ?? 0)),
    MathUtils.degToRad(item.rotation.z ?? 0),
    'ZYX'
  )
  const localQuat = new Quaternion().setFromEuler(localEuler)
  const localScale = new Vector3(1, 1, 1)

  const mRendered = new Matrix4().compose(localPos, localQuat, localScale)

  // 3. 构建世界矩阵: M_world = S * M_rendered
  const mWorld = S.clone().multiply(mRendered)

  // 4. 构建旋转增量矩阵
  const deltaEuler = new Euler(
    MathUtils.degToRad(rotationDelta.x ?? 0),
    MathUtils.degToRad(rotationDelta.y ?? 0),
    MathUtils.degToRad(rotationDelta.z ?? 0),
    'ZYX'
  )
  const deltaQuat = new Quaternion().setFromEuler(deltaEuler)
  const mDeltaRot = new Matrix4().makeRotationFromQuaternion(deltaQuat)

  // 5. 计算新的世界位置 (Orbit 公转)
  const centerData = new Vector3(center.x, center.y, center.z)
  const centerWorld = centerData.clone().applyMatrix4(S) // (x, -y, z)

  const posWorld = new Vector3().setFromMatrixPosition(mWorld)

  const relativeVec = posWorld.clone().sub(centerWorld)
  relativeVec.applyQuaternion(deltaQuat)

  // 处理位置偏移 (positionOffset 是 Data Space 的增量，需应用 S 变换)
  const offsetVisual = new Vector3(
    positionOffset.x,
    positionOffset.y,
    positionOffset.z
  ).applyMatrix4(S)

  const newPosWorld = centerWorld.clone().add(relativeVec).add(offsetVisual)

  // 6. 计算新的世界姿态 (自转): M_new_world = M_delta_rot * M_world
  const mNewWorldRot = mDeltaRot.multiply(mWorld)
  mNewWorldRot.setPosition(newPosWorld)

  // 7. 还原回"渲染矩阵": M'_rendered = S * M'_world
  const mNewRendered = S.multiply(mNewWorldRot)

  // 8. 提取并逆向还原数据
  const newPos = new Vector3()
  const newQuat = new Quaternion()
  const newScale = new Vector3()
  mNewRendered.decompose(newPos, newQuat, newScale)

  const newEuler = new Euler().setFromQuaternion(newQuat, 'ZYX')

  return {
    x: newPos.x,
    y: newPos.y,
    z: newPos.z,
    // 关键：数据还原需再次取反 Roll/Pitch
    Roll: -MathUtils.radToDeg(newEuler.x),
    Pitch: -MathUtils.radToDeg(newEuler.y),
    Yaw: MathUtils.radToDeg(newEuler.z),
  }
}

export function useEditorManipulation() {
  const store = useEditorStore()
  const { activeScheme, selectedItems } = storeToRefs(store)
  const { getSelectedItemsCenter } = store // This is still in store, or we could move it here too.
  const { saveHistory } = useEditorHistory()

  // 删除选中物品
  function deleteSelected() {
    if (!activeScheme.value) return

    saveHistory('edit')

    activeScheme.value.items = activeScheme.value.items.filter(
      (item) => !activeScheme.value!.selectedItemIds.has(item.internalId)
    )
    activeScheme.value.selectedItemIds.clear()
  }

  // 精确变换选中物品（位置和旋转）
  function updateSelectedItemsTransform(params: TransformParams) {
    if (!activeScheme.value) return

    saveHistory('edit')

    const { mode, position, rotation } = params
    const selected = selectedItems.value

    if (selected.length === 0) return

    // 计算选区中心（用于旋转和绝对位置）
    const center = getSelectedItemsCenter()
    if (!center) return

    // 计算位置偏移量
    let positionOffset = { x: 0, y: 0, z: 0 }

    if (mode === 'absolute' && position) {
      // 绝对模式：移动到指定坐标
      positionOffset = {
        x: (position.x ?? center.x) - center.x,
        y: (position.y ?? center.y) - center.y,
        z: (position.z ?? center.z) - center.z,
      }
    } else if (mode === 'relative' && position) {
      // 相对模式：偏移指定距离
      positionOffset = {
        x: position.x ?? 0,
        y: position.y ?? 0,
        z: position.z ?? 0,
      }
    }

    // 更新物品
    activeScheme.value.items = activeScheme.value.items.map((item) => {
      if (!activeScheme.value!.selectedItemIds.has(item.internalId)) {
        return item
      }

      // 处理绝对旋转模式 (仅更新旋转，位置不变)
      if (mode === 'absolute' && rotation) {
        const newRotation = {
          x: rotation.x ?? item.rotation.x ?? 0,
          y: rotation.y ?? item.rotation.y ?? 0,
          z: rotation.z ?? item.rotation.z ?? 0,
        }

        // 如果同时也传入了绝对位置更新
        let newX = item.x
        let newY = item.y
        let newZ = item.z

        if (position) {
          // 如果是绝对位置模式，直接应用位置偏移
          newX += positionOffset.x
          newY += positionOffset.y
          newZ += positionOffset.z
        }

        return {
          ...item,
          x: newX,
          y: newY,
          z: newZ,
          rotation: newRotation,
        }
      }

      // 相对模式或无旋转指定：使用矩阵算法计算变换 (支持群组旋转)
      const result = calculateNewTransform(item, center, rotation || {}, positionOffset)

      return {
        ...item,
        x: result.x,
        y: result.y,
        z: result.z,
        rotation: {
          x: result.Roll,
          y: result.Pitch,
          z: result.Yaw,
        },
      }
    })
  }

  // 移动选中物品（XYZ）
  function moveSelectedItems(
    dx: number,
    dy: number,
    dz: number,
    options: { saveHistory?: boolean } = { saveHistory: true }
  ) {
    if (!activeScheme.value) {
      return
    }

    if (options.saveHistory) {
      saveHistory('edit')
    }

    activeScheme.value.items = activeScheme.value.items.map((item) => {
      if (!activeScheme.value!.selectedItemIds.has(item.internalId)) {
        return item
      }

      const newX = item.x + dx
      const newY = item.y + dy
      const newZ = item.z + dz

      return {
        ...item,
        x: newX,
        y: newY,
        z: newZ,
      }
    })
  }

  return {
    deleteSelected,
    updateSelectedItemsTransform,
    moveSelectedItems,
  }
}
