# simple-mind-map 核心库代码审查报告

## 基本信息

| 项目 | 值 |
|------|-----|
| 库名称 | simple-mind-map |
| 版本 | 0.14.0-fix.2 |
| 许可证 | MIT |
| 审查日期 | 2026-04-01 |

---

## 1. 库的 API 设计

### 1.1 入口设计合理但存在混淆
- **文件**: `index.js` / `full.js`
- **问题**: `index.js` 导出核心 `MindMap` 类，`full.js` 预注册所有插件后导出。用户不清楚应该导入哪个入口。
- **建议**: 在 README 中明确区分两种入口的适用场景，或提供命名导出如 `MindMapCore` 和 `MindMapFull`。

### 1.2 静态方法与实例方法混用
- **文件**: `index.js:824-867`
- **问题**: `MindMap.usePlugin`、`MindMap.defineTheme` 等静态方法挂载在类上，而 `setTheme`、`setLayout` 等为实例方法。静态的 `pluginList` 是全局共享的，多个 MindMap 实例会共享同一份插件列表，这在多实例场景下可能导致意外行为。
- **建议**: 将插件列表改为实例级别，或明确文档说明插件的全局共享特性。

### 1.3 链式调用支持不完整
- **文件**: `index.js:842-847`
- **现状**: `usePlugin` 返回 `MindMap` 类支持链式调用，但实例方法（如 `setTheme`、`setLayout`）不返回 `this`。
- **建议**: 实例方法统一返回 `this` 以支持链式调用。

### 1.4 缺少命名空间隔离
- **文件**: `full.js:29-34`
- **问题**: `MindMap.xmind`、`MindMap.markdown`、`MindMap.iconList`、`MindMap.constants`、`MindMap.defaultTheme`、`MindMap.version` 直接挂载在类上，与插件方法命名空间冲突风险高。
- **建议**: 使用命名空间对象聚合，如 `MindMap.parsers.xmind`、`MindMap.parsers.markdown`。

---

## 2. 插件系统设计

### 2.1 插件接口约定不清晰
- **文件**: `index.js:768-774`
- **问题**: 插件实例化仅要求 `plugin.instanceName` 属性，但 `beforePluginRemove` 和 `beforePluginDestroy` 是可选的。没有正式的接口定义或类型约束。
- **建议**: 定义 `Plugin` 接口/基类，明确生命周期钩子签名。

### 2.2 插件热插拔能力有限
- **文件**: `index.js:754-765`
- **问题**: `removePlugin` 仅删除实例和从 `pluginList` 移除，但不清理插件可能注册的事件监听器、命令、快捷键等。
- **建议**: 插件应提供 `dispose` 方法，在 `removePlugin` 中统一调用，清理所有副作用。

### 2.3 插件间依赖关系未管理
- **文件**: `full.js:36-56`
- **问题**: 插件注册顺序是硬编码的，没有声明依赖关系。例如 `RichText` 插件可能被其他插件依赖，但没有机制保证加载顺序。
- **建议**: 引入插件依赖声明机制，如 `plugin.dependencies = ['richText']`。

### 2.4 插件实例挂载方式不安全
- **文件**: `index.js:770`
```javascript
this[plugin.instanceName] = new plugin({ mindMap: this, pluginOpt: plugin.pluginOpt })
```
- **问题**: 使用 `instanceName` 字符串作为属性名直接挂载到实例上，可能与 MindMap 内部属性名冲突。
- **建议**: 使用专用 `plugins` 对象存储插件实例：`this.plugins[plugin.instanceName] = ...`

---

## 3. 渲染性能

### 3.1 防抖渲染实现正确但存在边界问题
- **文件**: `src/core/render/Render.js:553-558`
```javascript
render(callback, source) {
    this.addRenderParams(callback, source)
    clearTimeout(this.renderTimer)
    this.renderTimer = setTimeout(() => {
      this._render()
    }, 0)
}
```
- **问题**: 使用 `setTimeout(..., 0)` 而非 `requestAnimationFrame`，在高频触发场景下可能导致帧率不稳定。
- **建议**: 使用 `requestAnimationFrame` 替代 `setTimeout`。

