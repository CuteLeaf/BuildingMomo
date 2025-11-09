import { ref, type Ref, nextTick, watch } from 'vue'
import type { useEditorStore } from '../stores/editorStore'

export function useCanvasZoom(
  editorStore: ReturnType<typeof useEditorStore>,
  stageRef: Ref<any>,
  containerWidth: Ref<number>,
  containerHeight: Ref<number>
) {
  // Stage 配置 - 使用容器实际尺寸
  const stageConfig = ref({
    width: containerWidth.value,
    height: containerHeight.value,
    draggable: false, // 默认不可拖拽，按空格键时启用
    x: containerWidth.value / 2,
    y: containerHeight.value / 2,
  })

  // 缩放比例
  const scale = ref(1)

  // 滚轮事件节流相关
  let wheelRafId: number | null = null
  let pendingWheelEvent: any = null

  // 监听容器尺寸变化，更新 stageConfig
  watch([containerWidth, containerHeight], ([newWidth, newHeight]) => {
    if (newWidth > 0 && newHeight > 0) {
      stageConfig.value.width = newWidth
      stageConfig.value.height = newHeight
    }
  })

  // 处理缩放（使用 RAF 节流）
  function handleWheel(e: any) {
    e.evt.preventDefault()

    // 保存事件数据
    pendingWheelEvent = {
      deltaY: e.evt.deltaY,
      stage: e.target.getStage(),
    }

    // 如果已经有待处理的帧，跳过
    if (wheelRafId !== null) return

    // 使用 requestAnimationFrame 节流
    wheelRafId = requestAnimationFrame(() => {
      if (!pendingWheelEvent) {
        wheelRafId = null
        return
      }

      const { deltaY, stage } = pendingWheelEvent
      const oldScale = stage.scaleX()
      const pointer = stage.getPointerPosition()

      if (!pointer) {
        wheelRafId = null
        pendingWheelEvent = null
        return
      }

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      }

      // 计算新的缩放比例
      const scaleBy = 1.1
      const newScale = deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy

      // 限制缩放范围（百分之一到10倍）
      const clampedScale = Math.max(0.01, Math.min(10, newScale))
      scale.value = clampedScale

      stage.scale({ x: clampedScale, y: clampedScale })

      // 调整位置使鼠标指针为中心
      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      }
      stage.position(newPos)

      // 重置状态
      wheelRafId = null
      pendingWheelEvent = null
    })
  }

  // 计算最佳视图（自适应缩放和居中）
  function fitToView() {
    const bounds = editorStore.bounds
    console.log('🔴 bounds', bounds)
    if (!bounds) return

    const padding = 100 // 边距
    const scaleX = (containerWidth.value - padding * 2) / bounds.width
    const scaleY = (containerHeight.value - padding * 2) / bounds.height
    // containerWidth和containerHeight
    console.log('🔴 containerWidth', containerWidth.value, 'containerHeight', containerHeight.value)
    const fitScale = Math.max(0.01, Math.min(scaleX, scaleY, 1)) // 最小百分之一，最大不放大

    // 调整最小缩放限制，避免太小导致标点看不清
    const adjustedFitScale = Math.max(fitScale, 0.05) // 最小5%缩放

    // 计算偏移使内容居中
    const offsetX = containerWidth.value / 2 - bounds.centerX * adjustedFitScale
    const offsetY = containerHeight.value / 2 - bounds.centerY * adjustedFitScale

    // 应用到 stage
    scale.value = adjustedFitScale
    stageConfig.value.x = offsetX
    stageConfig.value.y = offsetY

    // 同步到 Stage 实例
    nextTick(() => {
      const stage = stageRef.value?.getStage()
      if (stage) {
        stage.scale({ x: adjustedFitScale, y: adjustedFitScale })
        stage.position({ x: offsetX, y: offsetY })
      }
    })
  }

  // 恢复保存的视图配置
  function restoreView(config: { scale: number; x: number; y: number }) {
    scale.value = config.scale
    stageConfig.value.x = config.x
    stageConfig.value.y = config.y

    nextTick(() => {
      const stage = stageRef.value?.getStage()
      if (stage) {
        stage.scale({ x: config.scale, y: config.scale })
        stage.position({ x: config.x, y: config.y })
      }
    })
  }

  // 保存当前视图配置到 store
  function saveCurrentView() {
    const stage = stageRef.value?.getStage()
    if (stage) {
      editorStore.saveCurrentViewConfig({
        scale: stage.scaleX(),
        x: stage.x(),
        y: stage.y(),
      })
    }
  }

  // 放大（以画布中心为基准）
  function zoomIn() {
    const stage = stageRef.value?.getStage()
    if (!stage) return

    const oldScale = stage.scaleX()
    const scaleBy = 1.2
    const newScale = Math.min(10, oldScale * scaleBy) // 最大10倍

    // 以画布中心为缩放中心
    const centerPoint = {
      x: containerWidth.value / 2,
      y: containerHeight.value / 2,
    }

    const mousePointTo = {
      x: (centerPoint.x - stage.x()) / oldScale,
      y: (centerPoint.y - stage.y()) / oldScale,
    }

    scale.value = newScale
    stage.scale({ x: newScale, y: newScale })

    const newPos = {
      x: centerPoint.x - mousePointTo.x * newScale,
      y: centerPoint.y - mousePointTo.y * newScale,
    }
    stage.position(newPos)
    stageConfig.value.x = newPos.x
    stageConfig.value.y = newPos.y
  }

  // 缩小（以画布中心为基准）
  function zoomOut() {
    const stage = stageRef.value?.getStage()
    if (!stage) return

    const oldScale = stage.scaleX()
    const scaleBy = 1.2
    const newScale = Math.max(0.01, oldScale / scaleBy) // 最小0.01倍

    // 以画布中心为缩放中心
    const centerPoint = {
      x: containerWidth.value / 2,
      y: containerHeight.value / 2,
    }

    const mousePointTo = {
      x: (centerPoint.x - stage.x()) / oldScale,
      y: (centerPoint.y - stage.y()) / oldScale,
    }

    scale.value = newScale
    stage.scale({ x: newScale, y: newScale })

    const newPos = {
      x: centerPoint.x - mousePointTo.x * newScale,
      y: centerPoint.y - mousePointTo.y * newScale,
    }
    stage.position(newPos)
    stageConfig.value.x = newPos.x
    stageConfig.value.y = newPos.y
  }

  return {
    scale,
    stageConfig,
    handleWheel,
    fitToView,
    restoreView,
    saveCurrentView,
    zoomIn,
    zoomOut,
  }
}
