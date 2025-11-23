<script setup lang="ts">
import { useEditorStore } from '../stores/editorStore'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SidebarHeader from './SidebarHeader.vue'
import SidebarSelection from './SidebarSelection.vue'
import SidebarTransform from './SidebarTransform.vue'

const editorStore = useEditorStore()
</script>

<template>
  <div class="flex h-full w-64 flex-col">
    <!-- 顶部工具栏 -->
    <SidebarHeader />

    <!-- 可滚动内容区域 -->
    <ScrollArea class="flex-1">
      <div class="flex flex-col gap-3 p-3">
        <Tabs default-value="structure" class="w-full">
          <TabsList class="mb-4 grid w-full grid-cols-2 bg-white">
            <TabsTrigger
              value="structure"
              class="data-[state=active]:bg-gray-100 data-[state=active]:shadow-none"
            >
              结构
            </TabsTrigger>
            <TabsTrigger
              value="transform"
              :disabled="editorStore.selectedItems.length === 0"
              class="data-[state=active]:bg-gray-100 data-[state=active]:shadow-none"
            >
              变换
            </TabsTrigger>
          </TabsList>

          <TabsContent value="structure" class="mt-0 flex flex-col gap-3">
            <!-- 选中物品组件 -->
            <SidebarSelection />

            <!-- 提示信息 -->
            <div
              v-if="editorStore.items.length === 0"
              class="mt-4 text-center text-xs text-gray-500"
            >
              请导入建造数据文件开始编辑
            </div>
            <div
              v-else-if="editorStore.selectedItems.length === 0"
              class="mt-4 text-center text-xs text-gray-500"
            >
              请选择物品查看详情或进行操作
            </div>
          </TabsContent>

          <TabsContent value="transform" class="mt-0">
            <!-- 变换面板 -->
            <SidebarTransform />
          </TabsContent>
        </Tabs>
      </div>
      <ScrollBar orientation="vertical" class="!w-1.5" />
    </ScrollArea>
  </div>
</template>
