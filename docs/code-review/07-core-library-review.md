# simple-mind-map 核心库专项审查报告

## 一、API 设计

| 文件 | 行号 | 问题 | 建议 |
|------|------|------|------|
| `index.js:39` | 构造函数无运行时类型校验 | 对 `el` 和 `data` 做类型断言 |
| `index.js:804-847` | `MindMap.pluginList` 是公开可变数组 | 使用 `Object.freeze()` 保护 |
| `index.js` | 方法命名不一致（`delete` vs `remove`） | 统一使用 `remove` |
| `index.js:456-476` | `setData` 和 `updateData` 语义混淆 | 重命名为 `replaceData`/`patchData` |

---

## 二、插件系统

| 问题 | 建议 |
|------|------|
| 插件通过 `preload` 二分法区分初始化时机，不够灵活 | 引入标准生命周期钩子：`beforeInit`, `afterInit`, `beforeDestroy` |
| 插件实例直接挂载到 `mindMap[plugin.instanceName]`，存在命名冲突 | 使用 `Symbol` 或命名空间隔离 |
| 插件间存在隐式依赖（Export 依赖 RichText） | 引入依赖声明机制 |
| 插件卸载仅调用 `beforePluginRemove`，无 `onPluginRemove` | 添加完整生命周期钩子 |

---

## 三、渲染性能

| 文件 | 问题 | 建议 |
|------|------|------|
| `Render.js:163-178` | 性能模式 `checkIsInClient()` 每次获取 `transform()`，重复计算 | 缓存 transform 值 |
| `Render.js:163` | 视图变化使用 `throttle(250ms)`，拖动/缩放有 250ms 延迟 | 使用 `requestAnimationFrame` |
| `MindMapNode.js:606-681` | `removeNodeWhenOutCanvas: true` 时频繁创建/销毁节点 | 保留 SVG 节点设置 `display: none` |
| `utils/index.js:153-159` | `simpleDeepClone` 使用 `JSON.parse(JSON.stringify())` | 使用 `structuredClone()` |
| - | 无虚拟滚动，10000+ 节点时 O(n) 遍历 | 建立空间索引（四叉树） |

---

## 四、LRU 缓存 Bug

**文件**: `utils/Lru.js`

| 问题 | 修复 |
|------|------|
| `get()` 未实现"最近使用"语义，退化为 FIFO | 获取时移到 Map 末尾 |
| `add()` 超出 max 时直接拒绝添加，新节点永远无法进入缓存 | 超限时淘汰最旧条目 |

---

## 五、内存管理

| 文件 | 问题 | 建议 |
|------|------|------|
| `MindMapNode.js:705-719` | `destroy()` 未显式调用 `group.off()` 和 `group.clear()` | 显式清理事件和子节点 |
| `utils/index.js` | 多处模块级单例 DOM 元素在 `destroy()` 时不清理 | 提供清理机制 |
| `Style.js:29-34` | `Style.cacheStyle` 是静态属性，多实例场景下背景样式恢复会错乱 | 改为按实例缓存（WeakMap） |
| `index.js:777-804` | `destroy()` 未清理 `this.draw`、`this.lineDraw` 等 SVG 引用 | 添加清理逻辑 |

---

## 六、事件系统

| 文件 | 问题 | 建议 |
|------|------|------|
| `Event.js` | 事件命名不统一（下划线 vs 驼峰） | 统一命名风格 |
| `Event.js:65-78` | `unbind()` 缺少 `svg.off('mousedown')` 清理 | 补全 |
| `KeyCommand.js:184` | 使用已废弃的 `e.keyCode` | 迁移到 `e.code` |

---

## 七、命令模式

| 文件 | 问题 | 建议 |
|------|------|------|
| `Command.js:105-133` | 历史记录采用全量快照，500 条可能占用数百 MB | 实现增量/差异历史或压缩 |
| `Command.js:95` | `remove()` 使用 `find()` 返回元素而非索引，`splice` 删除错误位置 | 修复为 `findIndex` |
| `Command.js:200-256` | `data_change_detail` 每次执行 O(n) 深度对比 | 使用懒计算或增量 diff |

---

## 八、工具函数

