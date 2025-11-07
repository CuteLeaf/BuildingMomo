<script setup lang="ts">
import { computed } from 'vue'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar'
import { useCommandStore } from '../stores/commandStore'

// 使用命令系统 Store
const commandStore = useCommandStore()

// 按分类获取命令
const fileCommands = computed(() => commandStore.getCommandsByCategory('file'))
const editCommands = computed(() => commandStore.getCommandsByCategory('edit'))
const viewCommands = computed(() => commandStore.getCommandsByCategory('view'))

// 执行命令
function handleCommand(commandId: string) {
  commandStore.executeCommand(commandId)
}

// 检查命令是否可用
function isEnabled(commandId: string): boolean {
  return commandStore.isCommandEnabled(commandId)
}
</script>

<template>
  <div class="flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4">
    <!-- Menubar 菜单栏 -->
    <Menubar class="border-none bg-transparent">
      <!-- 文件菜单 -->
      <MenubarMenu>
        <MenubarTrigger class="text-sm font-medium">文件</MenubarTrigger>
        <MenubarContent>
          <MenubarItem
            v-for="cmd in fileCommands"
            :key="cmd.id"
            :disabled="!isEnabled(cmd.id)"
            @click="handleCommand(cmd.id)"
          >
            {{ cmd.label }}
            <MenubarShortcut v-if="cmd.shortcut">{{ cmd.shortcut }}</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <!-- 编辑菜单 -->
      <MenubarMenu>
        <MenubarTrigger class="text-sm font-medium">编辑</MenubarTrigger>
        <MenubarContent>
          <template v-for="cmd in editCommands" :key="cmd.id">
            <!-- 在"删除"之前和"全选"之前添加分隔线 -->
            <MenubarSeparator v-if="cmd.id === 'edit.delete' || cmd.id === 'edit.selectAll'" />
            <MenubarItem :disabled="!isEnabled(cmd.id)" @click="handleCommand(cmd.id)">
              {{ cmd.label }}
              <MenubarShortcut v-if="cmd.shortcut">{{ cmd.shortcut }}</MenubarShortcut>
            </MenubarItem>
          </template>
        </MenubarContent>
      </MenubarMenu>

      <!-- 视图菜单 -->
      <MenubarMenu>
        <MenubarTrigger class="text-sm font-medium">视图</MenubarTrigger>
        <MenubarContent>
          <template v-for="cmd in viewCommands" :key="cmd.id">
            <!-- 在"重置视图"之前添加分隔线 -->
            <MenubarSeparator v-if="cmd.id === 'view.resetView'" />
            <MenubarItem :disabled="!isEnabled(cmd.id)" @click="handleCommand(cmd.id)">
              {{ cmd.label }}
              <MenubarShortcut v-if="cmd.shortcut">{{ cmd.shortcut }}</MenubarShortcut>
            </MenubarItem>
          </template>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>

    <!-- 标题（居中） -->
    <div class="flex flex-1 items-center justify-center">
      <h1 class="text-lg font-semibold text-gray-700">建造坐标辅助器</h1>
    </div>

    <!-- 占位，保持标题居中 -->
    <div class="w-32"></div>
  </div>
</template>