### 3.2 性能模式的 LRU 缓存未真正 LRU
- **文件**: `src/utils/Lru.js:9-28`
- **问题**: `get` 方法没有更新访问顺序，`add` 方法中删除再添加的操作在 Map 中确实能更新顺序，但 `get` 没有调用 `delete` + `set` 来更新最近使用顺序，实际上退化为 FIFO。
- **建议**: 在 `get` 方法中添加 LRU 更新逻辑：
```javascript
get(key) {
    if (this.pool.has(key)) {
        const value = this.pool.get(key)
        this.pool.delete(key)
        this.pool.set(key, value)
        return value
    }
}
```

### 3.3 节点树遍历时重复创建对象
- **文件**: `src/core/render/Render.js:591-598`
- **问题**: 每次渲染都会遍历 `lastNodeCache` 检查不再需要的节点并调用 `destroy()`，在大型树中这会成为性能瓶颈。
- **建议**: 使用增量 diff 算法，仅对比变化的子树。

### 3.4 `simpleDeepClone` 的 JSON 序列化性能问题
- **文件**: `src/utils/index.js:153-159`
```javascript
export const simpleDeepClone = data => {
  try {
    return JSON.parse(JSON.stringify(data))
  } catch (error) {
    return null
  }
}
```
- **问题**: 在 `getData`、`getCopyData`、`setData` 等高频路径中使用 JSON 序列化进行深拷贝，大数据量下性能差。且会丢失 `undefined`、`Date`、`RegExp`、`Map`、`Set` 等特殊类型。
- **建议**: 在性能敏感路径使用结构化克隆 `structuredClone()`（现代浏览器支持）或更高效的深拷贝方案。

---

## 4. 内存管理

### 4.1 `destroy` 方法清理不完整
- **文件**: `index.js:777-804`
- **问题**:
  - `this.svg.remove()` 删除 SVG 元素，但 `@svgdotjs/svg.js` 内部可能还有引用
  - `this.el = null` 置空容器引用，但 `this.draw`、`this.lineDraw`、`this.nodeDraw`、`this.otherDraw`、`this.associativeLineDraw` 等 SVG 对象引用未清理
  - `this.commonCaches` 中的测量元素引用未清理
  - `this.cssTextMap` 未清理
- **建议**: 完整清理所有引用：
```javascript
destroy() {
    // ... 现有代码
    this.draw = null
    this.lineDraw = null
    this.nodeDraw = null
    this.otherDraw = null
    this.associativeLineDraw = null
    this.svg = null
    this.commonCaches = null
    this.cssTextMap = null
    // ...
}
```

### 4.2 全局单例缓存导致内存泄漏
- **文件**: `src/utils/index.js:341-359`
```javascript
let measureTextContext = null
export const measureText = (...) => {
    if (!measureTextContext) {
        const canvas = document.createElement('canvas')
        measureTextContext = canvas.getContext('2d')
    }
    // ...
}
```
- **问题**: `measureTextContext` 是模块级单例，持有 canvas 2D 上下文引用，永远不会被 GC。虽然这是有意为之的性能优化，但在 SSR 或测试环境中可能有问题。
- **建议**: 添加 `dispose` 方法用于清理。

- **同类问题文件**:
  - `src/utils/index.js:431-438`: `getTextFromHtmlEl`
  - `src/utils/index.js:455-463`: `nodeToHTMLWrapEl`
  - `src/utils/index.js:533-555`: `addHtmlStyleEl`
  - `src/utils/index.js:558-568`: `checkIsRichTextEl`
  - `src/utils/index.js:571-596`: `replaceHtmlTextEl`
  - `src/utils/index.js:599-610`: `removeHtmlNodeByClassEl`
  - `src/utils/index.js:673-696`: `nodeRichTextToTextWithWrapEl`
  - `src/utils/index.js:699-731`: `textToNodeRichTextWithWrapEl`
  - `src/utils/index.js:736-777`: `removeRichTextStyesEl`

