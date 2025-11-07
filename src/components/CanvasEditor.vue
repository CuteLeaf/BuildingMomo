<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useEditorStore } from '../stores/editorStore'
import Konva from 'konva'

const editorStore = useEditorStore()

// Stage 配置
const stageWidth = ref(window.innerWidth - 256) // 减去侧边栏宽度
const stageHeight = ref(window.innerHeight - 56) // 减去工具栏高度

const stageConfig = ref({
  width: stageWidth.value,
  height: stageHeight.value,
  draggable: true,
  x: stageWidth.value / 2,
  y: stageHeight.value / 2
})

// 缩放比例
const scale = ref(1)

// Stage 引用
const stageRef = ref<any>(null)
const layerRef = ref<any>(null)
const itemsShapeRef = ref<any>(null)

// 滚轮事件节流相关
let wheelRafId: number | null = null
let pendingWheelEvent: any = null

// 处理窗口大小变化
function handleResize() {
  stageWidth.value = window.innerWidth - 256
  stageHeight.value = window.innerHeight - 56
  stageConfig.value.width = stageWidth.value
  stageConfig.value.height = stageHeight.value
}

// 处理缩放（使用 RAF 节流）
function handleWheel(e: any) {
  e.evt.preventDefault()
  
  // 保存事件数据
  pendingWheelEvent = {
    deltaY: e.evt.deltaY,
    stage: e.target.getStage()
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
      y: (pointer.y - stage.y()) / oldScale
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
      y: pointer.y - mousePointTo.y * clampedScale
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
  if (!bounds) return
  
  const padding = 100 // 边距
  const scaleX = (stageWidth.value - padding * 2) / bounds.width
  const scaleY = (stageHeight.value - padding * 2) / bounds.height
  const fitScale = Math.max(0.01, Math.min(scaleX, scaleY, 1)) // 最小百分之一，最大不放大
  
  // 调整最小缩放限制，避免太小导致标点看不清
  const adjustedFitScale = Math.max(fitScale, 0.05) // 最小5%缩放
  
  // 计算偏移使内容居中
  const offsetX = stageWidth.value / 2 - bounds.centerX * adjustedFitScale
  const offsetY = stageHeight.value / 2 - bounds.centerY * adjustedFitScale
  
  // 应用到 stage
  scale.value = adjustedFitScale
  stageConfig.value.x = offsetX
  stageConfig.value.y = offsetY
  
  // 保存为初始配置
  editorStore.initialViewConfig = { scale: adjustedFitScale, x: offsetX, y: offsetY }
  
  // 同步到 Stage 实例
  nextTick(() => {
    const stage = stageRef.value?.getStage()
    if (stage) {
      stage.scale({ x: adjustedFitScale, y: adjustedFitScale })
      stage.position({ x: offsetX, y: offsetY })
    }
  })
}

// 重置视图
function resetView() {
  const config = editorStore.initialViewConfig
  if (!config) {
    // 如果没有初始配置，重新计算
    fitToView()
    return
  }
  
  scale.value = config.scale
  stageConfig.value.x = config.x
  stageConfig.value.y = config.y
  
  const stage = stageRef.value?.getStage()
  if (stage) {
    stage.scale({ x: config.scale, y: config.scale })
    stage.position({ x: config.x, y: config.y })
  }
}

// 创建批量绘制的自定义 Shape
function createItemsShape() {
  return new Konva.Shape({
    sceneFunc: (context, shape) => {
      const items = editorStore.visibleItems
      const currentScale = scale.value
      
      // 计算补偿后的半径和边框宽度（保持屏幕像素大小一致）
      // 基础半径6像素，添加上下限避免极端情况
      const baseRadius = 6
      const compensatedRadius = baseRadius / currentScale
      const radius = Math.max(4, compensatedRadius)
      
      // 边框宽度也需要补偿
      const baseStrokeWidth = 1
      const compensatedStrokeWidth = baseStrokeWidth / currentScale
      const strokeWidth = Math.max(0.5, compensatedStrokeWidth)
      
      // 批量绘制所有圆点
      items.forEach(item => {
        // 绘制填充
        context.beginPath()
        context.arc(item.x, item.y, radius, 0, Math.PI * 2, false)
        context.fillStyle = '#94a3b8'
        context.globalAlpha = 0.8
        context.fill()
        
        // 绘制边框
        context.strokeStyle = '#475569'
        context.lineWidth = strokeWidth
        context.stroke()
      })
      
      context.globalAlpha = 1
    },
    // 可选：添加 hitFunc 用于点击检测
    hitFunc: (context, shape) => {
      const items = editorStore.visibleItems
      const currentScale = scale.value
      
      // 使用与 sceneFunc 相同的半径计算
      const baseRadius = 6
      const compensatedRadius = baseRadius / currentScale
      const radius = Math.max(4, Math.min(12, compensatedRadius))
      
      items.forEach(item => {
        context.beginPath()
        context.arc(item.x, item.y, radius, 0, Math.PI * 2, false)
        context.fillStrokeShape(shape)
      })
    }
  })
}

// 更新批量绘制的 Shape
function updateItemsShape() {
  nextTick(() => {
    const layer = layerRef.value?.getNode()
    if (!layer) return
    
    // 移除旧的 shape
    if (itemsShapeRef.value) {
      itemsShapeRef.value.destroy()
    }
    
    // 创建新的 shape
    if (editorStore.visibleItems.length > 0) {
      itemsShapeRef.value = createItemsShape()
      layer.add(itemsShapeRef.value)
      layer.batchDraw()
    }
  })
}

// 监听边界框变化，自动计算最佳视图
watch(() => editorStore.bounds, (bounds) => {
  if (bounds) {
    fitToView()
  }
}, { immediate: true })

// 监听可见物品变化，更新批量绘制
watch(() => editorStore.visibleItems, () => {
  updateItemsShape()
}, { deep: true })

// 监听缩放变化，更新批量绘制（因为圆点大小依赖于缩放）
watch(scale, () => {
  updateItemsShape()
})

// 监听窗口大小变化
if (typeof window !== 'undefined') {
  window.addEventListener('resize', handleResize)
}
</script>

<template>
  <div class="flex-1 bg-gray-100 overflow-hidden relative">
    <!-- 空状态提示 -->
    <div 
      v-if="editorStore.items.length === 0"
      class="absolute inset-0 flex items-center justify-center text-gray-400 text-lg"
    >
      <div class="text-center">
        <svg class="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <p>请导入 JSON 文件以查看物品</p>
        <p class="text-sm mt-2 text-gray-300">使用鼠标滚轮缩放，拖拽画布平移</p>
      </div>
    </div>

    <!-- Konva Stage -->
    <v-stage
      v-if="editorStore.items.length > 0"
      ref="stageRef"
      :config="stageConfig"
      @wheel="handleWheel"
    >
      <v-layer ref="layerRef">
        <!-- 原点标记 -->
        <v-circle
          :config="{
            x: 0,
            y: 0,
            radius: Math.max(4, 8 / scale),
            fill: '#ef4444',
            stroke: '#dc2626',
            strokeWidth: Math.max(0.5, 2 / scale)
          }"
        />
        <v-text
          :config="{
            x: Math.max(5, 10 / scale),
            y: Math.max(-3, -5 / scale),
            text: 'Origin (0, 0)',
            fontSize: Math.max(8, 12 / scale),
            fill: '#ef4444'
          }"
        />
        
        <!-- 批量绘制的物品将通过 updateItemsShape() 动态添加 -->
      </v-layer>
    </v-stage>

    <!-- 缩放信息和控制按钮 -->
    <div 
      v-if="editorStore.items.length > 0"
      class="absolute bottom-4 right-4 flex items-center gap-2"
    >
      <div class="bg-white/90 px-3 py-2 rounded-md shadow-sm text-xs text-gray-600">
        缩放: {{ (scale * 100).toFixed(0) }}%
      </div>
      <button
        @click="resetView"
        class="bg-white/90 hover:bg-white px-3 py-2 rounded-md shadow-sm text-xs text-gray-700 transition-colors flex items-center gap-1"
        title="重置视图"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
        </svg>
        重置视图
      </button>
    </div>
  </div>
</template>