| 文件 | 问题 | 建议 |
|------|------|------|
| `utils/index.js:1621-1663` | `defenseXSS` 使用正则过滤 HTML，公认不安全的 XSS 防护方式 | 使用 DOMPurify 或删除此函数 |
| `utils/index.js:281-292` | `throttle` 缺少 leading/trailing 选项 | 使用 `lodash.throttle` 或完善实现 |
| `utils/index.js:780-784` | `isMobile()` 使用 UA 检测（不推荐） | 使用 `navigator.userAgentData` |
| `utils/index.js:1556-1591` | 全屏 API 包含 IE 前缀检测 | 移除 IE 相关代码 |
| `utils/index.js:47-68` | BFS 遍历中 `forEach` 内的 `return` 无法跳出外层循环 | 修复循环逻辑 |

---

## 九、打包和发布

| 问题 | 建议 |
|------|------|
| 没有 `build` 脚本 | 添加完整构建流程 |
| `main` 指向 `dist/simpleMindMap.umd.min.js`，`module` 指向 `index.js`（未转译） | 提供 ESM 和 CJS 两种格式 |
| 缺少 `exports` 字段 | 添加 Node.js 12.7+ 推荐的 exports 字段 |
| 类型定义文件缺失（`types/` 目录不存在） | 编写完整 `.d.ts` 或使用 JSDoc + `tsc --emitDeclarationOnly` |
| `uuid` 依赖不必要（~13KB） | 使用 `crypto.randomUUID()` |

---

## 十、核心算法

| 算法 | 状态 | 问题 |
|------|------|------|
| 思维导图布局 (`MindMap.js`) | ✅ 正确 | `updateBrothers()` 递归可能栈溢出，建议改为迭代 |
| 贝塞尔曲线连线 (`Base.js`) | ✅ 正确 | 二次贝塞尔控制点固定比例，大节点间可能不平滑 |
| 鱼骨图布局 (`Fishbone.js`) | ⚠️ | 硬编码 SVG path，缩放时可能变形 |
| 矩形碰撞检测 (`utils/index.js:944-956`) | ✅ 正确 | 边界接触不认为重叠（正确行为） |
| View.js 方向判断 | ❌ | `CONSTANTS.DIR.UP || CONSTANTS.DIR.LEFT` 逻辑错误，左侧值永远为真 |

---

## 十一、边界情况

| 场景 | 状态 | 建议 |
|------|------|------|
| 空数据 | ✅ `handleData()` 正确处理 | - |
| 超大节点 | ⚠️ 无尺寸上限 | 添加 `maxNodeWidth`/`maxNodeHeight` |
| 深层嵌套 | ⚠️ 递归 `walk` 可能栈溢出 | 改为迭代实现 |
| Canvas 尺寸限制 | ✅ `maxCanvasSize: 16384` | - |

---

## 十二、综合评分

| 维度 | 评分 (1-10) | 关键问题 |
|------|------------|---------|
| API 设计 | 6 | 命名不一致，静态方法挂载不优雅 |
| 插件系统 | 6 | 缺乏依赖管理和完整生命周期 |
| 渲染性能 | 5 | 性能模式粗糙，无虚拟滚动，LRU 有 bug |
| 内存管理 | 5 | 节点销毁不彻底，全量快照占内存 |
| 事件系统 | 7 | EventEmitter3 设计合理，命名不一致 |
| 命令模式 | 5 | 全量快照内存大，remove 方法有 bug |
| 工具函数 | 5 | XSS 防御函数有严重漏洞 |
| 打包配置 | 4 | 缺少构建配置，类型文件缺失 |
| 类型定义 | 1 | 完全缺失 |
| 核心算法 | 7 | 布局算法正确，递归可能栈溢出，View.js 方向判断有逻辑错误 |

---

## P0 级问题（需立即修复）

1. `src/core/view/View.js:104` — `CONSTANTS.DIR.UP || CONSTANTS.DIR.LEFT` 逻辑错误
2. `src/core/render/node/Style.js:29` — `Style.cacheStyle` 静态属性多实例错乱
3. `src/core/command/Command.js:95` — `remove()` 使用 `find()` 而非 `findIndex()`