### 4.3 Style.cacheStyle 多实例冲突
- **文件**: `src/core/render/node/Style.js:26-53`
```javascript
static setBackgroundStyle(el, themeConfig) {
    if (!Style.cacheStyle) {
        Style.cacheStyle = {}
        let style = window.getComputedStyle(el)
        // ...
    }
}
```
- **问题**: `Style.cacheStyle` 是类级别的静态属性，多个 MindMap 实例会共享同一个缓存。第二个实例初始化时不会缓存自己的原始样式，`removeBackgroundStyle` 恢复的是第一个实例的样式。
- **建议**: 将缓存改为实例级别或使用 WeakMap 以元素为键。

---

## 5. 事件系统设计

### 5.1 事件继承 EventEmitter3 但封装不完整
- **文件**: `src/core/event/Event.js:1-5`
- **问题**: `Event` 类继承自 `EventEmitter3`，但 `MindMap` 类仅代理了 `on`、`emit`、`off` 三个方法。`EventEmitter3` 的 `once`、`listeners`、`listenerCount`、`removeAllListeners` 等方法未暴露。
- **建议**: 暴露更多 EventEmitter 方法，或直接让 `MindMap` 继承 `EventEmitter3`。

### 5.2 事件命名不一致
- **文件**: 多处
- **问题**: 事件命名风格不统一：
  - 下划线命名: `node_mouseenter`, `svg_mouseenter`, `draw_click`, `body_mousedown`
  - 驼峰命名: `nodeActive`, `dataChange`（emit 的 `node_active`, `data_change` 实际也是下划线）
  - 混合: `back_forward`, `view_theme_change`, `layout_change`
- **建议**: 统一使用一种命名约定（推荐下划线，与现有大部分事件一致）。

### 5.3 事件冒泡控制不精确
- **文件**: `src/core/event/Event.js:148-169`
```javascript
onMousewheel(e) {
    e.stopPropagation()
    e.preventDefault()
    // ...
}
```
- **问题**: 鼠标滚轮事件无条件 `stopPropagation` 和 `preventDefault`，会阻止页面其他组件接收滚轮事件。
- **建议**: 提供选项控制是否阻止默认行为。

---

## 6. 命令模式实现

### 6.1 命令注册机制过于简单
- **文件**: `src/core/command/Command.js:78-84`
```javascript
add(name, fn) {
    if (this.commands[name]) {
        this.commands[name].push(fn)
    } else {
        this.commands[name] = [fn]
    }
}
```
- **问题**: 
  - 一个命令名可以注册多个处理函数，执行顺序依赖注册顺序，没有优先级机制
  - 没有命令的 undo/redo 支持，历史记录是整棵树快照而非操作命令
  - `remove` 方法使用 `find` 而非 `findIndex`（第95行），导致 `splice` 可能出错
- **建议**: 修复 `remove` 方法的 bug：
```javascript
remove(name, fn) {
    if (!this.commands[name]) return
    if (!fn) {
        delete this.commands[name]
    } else {
        const index = this.commands[name].findIndex(item => item === fn)
        if (index !== -1) {
            this.commands[name].splice(index, 1)
        }
    }
}
```

### 6.2 历史记录使用全量快照
- **文件**: `src/core/command/Command.js:105-133`
- **问题**: 每次 `addHistory` 都序列化整棵节点树 (`JSON.stringify`)，对于大型思维导图（1000+ 节点），每次操作都存储完整快照会消耗大量内存。
- **建议**: 实现增量式操作记录（Operation-based CRDT 或 Command pattern with undo），仅存储变更操作而非全量快照。

### 6.3 addHistory 节流可能导致数据丢失
- **文件**: `src/core/command/Command.js:23-27`
```javascript
this.addHistory = throttle(
    this.addHistory,
    this.mindMap.opt.addHistoryTime,
    this
)
```
- **问题**: 节流函数在节流期间会丢弃中间调用。如果用户在 `addHistoryTime`（默认100ms）内执行了多个操作，只有第一次会被记录，后续操作会丢失。
- **建议**: 使用防尾节流（trailing throttle）或记录最后一次调用，在节流结束后执行。

