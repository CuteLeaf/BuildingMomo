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
      <strong>场景说明：</strong>你在方案 1 中精心打造了一座花园，现在想把它搬到方案 2
      中，而不是从头再建一遍。
    </p>

    <h3>第 1 步：导入第一个方案</h3>
    <ol>
      <li>在游戏中进入建造模式（确保当前是方案 1）</li>
      <li>点击右上角菜单 <strong>脱离卡死</strong> → 确认</li>
      <li>回到编辑器，点击顶部菜单 <strong>文件 &gt; 选择游戏目录</strong></li>
      <li>选择游戏安装目录（<code>InfinityNikki</code> 文件夹）</li>
      <li>确认弹出的导入提示，方案 1 将作为新标签页打开</li>
    </ol>
    <p class="text-sm text-muted-foreground">
      <strong>如何找到游戏安装目录：</strong><br />
      在游戏启动器的「启动游戏」按钮右侧小箭头，点击「打开安装位置」即可获取游戏路径。
    </p>

    <h3>第 2 步：导入第二个方案</h3>
    <ol>
      <li>回到游戏，重新进入建造模式</li>
      <li>出现"恢复建造"弹窗时，选择 <strong>取消</strong></li>
      <li>加载方案 2（你要粘贴到的目标方案）</li>
      <li>再次点击右上角菜单 <strong>脱离卡死</strong> → 确认</li>
      <li>回到编辑器，确认导入提示，方案 2 将作为第二个标签页打开</li>
    </ol>

    <p class="text-sm text-muted-foreground">此时编辑器中应该有两个标签页：方案 1 和方案 2</p>

    <h3>第 3 步：复制建筑群</h3>
    <ol>
      <li>切换到方案 1 标签页</li>
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
      <li>切换到方案 2 标签页</li>
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
      <li>完成！你的建筑群已经出现在方案 2 中了</li>
    </ol>

    <div class="doc-success">
      ✅ <strong>恭喜！</strong>
      你已经掌握了跨方案合并的核心流程，这是本工具最强大的功能之一。
    </div>

    <h2>场景示例：解决多层建筑局部负载上限问题</h2>
    <p>
      <strong>场景说明：</strong>
      游戏中的多层建筑（如洋楼）即使处于毛坯状态，其大量的墙体和地板结构本身就会占用极高的局部区域负载。这导致你想给一楼添加内装时，常被提示"此区域摆放家具过多"。
      <br />
      <br />
      <strong>解决方案：</strong>
      由于游戏的局部负载计算覆盖该区域的所有高度，我们需要利用本工具将二楼及以上的物品暂时<strong>水平平移</strong>到远处的空地，待一楼施工完成后，再移回来。
    </p>

    <h3>第 1 步：框选整体建筑</h3>
    <ol>
      <li>在视图中框选整个建筑（包含一楼和楼上所有物品）</li>
    </ol>
    <p class="text-sm text-muted-foreground">
      <strong>提示：</strong>建议切换到<strong>顶视图</strong>（默认视图）以便更准确地框选。
    </p>

    <h3>第 2 步：排除一楼物品</h3>
    <ol>
      <li>
        切换视图到 <strong>透视视图</strong> 或 <strong>前视图</strong>，调整角度以便看清建筑侧面
      </li>
      <li>
        按住
        <code>Alt</code>
        键的同时，框选一楼的所有物品。此时一楼物品会被减选，仅保留二楼及以上物品被选中
      </li>
    </ol>

    <h3>第 3 步：平移上层建筑</h3>
    <ol>
      <li>在右侧 <strong>变换面板</strong> 中，找到位置属性</li>
      <li>
        <strong>使用相对移动</strong>：在输入框旁边的模式切换中选择"相对"，然后在 X 或 Y
        轴输入一个较大的数值（例如 <code>5000</code>）
      </li>
      <li>保存并覆盖游戏方案</li>
    </ol>
    <p class="text-sm text-muted-foreground">
      <strong>提示：</strong>
      除了平移，你也可以新建一个空白方案，将二楼及以上物品剪切到新方案中，避免直接修改坐标。
    </p>

    <h3>第 4 步：在游戏中装修一楼</h3>
    <ol>
      <li>回到游戏加载方案，此时二楼以上的物品已移至远处，原有区域负载大幅下降</li>
      <li>现在你可以自由地在一楼进行精装修，不再受负载限制干扰</li>
    </ol>

    <h3>第 5 步：还原建筑</h3>
    <ol>
      <li>回到编辑器，重新导入刚才保存的方案</li>
      <li>找到并框选之前被移到远处的那些物品</li>
      <li>在变换面板中反向修改坐标，将其还原到初始位置</li>
      <li>保存回游戏，完工！</li>
    </ol>

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
