<script setup lang="ts">
import { computed } from 'vue'
import { useTimeAgo } from '@vueuse/core'
import { useFurnitureStore } from '../stores/furnitureStore'
import { useSettingsStore } from '../stores/settingsStore'
import { toast } from 'vue-sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { RefreshCw, Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const furnitureStore = useFurnitureStore()
const settingsStore = useSettingsStore()

// 图标显示阈值 - 使用 computed 的 getter/setter 处理 Slider 的值
const iconShowThresholdModel = computed({
  get: () => [settingsStore.settings.iconShowThreshold],
  set: (value: number[]) => {
    if (value.length > 0) {
      settingsStore.settings.iconShowThreshold = value[0]!
    }
  },
})

// 使用 VueUse 的 useTimeAgo 格式化最后更新时间
const lastUpdateText = computed(() => {
  if (!furnitureStore.lastFetchTime) return '从未更新'

  return useTimeAgo(furnitureStore.lastFetchTime, {
    messages: {
      justNow: '刚刚',
      past: (n: string | number) => (String(n).match(/\d/) ? `${n}前` : String(n)),
      future: (n: string | number) => (String(n).match(/\d/) ? `${n}后` : String(n)),
      year: (n: number) => `${n} 年`,
      month: (n: number) => `${n} 个月`,
      day: (n: number) => `${n} 天`,
      week: (n: number) => `${n} 周`,
      hour: (n: number) => `${n} 小时`,
      minute: (n: number) => `${n} 分钟`,
      second: (n: number) => `${n} 秒`,
      invalid: '无效日期',
    },
  }).value
})

async function handleForceUpdate() {
  try {
    await furnitureStore.forceUpdate()
    toast.success('家具数据更新成功')
  } catch (error) {
    toast.error('更新失败：' + (error as Error).message)
  }
}

async function handleClearCache() {
  try {
    await furnitureStore.clearCache()
    toast.success('缓存已清除')
  } catch (error) {
    toast.error('清除失败：' + (error as Error).message)
  }
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-h-[80vh] max-w-2xl">
      <DialogHeader>
        <DialogTitle>设置</DialogTitle>
        <DialogDescription> 配置应用的显示选项和数据管理设置 </DialogDescription>
      </DialogHeader>

      <!-- Tabs 切换 -->
      <Tabs default-value="display" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="display">显示设置</TabsTrigger>
          <TabsTrigger value="data">数据管理</TabsTrigger>
        </TabsList>

        <!-- 显示设置 Tab -->
        <TabsContent value="display" class="space-y-4 py-4">
          <!-- 家具Tooltip开关 -->
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>显示家具名称提示</Label>
              <p class="text-xs text-muted-foreground">鼠标悬停在物品上时显示名称和图标</p>
            </div>
            <Switch v-model="settingsStore.settings.showFurnitureTooltip" />
          </div>

          <!-- 背景图开关 -->
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>显示家园背景图</Label>
              <p class="text-xs text-muted-foreground">在画布上显示参考背景图</p>
            </div>
            <Switch v-model="settingsStore.settings.showBackground" />
          </div>

          <!-- 图标显示阈值 -->
          <div class="space-y-3">
            <div class="space-y-0.5">
              <Label>图标显示缩放阈值</Label>
              <p class="text-xs text-muted-foreground">
                控制在多大缩放级别时显示图标（当前:
                {{ (settingsStore.settings.iconShowThreshold * 100).toFixed(0) }}%）
              </p>
            </div>
            <div class="flex items-center gap-3">
              <span class="w-10 text-xs text-muted-foreground">10%</span>
              <Slider
                v-model="iconShowThresholdModel"
                :min="0.1"
                :max="2.0"
                :step="0.1"
                class="flex-1"
              />
              <span class="w-10 text-xs text-muted-foreground">200%</span>
            </div>
          </div>

          <!-- 分割线 -->
          <div class="border-t pt-4">
            <h3 class="mb-3 text-sm font-medium">编辑辅助</h3>
          </div>

          <!-- 重复物品检测开关 -->
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>启用重复物品检测</Label>
              <p class="text-xs text-muted-foreground">
                自动检测位置、旋转、缩放完全相同的物品，在状态栏显示提示
              </p>
            </div>
            <Switch v-model="settingsStore.settings.enableDuplicateDetection" />
          </div>
        </TabsContent>

        <!-- 数据管理 Tab -->
        <TabsContent value="data" class="space-y-4 py-4">
          <!-- 数据状态卡片 -->
          <div class="rounded-lg border bg-muted p-4">
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">家具数据量:</span>
                <span class="font-medium"> {{ furnitureStore.totalCount || 0 }} 种 </span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">最后更新:</span>
                <span class="font-medium">{{ lastUpdateText }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">数据状态:</span>
                <span
                  class="font-medium"
                  :class="furnitureStore.isInitialized ? 'text-green-600' : 'text-yellow-600'"
                >
                  {{ furnitureStore.isInitialized ? '已加载' : '未加载' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 自动更新开关 -->
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label>自动检查更新</Label>
              <p class="text-xs text-muted-foreground">每24小时自动更新家具数据</p>
            </div>
            <Switch v-model="settingsStore.settings.autoUpdateFurniture" />
          </div>

          <!-- 操作按钮 -->
          <div class="space-y-2 pt-2">
            <Button
              @click="handleForceUpdate"
              variant="outline"
              class="w-full"
              :disabled="furnitureStore.isLoading"
            >
              <RefreshCw
                class="mr-2 h-4 w-4"
                :class="{ 'animate-spin': furnitureStore.isLoading }"
              />
              立即更新数据
            </Button>

            <Button @click="handleClearCache" variant="destructive" class="w-full">
              <Trash2 class="mr-2 h-4 w-4" />
              清除本地缓存
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