---

## 7. 默认配置

### 7.1 配置对象过于庞大
- **文件**: `src/constants/defaultOptions.js`（523行）
- **问题**: 所有配置集中在一个巨大对象中，包含核心配置和所有插件配置。即使用户不使用某些插件，这些配置仍会参与合并计算。
- **建议**: 将插件配置拆分到各插件模块中，按需合并。

### 7.2 配置合并使用 deepmerge 但存在特殊处理
- **文件**: `index.js:32-48`
```javascript
const mergeOptionsPreservingEl = (...sources) => {
    const preservedEl = [...sources]
        .reverse()
        .find(source => source && typeof source === 'object' && source.el)?.el
    // ...
}
```
- **问题**: 专门为 `el` 属性做了保留处理，说明 deepmerge 的行为不符合预期。这种特例处理增加了维护成本。
- **建议**: 考虑使用自定义合并策略或在文档中明确 `el` 的特殊行为。

### 7.3 部分配置缺少边界校验
- **文件**: `src/constants/defaultOptions.js:27-29`
```javascript
minZoomRatio: 20,
maxZoomRatio: 400,
```
- **问题**: `minZoomRatio` 最小为 0，`maxZoomRatio` 传 -1 代表不限制，但没有在配置合并时做校验。
- **建议**: 在 `handleOpt` 中添加配置校验逻辑。

---

## 8. 工具函数质量

### 8.1 `throttle` 实现有缺陷
- **文件**: `src/utils/index.js:281-292`
```javascript
export const throttle = (fn, time = 300, ctx) => {
    let timer = null
    return (...args) => {
        if (timer) {
            return  // 节流期间直接丢弃
        }
        timer = setTimeout(() => {
            fn.call(ctx, ...args)
            timer = null
        }, time)
    }
}
```
- **问题**: 这是"前缘节流"，节流期间的所有调用都被丢弃，没有 trailing 调用。对于用户交互（如拖拽、滚动），通常需要在节流结束后执行最后一次。
- **建议**: 添加 `leading` 和 `trailing` 选项，参考 lodash 的 throttle 实现。

### 8.2 `debounce` 实现缺少 leading 和 maxWait 支持
- **文件**: `src/utils/index.js:295-305`
- **问题**: 简单实现，不支持 `leading` 调用和 `maxWait` 限制。在某些场景下（如持续输入），回调可能永远不执行。
- **建议**: 使用成熟的 debounce 实现或添加 `maxWait` 参数。

### 8.3 `isSameObject` 存在循环引用风险
- **文件**: `src/utils/index.js:1083-1126`
- **问题**: 递归比较对象/数组，没有循环引用检测。如果数据中存在循环引用，会导致栈溢出。
- **建议**: 添加 `WeakSet` 追踪已访问对象。

### 8.4 `defenseXSS` 实现不安全
- **文件**: `src/utils/index.js:1621-1663`
- **问题**: 
  - 使用正则表达式过滤 HTML 标签和属性，这是公认不安全的 XSS 防护方式
  - 白名单仅包含 `style`、`target`、`href`，但 `style` 属性本身可以包含 XSS 向量（如 `expression()`、`url(javascript:...)`）
  - 仅检查 `javascript:` 协议，忽略了 `vbscript:`、`data:` 等其他危险协议
- **建议**: 使用成熟的 XSS 过滤库如 `DOMPurify`。

### 8.5 `checkIsRichText` 判断不准确
- **文件**: `src/utils/index.js:559-568`
```javascript
export const checkIsRichText = str => {
    checkIsRichTextEl.innerHTML = str
    for (let c = checkIsRichTextEl.childNodes, i = c.length; i--; ) {
        if (c[i].nodeType == 1) return true
    }
    return false
}
```
- **问题**: 任何包含 HTML 标签的字符串都会被认为是富文本，包括 `<br>`、`<span>` 等简单标签。纯文本中的 `<` 和 `>` 字符也会被误判。
- **建议**: 使用更精确的判断标准，如检查是否存在块级元素。

