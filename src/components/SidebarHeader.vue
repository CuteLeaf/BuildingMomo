<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editorStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useCommandStore } from '@/stores/commandStore'
import { useUIStore } from '@/stores/uiStore'
import {
  MousePointer2,
  Hand,
  Move,
  Box,
  Image as ImageIcon,
  Cuboid,
  Camera,
  ChevronsUp,
  ChevronsDown,
  ChevronsRight,
  ChevronsLeft,
  ChevronRight,
  ChevronLeft,
} from 'lucide-vue-next'
import { Toggle } from '@/components/ui/toggle'

const editorStore = useEditorStore()
const settingsStore = useSettingsStore()
const commandStore = useCommandStore()
const uiStore = useUIStore()

// 工具切换
const currentTool = computed({
  get: () => editorStore.currentTool,
  set: (val) => {
    if (val) editorStore.currentTool = val as 'select' | 'hand'
  },
})

// 显示模式切换
const displayMode = computed({
  get: () => settingsStore.settings.threeDisplayMode,
  set: (val) => {
    if (val) settingsStore.settings.threeDisplayMode = val as 'box' | 'icon' | 'simple-box'
  },
})
// 视图预设切换
const viewPreset = computed({
  get: () => uiStore.currentViewPreset,
  set: (val) => {
    if (!val) return

    const idMap: Record<string, string> = {
      perspective: 'view.setViewPerspective',
      top: 'view.setViewTop',
      bottom: 'view.setViewBottom',
      front: 'view.setViewFront',
      back: 'view.setViewBack',
      left: 'view.setViewLeft',
      right: 'view.setViewRight',
    }

    const cmdId = idMap[val]
    if (cmdId) {
      commandStore.executeCommand(cmdId)
    }
  },
})
</script>

<template>
  <div class="flex flex-col gap-3 border-b border-gray-200 bg-white p-4 pr-2">
    <!-- 工具栏第一行：主要工具 -->
    <div class="flex items-start justify-between">
      <!-- 左侧：选择/拖拽工具 -->
      <div class="flex flex-col items-start gap-1">
        <span class="text-[10px] font-medium text-gray-400 select-none">工具</span>
        <div class="flex items-center gap-0.5">
          <Toggle
            size="sm"
            :model-value="currentTool === 'select'"
            @update:model-value="
              (v: boolean) => {
                if (v) currentTool = 'select'
              }
            "
            aria-label="选择工具"
            title="选择工具 (V)"
          >
            <MousePointer2 class="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            :model-value="currentTool === 'hand'"
            @update:model-value="
              (v: boolean) => {
                if (v) currentTool = 'hand'
              }
            "
            aria-label="拖拽工具"
            title="拖拽工具 (H)"
          >
            <Hand class="h-4 w-4" />
          </Toggle>

          <!-- Gizmo 开关 -->
          <Toggle
            size="sm"
            :model-value="settingsStore.settings.showGizmo"
            @update:model-value="
              (v: boolean) => {
                settingsStore.settings.showGizmo = v
              }
            "
            aria-label="显示变换轴"
            title="显示变换轴 (G)"
          >
            <Move class="h-4 w-4" />
          </Toggle>
        </div>
      </div>

      <!-- 右侧：显示模式 -->
      <div class="flex flex-col items-start gap-1">
        <span class="text-[10px] font-medium text-gray-400 select-none">显示</span>
        <div class="flex items-center gap-0.25">
          <Toggle
            size="sm"
            :model-value="displayMode === 'box'"
            @update:model-value="
              (v: boolean) => {
                if (v) displayMode = 'box'
              }
            "
            aria-label="完整体积"
            title="完整体积"
          >
            <Cuboid class="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            :model-value="displayMode === 'simple-box'"
            @update:model-value="
              (v: boolean) => {
                if (v) displayMode = 'simple-box'
              }
            "
            aria-label="简化方块"
            title="简化方块"
          >
            <Box class="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            :model-value="displayMode === 'icon'"
            @update:model-value="
              (v: boolean) => {
                if (v) displayMode = 'icon'
              }
            "
            aria-label="图标模式"
            title="图标模式"
          >
            <ImageIcon class="h-4 w-4" />
          </Toggle>
        </div>
      </div>
    </div>

    <!-- 工具栏第二行：视图控制 -->
    <div class="flex flex-col items-start gap-1">
      <span class="text-[10px] font-medium text-gray-400 select-none">视图</span>
      <div class="flex w-full items-center justify-between">
        <Toggle
          size="sm"
          :model-value="viewPreset === 'perspective'"
          @update:model-value="
            (v: boolean) => {
              if (v) viewPreset = 'perspective'
            }
          "
          title="透视视图"
        >
          <Camera class="h-4 w-4" />
        </Toggle>

        <div class="mx-0.5 h-4 w-px bg-gray-200"></div>

        <Toggle
          size="sm"
          :model-value="viewPreset === 'top'"
          @update:model-value="
            (v: boolean) => {
              if (v) viewPreset = 'top'
            }
          "
          title="顶视图"
        >
          <ChevronsUp class="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          :model-value="viewPreset === 'front'"
          @update:model-value="
            (v: boolean) => {
              if (v) viewPreset = 'front'
            }
          "
          title="前视图"
        >
          <ChevronsRight class="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          :model-value="viewPreset === 'left'"
          @update:model-value="
            (v: boolean) => {
              if (v) viewPreset = 'left'
            }
          "
          title="左视图"
        >
          <ChevronLeft class="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          :model-value="viewPreset === 'right'"
          @update:model-value="
            (v: boolean) => {
              if (v) viewPreset = 'right'
            }
          "
          title="右视图"
        >
          <ChevronRight class="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          :model-value="viewPreset === 'back'"
          @update:model-value="
            (v: boolean) => {
              if (v) viewPreset = 'back'
            }
          "
          title="后视图"
        >
          <ChevronsLeft class="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          :model-value="viewPreset === 'bottom'"
          @update:model-value="
            (v: boolean) => {
              if (v) viewPreset = 'bottom'
            }
          "
          title="底视图"
        >
          <ChevronsDown class="h-4 w-4" />
        </Toggle>
      </div>
    </div>
  </div>
</template>
