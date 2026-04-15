# HTML 导出设计

**日期：** 2026-04-15

**目标**

补齐桌面端 `HTML` 导出能力，导出结果为单文件 `.html`，打开后直接进入只读导图浏览视口，支持拖拽与缩放，不包含任何编辑入口、工具栏、首屏介绍区或保存能力。

---

## 一、需求确认

用户已经确认以下约束：

- 使用模板导出 HTML。
- 导出的 HTML 只保留浏览能力。
- 支持拖动画布与缩放浏览。
- 不保留编辑、保存、工具栏、右键菜单等交互。
- 不增加首屏介绍区，打开文件后直接进入导图视口。
- 需要同步补文档。

---

## 二、现状

当前项目已有以下基础：

- `src/pages/Export/Index.vue` 已具备导出中心 UI、导出状态记忆、预览实例和导出按钮链路。
- `src/services/exportState.js` 已预留 `html` 类型，但当前仍标记为 `disabled`。
- `simple-mind-map` 的导出插件已支持 `svg/json/smm/png/jpg/pdf/xmind/md/txt`。
- 桌面平台层已具备文本文件保存能力，但仅对 `.smm` 暴露了专用 `saveMindMapFileAs`。

当前缺口：

- 没有 HTML 导出服务。
- 没有 HTML 模板。
- 没有通用文本文件另存接口。
- 导出页没有 `html` 分支。

---

## 三、方案选择

### 1. 不采用“完整运行时注入 HTML”

原因：

- 单文件离线 HTML 无法稳定复用应用内动态 `import(...)` 链路。
- `simple-mind-map/full.js` 依赖多个源码模块和样式，直接塞进导出文件会显著扩大体积与失败面。
- 用户需求是“可拖动缩放浏览，无编辑”，并未要求在导出 HTML 中继续运行完整编辑器。

### 2. 采用“SVG 内容 + 只读 HTML 模板壳”

导出流程：

1. 复用现有导出实例生成 SVG 字符串。
2. 将 SVG 嵌入单文件 HTML 模板。
3. 模板只提供：
   - 视口容器
   - 平移
   - 缩放
   - 首次适配
   - 深浅背景和基础加载样式
4. 不提供：
   - 编辑器初始化
   - 顶部工具栏
   - 右键菜单
   - 节点编辑
   - 文件写回

这个方案更贴合需求，也更容易保证离线稳定性。

---

## 四、页面结构

最终导出的 HTML 不包含 header、meta 卡片或说明区，仅保留一个全屏浏览舞台。

推荐结构：

```html
<body>
  <div class="html-export-shell">
    <div class="html-export-stage">
      <div class="html-export-viewport">
        <div class="html-export-canvas">
          <!-- inline svg -->
        </div>
      </div>
    </div>
  </div>
</body>
```

要求：

- `body` 全屏占满。
- 打开即进入 `html-export-stage`。
- `html-export-viewport` 负责裁切与交互。
- `html-export-canvas` 通过 `transform: translate(...) scale(...)` 驱动浏览。

---

## 五、交互设计

### 1. 平移

- 鼠标按下后进入拖拽态。
- 移动时更新 `translateX / translateY`。
- 松开或离开窗口后结束拖拽。

### 2. 缩放

- 鼠标滚轮按光标位置缩放。
- 设置最小缩放与最大缩放，避免无限放大缩小。
- 触控板滚轮同样走统一缩放逻辑。

### 3. 首次适配

- 页面加载完成后，根据 SVG 实际尺寸自动缩放到容器内。
- 居中展示，不额外显示“点击开始”“开始浏览”等首屏元素。

### 4. 只读约束

- `user-select: none` 控制拖拽期间选区污染。
- 不注入任何编辑热键逻辑。
- 不挂接节点点击事件。
- 不显示悬浮工具条。

---

## 六、实现边界

### 涉及文件

- `src/services/htmlExport.js`
- `src/pages/Export/Index.vue`
- `src/services/exportState.js`
- `src/platform/desktop/index.js`
- `src/lang/index.js`
- `tests/export-page-layout.test.mjs`
- `tests/platform-runtime.test.mjs`
- `tests/review-remediation.test.mjs`

### 不做的事

- 不在本轮把 HTML 导出做成可编辑页面。
- 不在导出 HTML 中复刻完整 simple-mind-map 运行时。
- 不添加导图标题栏、导出时间栏、首屏说明面板。

---

## 七、风险与控制

### 风险 1：大图 SVG 初始尺寸不稳定

控制：

- 在模板内读取 SVG `viewBox / width / height` 做首屏 `fit`。
- 提供兜底尺寸解析。

### 风险 2：SVG 交互过程中被浏览器选中

控制：

- 拖拽开始时切换 `grabbing` 状态。
- 容器禁用文本选择。

### 风险 3：HTML 保存链路与 `.smm` 保存接口耦合

控制：

- 平台层新增通用文本文件另存接口，不复用 `.smm` 专用命名逻辑。

---

## 八、验收标准

满足以下条件即视为完成：

- 导出中心中的 `HTML` 格式可选且可导出。
- 导出结果为单文件 `.html`。
- HTML 打开后直接看到导图视口，没有首屏介绍区。
- HTML 内可拖动、滚轮缩放、首次自动适配。
- HTML 内没有编辑、保存、工具栏、右键菜单入口。
- 浏览器环境和桌面环境都能触发 HTML 文件保存或下载。
- `lint`、`typecheck`、目标测试、前端构建通过。