---

## 9. 库的打包和发布配置

### 9.1 缺少构建步骤
- **文件**: `package.json`
- **问题**: 
  - 没有 `build` 脚本
  - `main` 指向 `./dist/simpleMindMap.umd.min.js`，但 dist 目录不在源码中（需要预构建）
  - `module` 指向 `index.js`（ESM 源码），但源码包含 JSX 和现代 JS 语法，需要转译
  - 没有 `exports` 字段定义条件导出
- **建议**: 添加完整的构建流程，使用 Rollup 或 Vite 打包，生成 UMD、ESM、CJS 三种格式。

### 9.2 依赖管理问题
- **文件**: `package.json:30-44`
- **问题**:
  - 所有依赖都在 `dependencies` 中，包括 `ws`（Node.js WebSocket 库）、`y-webrtc`、`yjs` 等。这些在浏览器环境中不需要，会增加打包体积
  - `quill` 固定为 `2.0.2`，限制了用户的 Quill 版本选择
  - 没有 `peerDependencies` 声明
- **建议**: 
  - 将浏览器不需要的依赖移到 `optionalDependencies` 或提供 lite 版本
  - 将 `quill` 等可选插件的依赖声明为 `peerDependencies`

### 9.3 缺少 ESModule 和 CommonJS 双格式支持
- **文件**: `package.json:28-29`
- **问题**: 仅声明了 `main`（UMD）和 `module`（ESM 源码），没有 `exports` 字段，现代打包工具可能无法正确解析。
- **建议**: 添加 `exports` 字段：
```json
{
    "exports": {
        ".": {
            "import": "./dist/simpleMindMap.esm.js",
            "require": "./dist/simpleMindMap.cjs.js",
            "browser": "./dist/simpleMindMap.umd.min.js"
        }
    }
}
```

### 9.4 类型定义生成方式粗糙
- **文件**: `package.json:25`
```json
"types": "npx -p typescript tsc index.js --declaration --allowJs --emitDeclarationOnly --outDir types --target es2017 --skipLibCheck & node ./bin/createPluginsTypeFiles.js"
```
- **问题**: 
  - 使用 `tsc --allowJs` 从 JS 生成类型定义，质量无法保证
  - 生成的类型定义可能不完整或不准确
  - `types` 目录不在仓库中，需要手动生成
- **建议**: 使用 JSDoc 注释增强类型推断，或直接使用 TypeScript 重写核心代码。

---

## 10. 类型定义完整性

### 10.1 类型定义文件缺失
- **文件**: `types/` 目录不存在
- **问题**: `package.json` 声明了 `types: "./types/index.d.ts"`，但 types 目录不存在于仓库中。用户安装后无法获得类型提示。
- **建议**: 将生成的类型定义文件提交到仓库，或使用 TypeScript 重写。

### 10.2 缺少核心 API 的类型定义
- **问题**: 即使生成了类型定义，从 JS 自动生成的类型定义通常缺少：
  - 方法参数的详细类型
  - 回调函数的参数类型
  - 事件名称和回调类型的映射
  - 配置选项的联合类型
- **建议**: 手动编写 `.d.ts` 文件，提供完整的类型定义。

---

## 11. 核心算法的正确性

### 11.1 鱼骨图布局复杂度
- **文件**: `src/layouts/Fishbone.js`
- **问题**: 鱼骨图布局算法涉及复杂的节点定位和连线计算，代码中大量使用魔法数字和硬编码偏移量。
- **建议**: 增加单元测试覆盖布局算法的各种边界情况。

### 11.2 节点拖拽检测逻辑复杂
- **文件**: `src/plugins/Drag.js:397-469`
- **问题**: `checkOverlapNode` 方法针对不同布局结构有不同的处理逻辑，代码分支极多，容易出现遗漏。
- **建议**: 抽象统一的碰撞检测接口，各布局实现自己的检测策略。

