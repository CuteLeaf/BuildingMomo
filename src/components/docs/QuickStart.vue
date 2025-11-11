<script setup lang="ts"></script>

<template>
  <div class="doc-content">
    <h1>快速上手</h1>

    <h2>项目简介</h2>
    <p>
      <strong>BuildingMomo 搬砖吧大喵</strong>
      是一个专为《无限暖暖》游戏设计的家园方案可视化编辑工具。
    </p>
    <p>
      <strong>核心功能：</strong>
    </p>
    <ul>
      <li>快速移动/复制/删除/大型建筑群</li>
      <li>在不同家园方案间自由合并建筑群</li>
      <li>可视化编辑坐标，所见即所得</li>
    </ul>
    <p class="text-sm text-muted-foreground">
      专为有特殊建造需求的玩家设计（如复杂建筑群调整、方案合并、快速成组）
    </p>

    <h2>场景示例：跨方案合并建筑群</h2>
    <p>
      <strong>场景说明：</strong>你在方案 A 中精心打造了一座大别墅，现在想把它搬到方案 B
      中，而不是从头再建一遍。
    </p>

    <h3>第 1 步：导入第一个方案</h3>
    <ol>
      <li>在游戏中进入建造模式（确保当前是方案 A）</li>
      <li>点击右上角菜单 <strong>脱离卡死</strong> → 确认</li>
      <li>回到编辑器，点击顶部菜单 <strong>文件 &gt; 选择游戏目录</strong></li>
      <li>选择游戏安装目录（<code>InfinityNikki</code> 文件夹）</li>
      <li>确认弹出的导入提示，方案 A 将作为新标签页打开</li>
    </ol>
    <p class="text-sm text-muted-foreground">
      <strong>如何找到游戏安装目录：</strong><br />
      在游戏启动器的「启动游戏」按钮右侧小箭头，点击「打开安装位置」即可获取游戏路径。
    </p>

    <h3>第 2 步：导入第二个方案</h3>
    <ol>
      <li>回到游戏，重新进入建造模式</li>
      <li>出现"恢复建造"弹窗时，选择 <strong>取消</strong></li>
      <li>加载方案 B（你要粘贴到的目标方案）</li>
      <li>再次点击右上角菜单 <strong>脱离卡死</strong> → 确认</li>
      <li>回到编辑器，确认导入提示，方案 B 将作为第二个标签页打开</li>
    </ol>

    <p class="text-sm text-muted-foreground">此时编辑器中应该有两个标签页：方案 A 和方案 B</p>

    <h3>第 3 步：复制建筑群</h3>
    <ol>
      <li>切换到方案 A 标签页</li>
      <li>
        框选你要复制的建筑区域：
        <ul>
          <li>按住鼠标左键拖拽选择</li>
          <li><code>Shift + 框选</code> 可以追加选择</li>
          <li><code>Alt + 框选</code> 可以减选</li>
        </ul>
      </li>
      <li>按 <code>Ctrl + C</code> 复制选中的建筑</li>
    </ol>

    <h3>第 4 步：粘贴到目标方案</h3>
    <ol>
      <li>切换到方案 B 标签页</li>
      <li>按 <code>Ctrl + V</code> 粘贴建筑群</li>
      <li>拖动调整建筑群的位置</li>
      <li>编辑完成后，按 <code>Ctrl + S</code> 或点击 <strong>文件 &gt; 保存到游戏</strong></li>
    </ol>
    <p class="text-sm text-muted-foreground">
      <strong>成组建议：</strong>
      可在右侧菜单对建筑群点击<strong>"成组"</strong>
      按钮，这在游戏中也会是一个整体，方便后续调整
    </p>

    <h3>第 5 步：在游戏中应用</h3>
    <ol>
      <li>返回游戏，重新进入建造模式</li>
      <li>出现"恢复建造"弹窗时，选择 <strong>恢复</strong></li>
      <li>完成！你的建筑群已经出现在方案 B 中了</li>
    </ol>

    <div class="doc-success">
      ✅ <strong>恭喜！</strong>
      你已经掌握了跨方案合并的核心流程，这是本工具最强大的功能之一。
    </div>

    <h2>下一步</h2>
    <p>想了解更多功能和详细操作？请查看：</p>
    <ul>
      <li><strong>使用指南</strong>：了解完整的导入导出流程、基础操作和高级功能</li>
      <li><strong>常见问题</strong>：遇到问题时的解决方案</li>
    </ul>
    <p class="text-sm text-muted-foreground">
      <strong>常用快捷键提示：</strong>
      <code>Ctrl + C</code> 复制、<code>Ctrl + V</code> 粘贴、<code>Delete</code> 删除、<code
        >Ctrl + Z</code
      >
      撤销
    </p>
  </div>
</template>
