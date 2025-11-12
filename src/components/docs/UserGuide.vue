<template>
  <div class="doc-content">
    <h1>使用指南</h1>

    <h2>导入游戏方案</h2>

    <h3>方式一：从游戏目录导入（推荐）</h3>
    <ol>
      <li>点击顶部菜单栏 <strong>文件 &gt; 选择游戏目录</strong></li>
      <li>浏览并选择游戏安装目录的 <code>InfinityNikki</code> 文件夹</li>
      <li>系统会自动加载当前方案，并实时监控文件变化</li>
      <li>在游戏中点击 脱离卡死 后导出建造数据，回到编辑器后导入即可</li>
    </ol>
    <p class="text-sm text-muted-foreground">
      <strong>如何找到游戏安装目录：</strong><br />
      在游戏启动器的「启动游戏」按钮右侧小箭头，点击「打开安装位置」即可获取游戏路径。
    </p>

    <h3>方式二：手动导入 JSON 文件</h3>
    <ol>
      <li>点击顶部菜单栏 <strong>文件 &gt; 导入建造数据</strong></li>
      <li>
        在游戏安装目录下找到建造数据文件：<br />
        <code>InfinityNikki\X6Game\Saved\SavedData\BuildData\BUILD_SAVEDATA_[用户UID].json</code>
      </li>
      <li>选择该 JSON 文件导入，文件会作为新方案标签打开</li>
    </ol>

    <h2>基础操作</h2>

    <h3>选择物品</h3>
    <ul>
      <li><strong>单击</strong>：选中单个物品</li>
      <li><strong>框选</strong>：按住鼠标左键拖拽矩形区域选择</li>
      <!-- <li><strong>添加/取消选择</strong>：<code>Ctrl + 单击</code></li> -->
      <li><strong>添加选择</strong>：<code>Shift + 框选</code></li>
      <li><strong>减选</strong>：<code>Alt + 框选</code>（从当前选择中移除）</li>
      <li><strong>全选可见物品</strong>：<code>Ctrl + A</code></li>
    </ul>

    <h3>移动物品</h3>
    <ul>
      <li><strong>拖拽</strong>：选中物品后，直接拖动即可移动</li>
      <li>
        <strong>精确移动</strong>：选中物品后，按 <code>Ctrl + M</code>
        打开移动对话框，输入具体数值
      </li>
    </ul>

    <h3>复制和删除</h3>
    <ul>
      <li><strong>复制</strong>：<code>Ctrl + C</code> 复制，<code>Ctrl + V</code> 粘贴</li>
      <li>
        <strong>拖拽复制</strong>：选中物品后，按住
        <code>Alt</code> 键拖动鼠标左键，可快速复制并定位到新位置
      </li>
      <li><strong>剪切</strong>：<code>Ctrl + X</code></li>
      <li><strong>删除</strong>：选中物品后按 <code>Delete</code> 键</li>
      <li><strong>跨方案复制</strong>：可以在不同方案标签之间复制粘贴物品</li>
    </ul>

    <h3>画布操作</h3>
    <ul>
      <li><strong>平移</strong>：按住 <code>空格键</code> 然后鼠标左键拖动，或使用鼠标中键拖动</li>
      <li><strong>缩放</strong>：鼠标滚轮，或 <code>Ctrl + =</code> / <code>Ctrl + -</code></li>
      <li><strong>重置视图</strong>：点击菜单栏 <strong>视图 &gt; 重置视图</strong></li>
    </ul>

    <h2>高级功能</h2>

    <h3>组合编辑</h3>
    <p>对多个物品进行成组，可以作为一个整体进行操作：</p>
    <ul>
      <li><strong>成组</strong>：选中多个物品，按 <code>Ctrl + G</code></li>
      <li><strong>解散组</strong>：选中组内物品，按 <code>Ctrl + Shift + G</code></li>
      <li>
        <strong>组的特性</strong>：
        <ul>
          <li>点击组内任意物品，自动选中整组</li>
          <li>移动、复制、删除操作会应用到整组</li>
          <li>组在画布上用彩色边框标识，不同组使用不同颜色</li>
        </ul>
      </li>
    </ul>

    <h3>高度过滤器</h3>
    <p>
      高度过滤器位于右侧边栏顶部，用于按 Z 轴高度（楼层）筛选显示物品。这在编辑多层建筑时特别有用。
    </p>
    <ul>
      <li><strong>滑块控制</strong>：拖动双向滑块调整可见高度范围</li>
      <li><strong>动态范围</strong>：滑块范围会根据实际物品的高度范围自动调整</li>
    </ul>

    <h3>工作坐标系</h3>
    <p>工作坐标系功能允许你旋转画布坐标轴，特别适合编辑斜向布局的建筑（如 45° 摆放的建筑群）。</p>
    <ul>
      <li><strong>启用方式</strong>：菜单栏 <strong>视图 &gt; 工作坐标系设置</strong></li>
      <li><strong>旋转角度</strong>：支持任意角度旋转（常用 45°、90° 等）</li>
      <li><strong>移动操作</strong>：启用后，移动物品会沿旋转后的坐标轴方向进行</li>
    </ul>

    <h3>撤销和重做</h3>
    <ul>
      <li><strong>撤销</strong>：<code>Ctrl + Z</code>，最多保留 50 步历史记录</li>
      <li><strong>重做</strong>：<code>Ctrl + Y</code></li>
      <li><strong>记录的操作</strong>：移动、复制、删除、成组、解散组、精确变换等</li>
    </ul>

    <h3>重复物品检测</h3>
    <p>
      自动检测方案中完全重复的物品（位置、旋转、缩放完全相同），并在底部状态栏显示警告。
      这在原地粘贴后忘记移动时特别有用。
    </p>
    <ul>
      <li><strong>查看提示</strong>：底部状态栏会显示黄色的"X 个重复物品"警告</li>
      <li><strong>一键选中</strong>：点击状态栏提示，自动选中所有重复项（每组保留第一个）</li>
      <li><strong>批量删除</strong>：选中后按 <code>Delete</code> 键清理</li>
    </ul>
    <p class="text-sm text-muted-foreground">
      <strong>提示：</strong>复制粘贴默认保持原坐标不变，粘贴后请记得移动物品到新位置。
    </p>

    <h2>导出和保存</h2>

    <h3>保存到游戏（监控模式）</h3>
    <p>如果你通过"选择游戏目录"导入方案，可以直接保存回游戏：</p>
    <ol>
      <li>编辑完成后，按 <code>Ctrl + S</code> 或点击 <strong>文件 &gt; 保存到游戏</strong></li>
      <li>文件会直接覆盖游戏中的方案文件</li>
      <li>回到游戏，重新加载存档即可看到修改</li>
    </ol>

    <h3>导出为 JSON 文件</h3>
    <ol>
      <li>点击 <strong>文件 &gt; 导出建造数据</strong></li>
      <li>选择保存位置，下载 JSON 文件</li>
      <li>手动复制到游戏目录并重命名，替换原文件</li>
    </ol>

    <h2>常见使用场景</h2>

    <h3>批量移动建筑群</h3>
    <ol>
      <li>框选要移动的所有建筑</li>
      <li>按 <code>Ctrl + M</code> 打开移动对话框</li>
      <li>输入相对偏移量（如：X: 100, Y: 0, Z: 0）</li>
      <li>点击"确认"，所有选中建筑同时移动</li>
    </ol>

    <h3>编辑斜向布局</h3>
    <ol>
      <li>打开 <strong>视图 &gt; 工作坐标系设置</strong></li>
      <li>勾选"启用工作坐标系"，设置角度为 45°</li>
      <li>此时移动物品会沿 45° 方向进行，更符合斜向布局的家园方案</li>
      <li>编辑完成后，可以关闭工作坐标系恢复正常模式</li>
    </ol>

    <h3>按高度编辑多层建筑</h3>
    <ol>
      <li>使用右侧的高度过滤器，筛选出指定高度范围的物品</li>
      <li>在该高度范围内进行编辑（其他高度的物品不可见，不会干扰选择）</li>
      <li>所有高度范围编辑完成后，将过滤器调回完整范围</li>
    </ol>
  </div>
</template>