### 11.3 View 类中的逻辑错误
- **文件**: `src/core/view/View.js:102-114`
```javascript
case dirs.includes(CONSTANTS.DIR.UP || CONSTANTS.DIR.LEFT):
    mousewheelZoomActionReverse
        ? this.enlarge(cx, cy, isTouchPad)
        : this.narrow(cx, cy, isTouchPad)
    break
case dirs.includes(CONSTANTS.DIR.DOWN || CONSTANTS.DIR.RIGHT):
```
- **问题**: `CONSTANTS.DIR.UP || CONSTANTS.DIR.LEFT` 表达式永远等于 `'up'`（因为 `'up'` 是真值），`CONSTANTS.DIR.LEFT` 永远不会被计算。这是一个逻辑错误。
- **建议**: 修正为：
```javascript
case dirs.includes(CONSTANTS.DIR.UP) || dirs.includes(CONSTANTS.DIR.LEFT):
```

### 11.4 BFS 遍历的 `isStop` 检查时机
- **文件**: `src/utils/index.js:47-68`
```javascript
export const bfsWalk = (root, callback) => {
    let stack = [root]
    let isStop = false
    if (callback(root, null) === 'stop') {
        isStop = true
    }
    while (stack.length) {
        if (isStop) break
        let cur = stack.shift()
        if (cur.children && cur.children.length) {
            cur.children.forEach(item => {
                if (isStop) return  // 这里的 return 只退出 forEach 回调
                stack.push(item)
                if (callback(item, cur) === 'stop') {
                    isStop = true
                }
            })
        }
    }
}
```
- **问题**: `forEach` 中的 `return` 不会退出外层循环，`isStop` 设置后仍会继续遍历当前层级的剩余子节点。
- **建议**: 使用 `for...of` 替代 `forEach`：
```javascript
for (const item of cur.children) {
    if (isStop) break
    stack.push(item)
    if (callback(item, cur) === 'stop') {
        isStop = true
    }
}
```

---

## 12. 边界情况处理

### 12.1 容器元素尺寸为 0 时抛出异常
- **文件**: `index.js:338-339`
```javascript
if (this.width <= 0 || this.height <= 0)
    throw new Error('容器元素el的宽高不能为0')
```
- **问题**: 如果容器元素在初始化时 `display: none` 或尚未渲染，`getBoundingClientRect` 返回 0，直接抛异常。这在 SSR 或延迟渲染场景中很常见。
- **建议**: 提供重试机制或延迟初始化选项。

### 12.2 空数据处理不一致
- **文件**: `index.js:199-209`
```javascript
handleData(data) {
    if (isUndef(data) || Object.keys(data).length <= 0) return null
    // ...
}
```
- **问题**: `isUndef` 检查 `null`、`undefined`、空字符串，但 `Object.keys(data)` 在 `data` 为 `null` 时会抛异常（虽然前面的 `isUndef` 会先拦截）。逻辑顺序正确但可读性差。
- **建议**: 明确区分不同类型的空值处理。

### 12.3 导出时水印处理的竞态条件
- **文件**: `index.js:637-664`
- **问题**: 水印导出涉及临时修改 `this.width`、`this.height`、调用 `onResize`、克隆 SVG、恢复尺寸等一系列操作。如果过程中抛出异常，可能无法恢复原始状态。
- **建议**: 使用 try-finally 确保状态恢复。

### 12.4 剪贴板 API 在非 HTTPS 环境下不可用
- **文件**: `src/utils/index.js:1129-1131`
```javascript
export const checkClipboardReadEnable = () => {
    return navigator.clipboard && typeof navigator.clipboard.read === 'function'
}
```
- **问题**: 代码注释中提到了这个问题（Render.js:208-215），但被注释掉的备用方案没有启用。在非 HTTPS 环境下，复制粘贴功能完全失效。
- **建议**: 提供基于 `document.execCommand('paste')` 的降级方案或明确文档说明 HTTPS 要求。

### 12.5 `getChromeVersion` 正则不可靠
- **文件**: `src/utils/index.js:1200-1206`
```javascript
export const getChromeVersion = () => {
    const match = navigator.userAgent.match(/\s+Chrome\/(.*)\s+/)
    // ...
}
```
- **问题**: UA 字符串中可能包含多个 `Chrome/` 片段（如 Edge 的 UA 也包含 Chrome），正则可能匹配到错误的版本。
- **建议**: 使用更精确的 UA 解析或 `navigator.userAgentData` API。

---

## 13. 代码复用和模块化

### 13.1 MindMapNode 类使用原型混入
- **文件**: `src/core/render/node/MindMapNode.js:120-164`
```javascript
const proto = Object.getPrototypeOf(this)
if (!proto.bindEvent) {
    Object.keys(nodeLayoutMethods).forEach(item => {
        proto[item] = nodeLayoutMethods[item]
    })
    // ...
}
```
- **问题**: 在构造函数中动态向原型添加方法，这是反模式。所有实例共享原型，第一次实例化后所有后续实例都会获得这些方法，但代码意图不清晰。
- **建议**: 使用类继承或组合模式，或将方法定义在类声明中。

### 13.2 布局类继承关系不清晰
- **文件**: `src/layouts/Base.js` 及各子类
- **问题**: `Drag` 插件继承自 `Base` 布局类（`src/plugins/Drag.js:13`），但 Drag 不是布局，这种继承关系语义不正确。
- **建议**: 提取公共工具方法到独立的 mixin 或工具类，让 Drag 组合使用而非继承。

### 13.3 大量重复的节点创建逻辑
- **文件**: `src/core/render/Render.js`
- **问题**: `insertNode`、`insertChildNode`、`insertParentNode`、`insertMultiNode`、`insertMultiChildNode` 等方法有大量重复代码（参数处理、富文本检测、行为获取等）。
- **建议**: 提取公共的节点创建逻辑到辅助方法中。

### 13.4 工具函数文件过于臃肿
- **文件**: `src/utils/index.js`（1721行）
- **问题**: 所有工具函数集中在一个文件中，包括树遍历、图片处理、HTML处理、剪贴板操作、全屏操作、颜色判断等，职责过多。
- **建议**: 按功能拆分为多个模块：`tree.js`、`image.js`、`html.js`、`clipboard.js`、`color.js`、`fullscreen.js` 等。

### 13.5 常量定义分散
- **文件**: `src/constants/constant.js`、`src/constants/defaultOptions.js`、`src/theme/default.js`
- **问题**: 常量分散在多个文件中，如 `lineStyleProps` 在 `default.js` 中，`nodeDataNoStylePropList` 在 `constant.js` 中。
- **建议**: 统一常量管理，按类型组织。

---

## ESLint 配置审查

### 文件: `.eslintrc.js`
- **问题**:
  - `rules` 为空对象，没有任何 lint 规则
  - 使用 `babel-eslint` 解析器但项目中没有 babel 依赖
  - `ecmaVersion: 12` 较旧
- **建议**: 配置有意义的 lint 规则，至少包括：
  - `no-unused-vars`
  - `no-console`（或限制使用场景）
  - `eqeqeq`
  - `no-var`
  - `prefer-const`

---

## 总结与优先级建议

| 优先级 | 问题 | 影响 |
|--------|------|------|
| P0 | View.js:102 逻辑错误 (`UP || LEFT`) | 触控板左右滑动缩放行为不正确 |
| P0 | Style.cacheStyle 多实例冲突 | 多实例场景下背景样式恢复错误 |
| P0 | `remove` 方法使用 `find` 而非 `findIndex` | 命令移除功能异常 |
| P1 | BFS `isStop` 检查时机 | 提前终止遍历可能不完整 |
| P1 | `defenseXSS` 实现不安全 | XSS 防护形同虚设 |
| P1 | `destroy` 方法清理不完整 | 内存泄漏 |
| P1 | LRU 缓存未真正 LRU | 缓存效率降低 |
| P2 | 工具函数文件臃肿 | 可维护性差 |
| P2 | 类型定义缺失 | 开发体验差 |
| P2 | 缺少构建步骤 | 发布包可能不完整 |
| P3 | 插件系统设计改进 | 扩展性受限 |
| P3 | 命令模式改进 | 撤销/重做效率低 |
